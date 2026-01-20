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

async function loadStats() {
    try {
        const doc = await db.collection('meta').doc('stats').get();
        if (doc.exists) {
            globalStats = doc.data();
            console.log("Loaded stats:", globalStats);
        }
    } catch (e) {
        console.warn("Could not load stats, starting fresh.");
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

async function processBook(book, category) {
    // Determine new ID based on counter
    const index = globalStats[category];
    const newId = `${category}-${index}`;

    const docRef = db.collection('library').doc(newId);
    
    // Check if exists (by gutenbergId to prevent dupes, though we are using new ID schema)
    // We can't check by ID easily now without querying. 
    // Optimization: Just check if title exists in a separate index or risk duplicates for now?
    // Better: let's query specific field
    const existing = await db.collection('library')
                       .where('gutenbergId', '==', book.id)
                       .get();
                       
    if (!existing.empty) {
        console.log(`Skipping ${book.id} (${book.title}) - Already exists.`);
        return false;
    }

    // Find text URL
    const textUrl = book.formats['text/plain; charset=utf-8'] || book.formats['text/plain'];
    if (!textUrl) return false;

    // Fetch and clean
    const rawText = await fetchWithRetry(textUrl);
    if (!rawText) return false;

    const content = cleanGutenbergText(rawText);
    
    // Basic validation (arbitrary length check to avoid empty files)
    if (content.length < 500) return false;

    // Firestore Size Check (Max 1MB ~ 1,000,000 bytes). Secure limit at 900KB.
    const sizeInBytes = Buffer.byteLength(content, 'utf8');
    if (sizeInBytes > 900000) {
        console.warn(`⚠️ Skipping ${book.title} (ID: ${book.id}) - Too large for Firestore (${(sizeInBytes / 1024 / 1024).toFixed(2)} MB)`);
        return false;
    }

    const authors = book.authors.map(a => a.name).join(', ');

    await docRef.set({
        id: newId,
        index: index,
        title: book.title,
        author: authors || "Unknown",
        year: "Public Domain",
        source: "Project Gutenberg",
        url: `https://www.gutenberg.org/ebooks/${book.id}`,
        category: "fetched-" + category, // Mark as auto-fetched so we can distinguish mappings if needed
        appCategory: category, // normalized: poems, stories, essays
        gutenbergId: book.id,
        text: content,
        dateAdded: admin.firestore.FieldValue.serverTimestamp(),
        popularity: book.download_count
    });

    // Increment local counter
    globalStats[category]++;

    // Save Stats immediately (Robustness fix)
    await saveStats();

    console.log(`✅ Added [${category}] ${book.title} as ${newId}`);
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
    
    let nextUrl = `https://gutendex.com/books/?topic=${encodeURIComponent(target.topic)}&sort=popular`;
    let addedCount = 0;

    // Safety limit to prevent infinite loops if we can't find valid books
    let processedCount = 0;
    const MAX_PROCESS = needed * 20; // Allow scanning 20x the candidates needed

    while (nextUrl && addedCount < needed && processedCount < MAX_PROCESS) {
        const data = await fetchWithRetry(nextUrl);
        if (!data) break;

        for (const book of data.results) {
            if (addedCount >= needed) break;
            processedCount++;
            
            // Language check
            if (!book.languages.includes('en')) continue;

            const added = await processBook(book, target.category);
            if (added) addedCount++;
        }
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
    const targetTotal = maxCurrent + BATCH_SIZE_PER_CATEGORY;
    
    console.log(`🎯 Balancing Strategy: Highest category has ${maxCurrent}. Adding +${BATCH_SIZE_PER_CATEGORY}.`);
    console.log(`🎯 New Target for ALL categories: ${targetTotal}`);

    for (const target of TARGETS) {
        await refillCategory(target, targetTotal);
    }
    await saveStats();
    console.log("\n✨ Refill complete.");
}

main();
