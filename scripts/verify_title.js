const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
    const doc = await db.collection('library').doc('2944').get();
    if (doc.exists) {
        const title = doc.data().title;
        console.log(`Title: "${title}"`);
        console.log('Character codes:', title.split('').map(c => c.charCodeAt(0)));
    } else {
        console.log("Doc 2944 not found");
    }
}

check();
