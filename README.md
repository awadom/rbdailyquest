# RB Daily Quest

A minimalist reading ritual app. Every day, it serves up **one poem**, **one short story**, and **one essay** from your personal digital library.

## How it works

1.  **Daily Selection:** The app picks 3 random items from your Firestore database. The selection is deterministic based on the date, so everyone sees the same "Daily Quest" for that day.
2.  **Reader View:** Read full text directly in the app (no external links needed for public domain works).
3.  **Archive:** Your progress is saved locally. You can revisit past days.

## Managing the Library

The content is stored in **Firebase Firestore**. You control the library using the scripts in the `scripts/` folder.

### 1. Check Status
See how many books you have and if you need to refill.
```bash
cd scripts
node status.js
```

### 2. Auto-Refill (Recommended)
Automatically finds popular books on Project Gutenberg that you don't have yet, cleans them, and adds them to your library to maintain a balance of Poems, Stories, and Essays.
```bash
cd scripts
node refill_library.js
```

### 3. Add Specific Books
If you want a specific classic (e.g., *Pride and Prejudice*), edit `scripts/populate_books.js` to add its Gutenberg ID, then run:
```bash
cd scripts
node populate_books.js
```

## Setup

1.  Place your Firebase `serviceAccountKey.json` in the `scripts/` folder.
2.  Update `app.js` with your public Firebase Config.
3.  Serve `index.html` locally or deploy to any static host (Netlify, Vercel, Firebase Hosting).
