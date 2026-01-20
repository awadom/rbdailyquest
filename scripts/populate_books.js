const axios = require('axios');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
// 1. Download your Firebase Admin SDK key from Project Settings > Service Accounts
// 2. Save it as 'serviceAccountKey.json' in this scripts folder
const SERVICE_ACCOUNT_KEY_PATH = path.join(__dirname, 'serviceAccountKey.json');

// --- GUTENBERG IDs TO FETCH ---
// Add more IDs here to populate your database
const BOOKS_TO_FETCH = [
    1080,  // A Modest Proposal (Swift)
    // 14036, // A Room of One's Own - REPLACED: Better Woolf text on Gutenberg US is difficult (copyright), using "Jacob's Room" for now (5670) or others.
    71,    // Civil Disobedience (Thoreau)
    2944,  // Essays - First Series (Emerson - Self-Reliance)
    29345, // Mountain Interval (Frost - Road Not Taken is here)
    1459,  // Prufrock and Other Observations (Eliot)
    2776,  // The Four Million (O. Henry - Gift of the Magi)
    236,   // The Jungle Book (Kipling)
    5670,  // Jacob's Room (Virginia Woolf) - Essay-like experimental fiction, or use 14036 if you really want that specific magazine issue.
];

const CATEGORY_MAP = {
    // Basic heuristic mapping based on ID or we can manually map
    'Poetry': ['29345', '1459'],
    'Fiction': ['2776', '236', '5670'],
    'Essay': ['1080', '71', '14036', '2944'] 
};

const APP_CATEGORY_MAP = {
    'Poetry': 'poems',
    'Fiction': 'stories',
    'Essay': 'essays'
};

const DEFAULT_CATEGORY = "Essay"; // Fallback

let globalStats = { poems: 0, stories: 0, essays: 0 };

// Initialize Firebase
if (!fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
    console.error("❌ Error: 'serviceAccountKey.json' not found.");
    console.error("Please download it from Firebase Console -> Project Settings -> Service Accounts");
    console.error("and place it in the 'scripts' folder.");
    process.exit(1);
}

const serviceAccount = require(SERVICE_ACCOUNT_KEY_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function loadStats() {
    try {
        const doc = await db.collection('meta').doc('stats').get();
        if (doc.exists) {
            globalStats = doc.data();
            console.log("Loaded stats:", globalStats);
        }
    } catch (e) {
        console.warn("Could not load stats, using defaults.");
    }
}

async function saveStats() {
    await db.collection('meta').doc('stats').set(globalStats);
    console.log("Updated stats:", globalStats);
}

async function fetchMetadata(id) {
    try {
        const response = await axios.get(`https://gutendex.com/books/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching metadata for ID ${id}:`, error.message);
        return null;
    }
}


async function fetchText(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching text from ${url}:`, error.message);
        return null;
    }
}

function cleanGutenbergText(text) {
    // Simple stripper for standard Gutenberg headers/footers
    const startMarker = /\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG EBOOK.*?\*\*\*/i;
    const endMarker = /\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG EBOOK.*?\*\*\*/i;

    let clean = text;
    
    const startMatch = clean.match(startMarker);
    if (startMatch) {
        clean = clean.substring(startMatch.index + startMatch[0].length);
    }

    const endMatch = clean.match(endMarker);
    if (endMatch) {
        clean = clean.substring(0, endMatch.index);
    }

    // Remove License blocks if they appear loosely
    // This is distinct from the header/footer usually, but often included.
    
    return clean.trim();
}

function determineCategory(id) {
    const strId = id.toString();
    for (const [cat, ids] of Object.entries(CATEGORY_MAP)) {
        if (ids.includes(strId)) return cat;
    }
    return DEFAULT_CATEGORY;
}

async function processBook(id) {
    console.log(`Processing Book ID: ${id}...`);
    
    // 1. Get Metadata
    const meta = await fetchMetadata(id);
    if (!meta) return;

    // 2. Find text URL
    // Check multiple possible text formats
    const textUrl = meta.formats['text/plain; charset=utf-8'] || 
                    meta.formats['text/plain; charset=us-ascii'] || 
                    meta.formats['text/plain'];

    if (!textUrl) {
        console.log(`Skipping ${id}: No plain text format found. Available formats:`, Object.keys(meta.formats));
        return;
    }

    // 3. Get Text
    const rawText = await fetchText(textUrl);
    if (!rawText) return;

    // 4. Clean Text
    const content = cleanGutenbergText(rawText);
    const categoryLabel = determineCategory(id);
    const appCategory = APP_CATEGORY_MAP[categoryLabel] || 'essays';
    const authors = meta.authors.map(a => a.name).join(', ');

    // Security Check: Does this Gutenberg ID already exist?
    // We check by querying the field "gutenbergId"
    const existing = await db.collection('library').where('gutenbergId', '==', id).get();
    if (!existing.empty) {
        console.log(`Skipping ${id} (${meta.title}) - Already in library.`);
        return;
    }
    
    // Determine new ID based on counter
    const index = globalStats[appCategory];
    const newId = `${appCategory}-${index}`;

    // 5. Create Record
    const record = {
        id: newId,
        index: index,
        title: meta.title,
        author: authors,
        year: meta.copyright === false ? "Public Domain" : "Unknown", 
        source: "Project Gutenberg",
        url: `https://www.gutenberg.org/ebooks/${id}`,
        category: categoryLabel,
        appCategory: appCategory,
        gutenbergId: id,
        text: content,
        dateAdded: admin.firestore.FieldValue.serverTimestamp()
    };

    // 6. Upload
    await db.collection('library').doc(newId).set(record);
    
    // 7. Increment Stats
    globalStats[appCategory]++;
    
    console.log(`✅ Saved "${meta.title}" as ${newId}`);
}

async function main() {
    await loadStats();
    console.log("Starting population...");
    for (const id of BOOKS_TO_FETCH) {
        await processBook(id);
    }
    await saveStats();
    console.log("Done.");
}

main();
