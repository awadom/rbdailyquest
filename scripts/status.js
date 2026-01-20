const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// --- CONFIGURATION ---
const SERVICE_ACCOUNT_KEY_PATH = path.join(__dirname, 'serviceAccountKey.json');
const WARNING_THRESHOLD = 30; // Warn if fewer than this many items

// Initialize Firebase
if (!fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
    console.error("❌ Error: 'serviceAccountKey.json' not found.");
    process.exit(1);
}

const serviceAccount = require(SERVICE_ACCOUNT_KEY_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkStatus() {
    console.log("\n📊 RB Daily Quest: Library Status");
    console.log("===================================");

    try {
        const doc = await db.collection('meta').doc('stats').get();
        if (!doc.exists) {
            console.error("❌ No stats found. Run 'populate_books.js' or 'refill_library.js' first.");
            return;
        }

        const stats = doc.data();
        const categories = [
            { label: "Poems", key: "poems", icon: "🪶" },
            { label: "Short Stories", key: "stories", icon: "📚" },
            { label: "Essays", key: "essays", icon: "📝" }
        ];

        let needsRefill = false;

        console.table(Object.keys(stats).map(k => ({ Category: k, Count: stats[k] })));

        console.log("\n--- Health Check ---");
        
        categories.forEach(cat => {
            const count = stats[cat.key] || 0;
            const isLow = count < WARNING_THRESHOLD;
            const status = isLow ? "⚠️ LOW STOCK" : "✅ HEALTHY";
            
            if (isLow) needsRefill = true;

            console.log(`${cat.icon} ${cat.label}: ${count} available\t[${status}]`);
        });

        console.log("\n--- Recommendation ---");
        if (needsRefill) {
            console.log(`🚨 You are running low on content!`);
            console.log(`👉 Run 'node refill_library.js' to add more items automatically.`);
        } else {
            console.log(`✨ System is healthy. You have enough content for random daily selection.`);
        }
        
    } catch (error) {
        console.error("Error fetching status:", error);
    }
}

checkStatus();
