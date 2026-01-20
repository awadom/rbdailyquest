// The "Auto Refill" logic requires a secure backend to run.
// You cannot run the "refill_library.js" script from the browser because it needs your Secret Key.
// Instead, you use a Firebase Cloud Function.
//
// 1. Install tools: npm install -g firebase-tools
// 2. Login: firebase login
// 3. Init: firebase init functions
// 4. Replace functions/index.js with the code below.
// 5. Deploy: firebase deploy --only functions

/* functions/index.js content: */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// Only run refill if stock is below this threshold
const MIN_THRESHOLD = 50; 
const BATCH_SIZE = 20;

exports.checkLibraryStock = functions.https.onCall(async (data, context) => {
  // This function is called by your website (app.js)
  
  const statsDoc = await db.collection('meta').doc('stats').get();
  if (!statsDoc.exists) return { status: "no-stats" };
  
  const stats = statsDoc.data();
  const lowCategories = [];
  
  if (stats.poems < MIN_THRESHOLD) lowCategories.push({ topic: "Poetry", cat: "poems" });
  if (stats.stories < MIN_THRESHOLD) lowCategories.push({ topic: "Short Stories", cat: "stories" });
  if (stats.essays < MIN_THRESHOLD) lowCategories.push({ topic: "Essays", cat: "essays" });

  if (lowCategories.length === 0) {
      return { status: "healthy", stats };
  }

  // If we are low, trigger a refill
  // Note: On free Spark plan, outbound requests (to Gutendex) will fail here.
  // You need the Blaze plan.
  
  try {
      for (const target of lowCategories) {
         await refillCategoryInternal(target.topic, target.cat, stats);
      }
      return { status: "refilled", prevStats: stats };
  } catch (e) {
      console.error(e);
      return { status: "error", message: e.message };
  }
});

async function refillCategoryInternal(topic, category, stats) {
    // ... Copy logic from scripts/refill_library.js here ...
    // fetch Gutendex -> clean text -> db.add -> increment stats
}
