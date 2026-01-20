const axios = require('axios');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const BATCH_SIZE_PER_CATEGORY = 10; // Start small for testing, change to 166 for ~500 total
const SERVICE_ACCOUNT_KEY_PATH = path.join(__dirname, 'serviceAccountKey.json');

// --- CATEGORIES TO FETCH ---
const TARGETS = [
    { topic: "Short Stories", category: "stories" },
    { topic: "Poetry", category: "poems" },
    { topic: "Essays", category: "essays" }
];

// Load current stats or initialize
let globalStats = { poems: 0, stories: 0, essays: 0 };
let skipCache = new Set(); // Cache of IDs to skip
let existingCache = new Set(); // Cache of IDs already in library

async function loadStats() {
    try {
        const doc = await db.collection('meta').doc('stats').get();
        if (doc.exists) {
            globalStats = doc.data();
            console.log("Loaded stats:", globalStats);
        }
        
        // Load skipped items cache
        const skipDoc = await db.collection('meta').doc('skipped').get();
        if (skipDoc.exists) {
            const skippedIds = skipDoc.data().gutenbergIds || [];
            skippedIds.forEach(id => skipCache.add(id));
            console.log(`Loaded ${skipCache.size} skipped items.`);
        }

        // Load existing library IDs to avoid DB lookups
        console.log("Loading existing library index...");
        const librarySnap = await db.collection('library').select('gutenbergId').get();
        librarySnap.forEach(doc => {
            const data = doc.data();
            if (data.gutenbergId) existingCache.add(data.gutenbergId);
        });
        console.log(`Loaded ${existingCache.size} existing books in library.`);

    } catch (e) {
        console.warn("Could not load stats, starting fresh.", e);
    }
}

async function markAsSkipped(gutenbergId, reason) {
    if (skipCache.has(gutenbergId)) return;
    
    skipCache.add(gutenbergId);
    console.warn(`⚠️ Skipped ID ${gutenbergId}: ${reason}`);
    
    // Persist to DB periodically or immediately
    // Using array-union to append atomically
    try {
        await db.collection('meta').doc('skipped').set({
            gutenbergIds: admin.firestore.FieldValue.arrayUnion(gutenbergId)
        }, { merge: true });
    } catch (e) {
        console.error("Failed to save skip cache", e);
    }
}

async function saveStats() {
    await db.collection('meta').doc('stats').set(globalStats);
    console.log("Updated stats:", globalStats);
}

// Initialize Firebase
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // For GitHub Actions / Cloud Environment
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else if (fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
    // For Local Development
    serviceAccount = require(SERVICE_ACCOUNT_KEY_PATH);
} else {
    console.error("❌ Error: credentials not found.");
    console.error("Set FIREBASE_SERVICE_ACCOUNT env var OR place 'serviceAccountKey.json' in scripts folder.");
    process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- HELPERS ---

function cleanGutenbergText(text) {
    const startMarker = /\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG EBOOK.*?\*\*\*/i;
    const endMarker = /\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG EBOOK.*?\*\*\*/i;
    let clean = text;
    const startMatch = clean.match(startMarker);
    if (startMatch) clean = clean.substring(startMatch.index + startMatch[0].length);
    const endMatch = clean.match(endMarker);
    if (endMatch) clean = clean.substring(0, endMatch.index);
    return clean.trim();
}

async function fetchWithRetry(url) {
    for (let i = 0; i < 3; i++) {
        try {
            const res = await axios.get(url);
            return res.data;
        } catch (e) {
            console.log(`Retrying ${url}... (${i+1}/3)`);
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    return null;
}

// --- SLICING LOGIC ---

function countWords(str) {
    return str.trim().split(/\s+/).length;
}

// Heuristic to split collections into individual essays/stories
function sliceContent(fullText, category) {
    if (fullText.length < 85000) return [{ title: null, text: fullText }];
    
    // Safer, simpler regex for splitting
    // Look for double newlines followed by "Chapter/Essay/Part" or Roman Numerals
    // We limit the lookaround to avoid ReDoS
    const romanRegex = /\n\s{0,5}(?:CHAPTER|ESSAY|SECTION|[IVXLCDM]+\.?)\b/i;

    // Simple line-based scanner is safer than massive regex on 2MB string
    const lines = fullText.split('\n');
    const chunks = [];
    let currentChunk = [];
    let currentHeader = "Part 1";
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detect Header Line
        // Must be short (less than 50 chars), uppercase or contain "Chapter/Essay"
        if (line.length > 0 && line.length < 50) {
            const isRoman = /^(?:[IVXLCDM]+\.?)$/i.test(line);
            const isKeyword = /^(?:CHAPTER|ESSAY|SECTION|PART)\s+[A-Z0-9]+/i.test(line);
            const isAllCaps = (line === line.toUpperCase()) && (line.length > 5);
            
            if (isRoman || isKeyword || isAllCaps) {
                // Save previous chunk
                if (currentChunk.length > 0) {
                    chunks.push({
                        title: currentHeader,
                        text: currentChunk.join('\n')
                    });
                }
                // Start new chunk
                currentHeader = line; // Use the line as the title suffix
                currentChunk = [];
                continue;
            }
        }
        currentChunk.push(lines[i]);
    }
    
    // Push final
    if (currentChunk.length > 0) {
        chunks.push({ title: currentHeader, text: currentChunk.join('\n') });
    }
    
    // Filter logical sizes (2k - 85k chars)
    // Map to simple objects
    return chunks
        .filter(c => c.text.length > 2000 && c.text.length < 85000)
        .map(c => ({ title: c.title, text: c.text }));
}

// Analyzes a book to see if it's suitable, returning ARRAY of candidates
async function analyzeBook(book, category) {
    if (existingCache.has(book.id)) return null;
    if (skipCache.has(book.id)) return null;

    const textUrl = book.formats['text/plain; charset=utf-8'] || book.formats['text/plain'];
    if (!textUrl) return null; // Can't process without text

    try {
        // HEAD Check
        const headRes = await axios.head(textUrl);
        const size = parseInt(headRes.headers['content-length'] || 0);
        // Limit: 5MB (Huge, but we accept it because we slice it)
        if (size > 5000000) { 
            return null;
        }
    } catch (e) { }

    const rawText = await fetchWithRetry(textUrl);
    if (!rawText) return null;

    const content = cleanGutenbergText(rawText);
    
    if (content.length < 1000) {
        return null;
    }
    
    // Try to slice it
    let slices = sliceContent(content, category);
    
    // FALLBACK SLICING: If semantic slicing failed, and it's long, 
    // slice strictly by length to ensure we get SOMETHING.
    if ((!slices || slices.length === 0) && content.length > 85000) {
        slices = [];
        const chunkSize = 40000; // ~40k chars per part
        let pos = 0;
        let partNum = 1;
        
        while (pos < content.length) {
            let end = Math.min(pos + chunkSize, content.length);
            
            // Try to find a paragraph break near the limit
            if (end < content.length) {
                const nextNewLine = content.indexOf('\n\n', end);
                if (nextNewLine !== -1 && nextNewLine - end < 5000) {
                     end = nextNewLine;
                }
            }
            
            const chunkText = content.substring(pos, end).trim();
            if (chunkText.length > 2000) {
                slices.push({
                    title: `Part ${partNum}`,
                    text: chunkText
                });
            }
            pos = end;
            partNum++;
        }
    }

    if (!slices || slices.length === 0) {
        if (content.length > 100000) {
            return null;
        }
        // It fits as one
        return [{ book, content, isSlice: false }];
    }
    
    // Limit to just first 5 slices per book to keep variety high
    return slices.slice(0, 5).map(s => ({
        book,
        content: s.text,
        subTitle: s.title,
        isSlice: true
    }));
}

async function saveBookToLibrary(data, category) {
    const { book, content, subTitle, isSlice } = data;
    
    const index = globalStats[category];
    const newId = `${category}-${index}`;
    const docRef = db.collection('library').doc(newId);

    const authors = book.authors.map(a => a.name).join(', ');
    
    // If it's a slice, append subtitle
    let finalTitle = book.title;
    if (isSlice && subTitle && subTitle !== finalTitle) {
        // Clean up title if it repeats
        finalTitle = `${finalTitle}: ${subTitle}`;
    }

    await docRef.set({
        id: newId,
        index: index,
        title: finalTitle,
        author: authors || "Unknown",
        year: "Public Domain",
        source: "Project Gutenberg",
        url: `https://www.gutenberg.org/ebooks/${book.id}`,
        category: "fetched-" + category,
        appCategory: category,
        gutenbergId: book.id,
        text: content,
        dateAdded: admin.firestore.FieldValue.serverTimestamp(),
        popularity: book.download_count
    });

    // Only add to EXISTING cache if it's the WHOLE book.
    // If it's a slice, we might want to re-process the book later if we need more slices?
    // Actually, safer to add it so we don't re-download. 
    // NOTE: This means if we only take 3 slices from a book of 50, we won't get the others later. 
    // That's acceptable for now to avoid complexity.
    existingCache.add(book.id);
    
    globalStats[category]++;
    await saveStats();
    console.log(`\n✅ Added [${category}] ${finalTitle} (ID: ${newId})`);
    return true;
}

async function refillCategory(target, targetTotal) {
    const currentCount = globalStats[target.category];
    const needed = targetTotal - currentCount;
    
    if (needed <= 0) {
        console.log(`✅ ${target.topic} already at sufficient level (${currentCount}).`);
        return;
    }

    console.log(`\n🔍 Searching for ${needed} new ${target.topic} (Current: ${currentCount} -> Target: ${targetTotal})...`);
    
    let addedCount = 0;
    
    // Jump ahead optimization: If we have tons of skips, don't start at page 1.
    // Each page has 32 items. 1000 skips ~= 30 pages.
    // Random start to find new veins.
    let pageNum = 1;
    if (skipCache.size > 500) {
        pageNum = Math.floor(Math.random() * 40) + 1; // Start somewhere between 1 and 40
        console.log(`🔀 Jumping to random page ${pageNum} to find fresh content...`);
    }

    let nextUrl = `https://gutendex.com/books/?topic=${encodeURIComponent(target.topic)}&sort=popular&page=${pageNum}`;

    // Safety limit to prevent infinite loops if we can't find valid books
    let processedCount = 0;
    const MAX_PROCESS = needed * 2000; 

    while (nextUrl && addedCount < needed && processedCount < MAX_PROCESS) {
        console.log(`\nFetching Page: ${nextUrl}`);
        const data = await fetchWithRetry(nextUrl);
        if (!data) break;

        const validBooks = data.results.filter(b => b.languages.includes('en'));

        // 1. Analyze in Parallel
        const analysisResults = await Promise.all(validBooks.map(book => analyzeBook(book, target.category)));
        
        // 2. Filter Successes & Flatten (Analyze returns arrays now)
        const candidates = analysisResults
            .filter(r => r !== null)
            .flat();

        // 3. Save Serially
        for (const candidate of candidates) {
            if (addedCount >= needed) break;
            await saveBookToLibrary(candidate, target.category);
            addedCount++;
        }

        processedCount += validBooks.length;
        nextUrl = data.next;
    }
}

async function main() {
    await loadStats();
    console.log("🚀 Starting Library Refill...");
    
    // 1. Determine the highest count currently in the DB
    const counts = [globalStats.poems, globalStats.stories, globalStats.essays];
    const maxCurrent = Math.max(...counts);
    
    // 2. Set the goal: Everyone must catch up to Max, PLUS the new batch size
    const targetTotal = 200; // Increased to satisfy "get hundreds" request
    
    console.log(`🎯 Balancing Strategy: Highest category has ${maxCurrent}.`);
    console.log(`🎯 New Target for ALL categories: ${targetTotal}`);

    for (const target of TARGETS) {
        await refillCategory(target, targetTotal);
    }
    await saveStats();
    console.log("\n✨ Refill complete.");
}

main();
