const admin = require('firebase-admin');
const path = require('path');

const SERVICE_ACCOUNT_KEY_PATH = path.join(__dirname, 'serviceAccountKey.json');

const fs = require('fs');

if (!fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
    console.error("❌ Error: 'serviceAccountKey.json' not found.");
    process.exit(1);
}

const serviceAccount = require(SERVICE_ACCOUNT_KEY_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const CATEGORY_MAPPING = {
    'Poetry': 'poems',
    'Poem': 'poems',
    'poems': 'poems',
    'Fiction': 'stories',
    'Short Story': 'stories',
    'stories': 'stories',
    'Essay': 'essays',
    'Essays': 'essays',
    'essays': 'essays',
    // Fallback
    'unknown': 'essays' 
};

async function migrate() {
    console.log("📦 Starting Migration to Indexed IDs...");

    const snapshot = await db.collection('library').get();
    if (snapshot.empty) {
        console.log("No documents to migrate.");
        return;
    }

    const counters = {
        poems: 0,
        stories: 0,
        essays: 0
    };

    const batch = db.batch();
    const docsToDelete = [];

    // process all docs
    for (const doc of snapshot.docs) {
        const data = doc.data();
        
        let cat = data.appCategory; // usually 'poems', 'stories', 'essays' from new script
        
        // Handle old data (before we added appCategory)
        if (!cat) {
            // infer from 'category' field (which was 'Poetry', 'Fiction' etc)
            cat = CATEGORY_MAPPING[data.category] || 'essays'; 
        }

        // Increment counter
        const index = counters[cat];
        const newId = `${cat}-${index}`; // e.g., 'poems-0'
        
        // Prepare new doc data
        const newData = {
            ...data,
            id: newId,         // Store string ID
            index: index,      // Store numeric index for easy math
            appCategory: cat
        };

        // Create new doc
        const newRef = db.collection('library').doc(newId);
        batch.set(newRef, newData);

        // Queue old doc for deletion
        docsToDelete.push(doc.ref);
        
        counters[cat]++;
    }

    // Commit writes
    console.log("Writing new documents...", counters);
    await batch.commit();

    // Delete old docs (in chunks of 500)
    console.log(`Deleting ${docsToDelete.length} old documents...`);
    const deleteBatch = db.batch();
    docsToDelete.forEach(ref => deleteBatch.delete(ref));
    await deleteBatch.commit();
    
    // Save Counters
    await db.collection('meta').doc('stats').set(counters);
    console.log("✅ Migration Complete. Metadata saved.");
}

migrate();
