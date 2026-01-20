import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDoc, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// TODO: Replace with your actual Firebase project configuration
// Get this from: Firebase Console -> Project Overview -> Project Settings -> General -> "Your apps"
const firebaseConfig = {
  apiKey: "AIzaSyBrkLTZJfV-y2FH-BzBBt64yomwV3DujPU",
  authDomain: "rbdailyquest.firebaseapp.com",
  projectId: "rbdailyquest",
  storageBucket: "rbdailyquest.firebasestorage.app",
  messagingSenderId: "280210832999",
  appId: "1:280210832999:web:82779265df794348865ec2",
  measurementId: "G-0XD5RWD1GT"
};

// Initialize Firebase
// Note: Errors here are caught in init() to fallback to local data if config is missing
let db;
let auth;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.warn("Firebase not configured. Using local fallback data.");
}

const LOCAL_DATA = {
  poems: [
    {
      title: "The Road Not Taken",
      author: "Robert Frost",
      year: 1916,
      source: "Poetry Foundation",
      url: "https://www.poetryfoundation.org/poems/44272/the-road-not-taken",
      note: "A classic meditation on choice and consequence.",
      text: "Two roads diverged in a yellow wood,\nAnd sorry I could not travel both..."
    }
  ],
  essays: [
    {
      title: "Self-Reliance",
      author: "Ralph Waldo Emerson",
      year: 1841,
      source: "Emerson Central",
      url: "https://emersoncentral.com/texts/essays-first-series/self-reliance/",
      note: "A foundational call for individual thought."
    }
  ],
  stories: [
    {
      title: "The Gift of the Magi",
      author: "O. Henry",
      year: 1905,
      source: "American Literature",
      url: "https://americanliterature.com/author/o-henry/short-story/the-gift-of-the-magi",
      note: "A classic tale of sacrifice and love.",
      text: "One dollar and eighty-seven cents. That was all..."
    }
  ],
};

let libraryData = LOCAL_DATA;

const fetchLibrary = async () => {
  if (!db) return;
  
  try {
    // 1. Fetch Stats/Counts
    const statsSnap = await getDoc(doc(db, "meta", "stats"));
    if (!statsSnap.exists()) {
      console.warn("No stats found in DB. Run migration or population script.");
      return;
    }
    const counts = statsSnap.data();

    // 2. Calculate IDs based on today's Global Seed
    // We use a predefined seed so everyone gets the same "Random" books today
    const seed = hashSeed(isoDate(new Date())); 
    const random = mulberry32(seed);

    // Pick a random index for each category
    // (Math.floor(random() * total)) ensure we stay in bounds
    const idxPoem = Math.floor(random() * counts.poems); 
    const idxStory = Math.floor(random() * counts.stories); 
    const idxEssay = Math.floor(random() * counts.essays);

    console.log(`Fetching Daily Layout: Poem #${idxPoem}, Story #${idxStory}, Essay #${idxEssay}`);

    // 3. Fetch ONLY the target documents (Security & Performance)
    // IDs are formatted like 'poems-5', 'stories-12'
    const [poemSnap, storySnap, essaySnap] = await Promise.all([
      getDoc(doc(db, "library", `poems-${idxPoem}`)),
      getDoc(doc(db, "library", `stories-${idxStory}`)),
      getDoc(doc(db, "library", `essays-${idxEssay}`))
    ]);

    // 4. Update Library Data with just these items
    if (poemSnap.exists()) libraryData.poems = [poemSnap.data()];
    if (storySnap.exists()) libraryData.stories = [storySnap.data()];
    if (essaySnap.exists()) libraryData.essays = [essaySnap.data()];
    
    console.log("Values loaded via Secure Random Indexing.");
  } catch (error) {
    console.error("Error fetching library:", error);
    toastMessage("Using offline backup library");
  }
};


const STORAGE_KEY = "rb-daily-quest-v3";
const ARCHIVE_KEY = "rb-daily-quest-archive-v3";
const READ_KEY = "rb-daily-quest-read-history-v3";

// --- AUTH & DATA STATE ---
let currentUser = null;
let currentReadHistory = new Set(); 

// Initial local load
try {
    const local = JSON.parse(localStorage.getItem(READ_KEY) || "[]");
    local.forEach(url => currentReadHistory.add(url));
} catch (e) { }

// --- AUDIO ENGINE ---
const synth = window.speechSynthesis;
let voices = [];
let currentVoice = null;
let isPlaying = false;
let audioQueue = [];
let queueIndex = 0;

const loadVoices = () => {
    voices = synth.getVoices();
    // Prioritize high-quality voices or English
    const storedVoice = localStorage.getItem('rb-voice-uri');
    if (storedVoice) {
        currentVoice = voices.find(v => v.voiceURI === storedVoice);
    } 
    
    if (!currentVoice) {
       // Enhanced Voice Selection Strategy for Better Quality
       // 1. Google US English (Chrome) - usually quite good
       // 2. Microsoft Natural (Edge/Win) - "Natural" in name often implies neural
       // 3. Samantha (Mac) - classic decent voice
       // 4. Any English voice
       
       currentVoice = voices.find(v => v.name === "Google US English") || 
                      voices.find(v => v.name.includes("Natural") && v.lang.startsWith("en")) ||
                      voices.find(v => v.name === "Samantha") ||
                      voices.find(v => v.lang.startsWith('en-US')) ||
                      voices.find(v => v.lang.startsWith('en'));
    }
    
    updateVoiceSelect();
};

if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
}

const updateVoiceSelect = () => {
    const select = document.getElementById("voice-select");
    if (!select) return;
    select.innerHTML = "";
    voices
      .filter(v => v.lang.startsWith('en')) // Filter for English to keep list clean
      .forEach(v => {
        const option = document.createElement("option");
        option.textContent = `${v.name} (${v.lang})`;
        option.value = v.voiceURI;
        if (currentVoice && v.voiceURI === currentVoice.voiceURI) {
            option.selected = true;
        }
        select.appendChild(option);
    });
};

const splitTextForTTS = (text) => {
    // Limits for reliable TTS across browsers (especially Chrome/Safari)
    // 200-300 chars is a safe sweet spot to avoid timeouts
    const MAX_CHUNK_LENGTH = 250; 
    
    // Quick return if short enough
    if (text.length <= MAX_CHUNK_LENGTH) return [text];

    const chunks = [];
    // Split by sentence ending punctuation followed by space or newline
    // This regex looks for period/exclamation/question mark followed by space/quote/newline
    const sentenceRegex = /([.?!]["']?)\s+/g;
    
    let startIndex = 0;
    let match;
    
    while ((match = sentenceRegex.exec(text)) !== null) {
        const endIndex = match.index + match[0].length;
        const chunk = text.substring(startIndex, endIndex);
        
        // If adding this sentence exceeds max, push what we have? 
        // Actually, we want to accumulate sentences until we hit the limit.
        // But the loop here iterates over *every* sentence.
        // Let's refine: iterate sentences, accumulate buffer.
    }
    
    // Better simple approach: Split all sentences, then combine.
    // 1. Split by rough sentence boundaries, keeping delimiters
    const sentences = text.match(/[^.?!]+[.?!]+["']?|[^.?!]+$/g) || [text];
    
    let currentChunk = "";
    
    for (const sentence of sentences) {
        const potential = currentChunk + (currentChunk ? " " : "") + sentence.trim();
        
        if (potential.length > MAX_CHUNK_LENGTH) {
             if (currentChunk) chunks.push(currentChunk);
             
             // If the single sentence is huge, forced split or just accept it (usually fine if < 500)
             if (sentence.length > MAX_CHUNK_LENGTH) {
                 // Fallback: split by comma or just hard char limit
                 currentChunk = sentence.trim(); // Just take the hit for now, or implement deeper recursion
             } else {
                 currentChunk = sentence.trim();
             }
        } else {
             currentChunk = potential;
        }
    }
    
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
};

const stopAudio = () => {
    synth.cancel();
    isPlaying = false;
    audioQueue = [];
    document.querySelectorAll(".playing").forEach(el => el.classList.remove("playing"));
    updatePlayIcons();
};

const updatePlayIcons = () => {
   const currentItem = isPlaying && audioQueue.length > queueIndex ? audioQueue[queueIndex] : null;

   const speakBtn = document.getElementById("reader-speak-btn");
   if (speakBtn) {
       // If playing this specific text? Hard to track exact item. 
       // Just toggle icon if general playing state matches
       speakBtn.innerHTML = isPlaying 
         ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>` // Pause/Stop
         : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
   }
   
   const playAllBtn = document.getElementById("play-all-btn");
   if (playAllBtn) {
       const stopIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
       const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
       
       playAllBtn.innerHTML = isPlaying ? stopIcon : playIcon;
       playAllBtn.setAttribute('aria-label', isPlaying ? 'Stop Listening' : 'Listen to Quest');
       playAllBtn.setAttribute('title', isPlaying ? 'Stop Listening' : 'Listen to Quest');
   }

   // Update Card Buttons
   document.querySelectorAll(".card-play-btn").forEach(btn => {
      const btnTitle = btn.dataset.title;
      // use parentTitle to match reliable identity of the work
      const isThisPlaying = isPlaying && currentItem && currentItem.parentTitle === btnTitle;
      
      const stopIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
      const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
      
      btn.innerHTML = isThisPlaying ? stopIcon : playIcon;
      btn.setAttribute('aria-label', isThisPlaying ? 'Stop Listening' : 'Listen');
      
      // Visual flair: dim non-playing cards if one IS playing?
      // Optional enhancement.
   });
};

const playNextInQueue = () => {
    if (queueIndex >= audioQueue.length) {
        stopAudio();
        return;
    }
    
    // Update UI every time we proceed to a new chunk (essential for cross-story transitions)
    updatePlayIcons();
    
    const item = audioQueue[queueIndex];
    const utterance = new SpeechSynthesisUtterance(item.text);
    if (currentVoice) utterance.voice = currentVoice;
    utterance.rate = 0.9; // Slightly slower for reading
    
    utterance.onend = () => {
        queueIndex++;
        playNextInQueue();
    };
    
    utterance.onerror = (e) => {
        console.error("TTS Error", e);
        stopAudio();
    };
    
    // Announce Title first
    if (item.title) {
        const titleUtt = new SpeechSynthesisUtterance(`${item.type}. ${item.title}. By ${item.author}.`);
        if (currentVoice) titleUtt.voice = currentVoice;
        titleUtt.onend = () => synth.speak(utterance);
        synth.speak(titleUtt);
    } else {
        synth.speak(utterance);
    }
};

const skipAudio = (direction) => {
    // direction: 1 (Next) or -1 (Previous)
    if (!audioQueue.length) return;

    // Get current item identity
    const currentItem = audioQueue[queueIndex];
    if (!currentItem) return;
    
    // Find the next/prev distinct work
    // We look for a change in "parentTitle"
    
    let targetIndex = -1;
    
    if (direction === 1) {
        // NEXT: Find first item > queueIndex with diff parentTitle
        for (let i = queueIndex + 1; i < audioQueue.length; i++) {
            if (audioQueue[i].parentTitle !== currentItem.parentTitle) {
                targetIndex = i;
                break;
            }
        }
        // If not found, we are at the last work. 
        // Could loop to start? Or just stop? 
        // Let's just stop if no user preference.
        if (targetIndex === -1) {
            stopAudio();
            return;
        }
    } else {
        // PREV: Complex logic
        // If we are deep into current work (> 5 chunks in?), restart current work?
        // Or if we are at start of current work, go to prev work.
        
        // Find start of CURRENT work
        let currentStartIndex = 0;
        for (let i = queueIndex; i >= 0; i--) {
            if (audioQueue[i].parentTitle !== currentItem.parentTitle) {
                currentStartIndex = i + 1;
                break;
            }
        }
        
        // If we are significantly past the start, just go to start of current
        if (queueIndex > currentStartIndex + 2) {
            targetIndex = currentStartIndex;
        } else {
            // Go to start of PREVIOUS work
            // Find item before currentStartIndex
             if (currentStartIndex > 0) {
                 const prevItem = audioQueue[currentStartIndex - 1];
                 // Now find the start of THAT work
                 for (let i = currentStartIndex - 1; i >= 0; i--) {
                     if (audioQueue[i].parentTitle !== prevItem.parentTitle) {
                         targetIndex = i + 1;
                         break;
                     }
                     if (i === 0) targetIndex = 0; // Reached very beginning
                 }
             } else {
                 targetIndex = 0; // Already at very start
             }
        }
    }
    
    if (targetIndex !== -1) {
        synth.cancel(); // Stop current speaking immediately
        queueIndex = targetIndex;
        // Resume
        playNextInQueue();
    }
};


const playText = (text, title, author, type) => {
    stopAudio();
    isPlaying = true;
    
    const chunks = splitTextForTTS(text);
    audioQueue = chunks.map((chunk, index) => ({
        text: chunk,
        title: index === 0 ? title : null, // Only announce header on first chunk
        parentTitle: title, // Track identity for all chunks
        author: author,
        type: type,
        isContinuation: index > 0
    }));
    
    queueIndex = 0;
    updatePlayIcons();
    playNextInQueue();
};

const playQuest = (entry) => {
    stopAudio();
    isPlaying = true;
    const p = entry.poem;
    const s = entry.story;
    const e = entry.essay;
    
    // Clean texts
    const poemText = cleanContent(p.text, p.title, 'poem');
    // For stories/essays, content might be too long. 
    // Just read clean versions.
    let storyText = cleanContent(s.text, s.title, 'story');
    // Check anthology
     if (storyText.length > 30000) {
        const sub = extractRandomStory(storyText, entry.date);
        if (sub) storyText = sub.text;
     }

    let essayText = cleanContent(e.text, e.title, 'essay');
    if (essayText.length > 30000) {
        const sub = extractRandomStory(essayText, entry.date);
        if (sub) essayText = sub.text;
     }

    // Process all into chunks
    const pChunks = splitTextForTTS(poemText);
    const sChunks = splitTextForTTS(storyText);
    const eChunks = splitTextForTTS(essayText);
    
    const queuePoem = pChunks.map((c, i) => ({ 
        text: c, 
        title: i===0 ? p.title : null, 
        parentTitle: p.title,
        author: p.author, 
        type: "Poem" 
    }));
    
    const queueStory = sChunks.map((c, i) => ({ 
        text: c, 
        title: i===0 ? s.title : null, 
        parentTitle: s.title,
        author: s.author, 
        type: "Short Story" 
    }));
    
    const queueEssay = eChunks.map((c, i) => ({ 
        text: c, 
        title: i===0 ? e.title : null, 
        parentTitle: e.title,
        author: e.author, 
        type: "Essay" 
    }));

    audioQueue = [...queuePoem, ...queueStory, ...queueEssay];
    queueIndex = 0;
    updatePlayIcons();
    toastMessage(`Starting Daily Quest audio...`);
    playNextInQueue();
};
// --- END AUDIO ENGINE ---

// Sync user history (Cloud <-> Local)
const syncUserHistory = async (user) => {
    if (!user || !db) return;
    try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        
        if (snap.exists()) {
            const data = snap.data();
            (data.readHistory || []).forEach(url => currentReadHistory.add(url));
        }

        // Write the merged set back to both
        const mergedList = [...currentReadHistory];
        localStorage.setItem(READ_KEY, JSON.stringify(mergedList));
        
        await setDoc(userRef, { 
            readHistory: mergedList,
            lastActive: new Date().toISOString()
        }, { merge: true });
        
        // Refresh UI requiring read status
        const archive = loadArchive();
        updateArchives(archive); 
        // Also refresh daily view if active (to show checkmarks)
        if (!document.getElementById("home-view").classList.contains("hidden")) {
           const today = ensureTodayEntry().today;
           // We might be viewing a past date, but simplest is to re-render whatever is active
           // Ideally we'd trigger a re-render. 
           // For now, updateArchives handles the badges in the list.
           // To update the cards themselves, we'll rely on user navigation or just live with it until refresh.
           // Actually, we can just find cards and update classes? Too complex. Use refresh if needed.
        }
    } catch (e) {
        console.error("Sync error:", e);
    }
};

// Legacy Wrappers (adapted for new state)
const loadReadHistory = () => currentReadHistory; 

const saveReadHistory = (history) => {
  // history is the Set passed by the caller (which modified it)
  // We update our global and persist
  currentReadHistory = history; 
  const list = [...currentReadHistory];
  localStorage.setItem(READ_KEY, JSON.stringify(list));
  
  if (currentUser && db) {
      setDoc(doc(db, "users", currentUser.uid), { readHistory: list }, { merge: true });
  }
};

const dailyContent = document.getElementById("daily-content");
const dateList = document.getElementById("date-list");
const fullArchiveList = document.getElementById("full-archive-list");
const todayDate = document.getElementById("today-date");
// const archiveCount = document.getElementById("archive-count");
const shareButton = document.getElementById("share-btn");
const toast = document.getElementById("toast");
const siteHeader = document.getElementById("site-header");
// const heroLabel = document.getElementById("hero-label");
const dailyHeaderTitle = document.getElementById("daily-header-title");
const backToTodayBtn = document.getElementById("back-to-today");

// Auth UI
const loginBtn = document.getElementById("login-btn");
const userProfile = document.getElementById("user-profile");
const userName = document.getElementById("user-name");
const logoutBtn = document.getElementById("logout-btn");
const authModal = document.getElementById("auth-modal");
const googleLoginBtn = document.getElementById("google-login-btn");
const closeModalBtn = document.getElementById("close-modal-btn");

// Archive View Elements
const viewArchiveBtn = document.getElementById("view-archive-btn");
const archiveView = document.getElementById("archive-view");
const archiveBack = document.getElementById("archive-back");

// Reader View Elements
const homeView = document.getElementById("home-view");
const readerView = document.getElementById("reader-view");
const readerBack = document.getElementById("reader-back");
const readerLabel = document.getElementById("reader-label");
const readerTitle = document.getElementById("reader-title");
const readerMeta = document.getElementById("reader-meta");
const readerNote = document.getElementById("reader-note");
const readerText = document.getElementById("reader-text");
const readerSource = document.getElementById("reader-source");
const readerNextNav = document.getElementById("reader-next-nav");

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const isoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const mulberry32 = (seed) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const hashSeed = (input) => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const pickRandom = (items, random) =>
  items[Math.floor(random() * items.length)];

const createEntry = (dateKey) => {
  const seed = hashSeed(dateKey);
  const random = mulberry32(seed);
  return {
    date: dateKey,
    poem: pickRandom(libraryData.poems, random),
    story: pickRandom(libraryData.stories, random),
    essay: pickRandom(libraryData.essays, random),
  };
};

const loadArchive = () => {
  const stored = localStorage.getItem(ARCHIVE_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch (error) {
    return {};
  }
};

const saveArchive = (archive) => {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
};

const ensureTodayEntry = () => {
  const today = new Date();
  const dateKey = isoDate(today);
  const archive = loadArchive();

  if (!archive[dateKey]) {
    archive[dateKey] = createEntry(dateKey);
    saveArchive(archive);
  }

  return { today: archive[dateKey], archive };
};

// --- TEXT CLEANING INFRASTRUCTURE ---

const cleanContent = (text, title, category) => {
  if (!text) return "";
  let clean = text;

  // 1. Remove common Project Gutenberg artifacts
  clean = clean.replace(/\[Illustration(:.*?)?\]/gi, ""); // Remove [Illustration] tags
  clean = clean.replace(/(ISBN|LBM) [\d- ]+/g, ""); // Remove ISBNs
  clean = clean.replace(/All rights reserved\..*/gi, "");
  
  // 2. Remove "End of the Project Gutenberg..." if it slipped through
  const footerMarker = /\*\*\*.*?END OF.*?PROJECT GUTENBERG.*?\*\*\*/i;
  
  clean = clean.split(footerMarker)[0];

  // 3. Smart Preamble Stripping (Specifically for Poems/Short works)
  const introPattern = /\n(INTRODUCTION|PREFACE|FOREWORD|PREPARER’S NOTE|CONTENTS)\b/i;
  const matchIntro = clean.match(introPattern);
  
  if (matchIntro) {
     const simpleTitle = title.split(":")[0].replace(/[^\w\s]/g, "").trim().toLowerCase();
     const postIntroText = clean.substring(matchIntro.index + matchIntro[0].length);
     
     const lines = postIntroText.split('\n');
     let foundStart = -1;
     
     for (let i = 0; i < lines.length; i++) {
        const lineSimple = lines[i].replace(/[^\w\s]/g, "").trim().toLowerCase();
        // Stricter check: Title must be alone on the line or close to it
        if (lineSimple.includes(simpleTitle) && lineSimple.length < 100 && lineSimple.length > 5) {
            foundStart = i;
            break; 
        }
     }

     if (foundStart !== -1) {
         clean = lines.slice(foundStart + 1).join('\n'); 
     }
  }

  return clean.trim();
};

// --- ANTHOLOGY HANDLING ---
const extractRandomStory = (fullText, dateKey) => {
    // 1. Find all "All Caps" lines that look like headers/titles
    const chapterRegex = /\n\s*\n\s*([A-Z0-9\s'’-]{3,60})\s*\n\s*\n/g;
    const matches = [...fullText.matchAll(chapterRegex)];

    if (matches.length < 3) return null;

    const validChapters = [];
    for (let i = 0; i < matches.length - 1; i++) {
        const title = matches[i][1].trim();
        const startIndex = matches[i].index + matches[i][0].length;
        const endIndex = matches[i+1].index;
        const content = fullText.substring(startIndex, endIndex);

        // Filter: Must be substantial text (>1500 chars) but not a whole book (<50k)
        if (content.length > 1500 && content.length < 50000) {
            validChapters.push({ title: title, text: content.trim() });
        }
    }
    
    // Check the last one
    if (matches.length > 0) {
        const last = matches[matches.length - 1];
        const content = fullText.substring(last.index + last[0].length);
        if (content.length > 1500 && content.length < 50000) {
            validChapters.push({ title: last[1].trim(), text: content.trim() });
        }
    }

    if (validChapters.length === 0) return null;

    // 3. Pick one deterministically based on date AND "ANTHOLOGY" suffix
    const seed = hashSeed(dateKey + "ANTHOLOGY");
    const random = mulberry32(seed);
    const picked = validChapters[Math.floor(random() * validChapters.length)];
    
    // Capitalize Title nicely (THE GOLDEN BIRD -> The Golden Bird)
    picked.title = picked.title.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    
    return picked;
};

const hydrateEntry = (entry) => {
  // Returns a new entry object with updated items if available in the loaded library
  if (!entry) return entry;
  const newEntry = { ...entry };
  const typeMap = { poem: 'poems', story: 'stories', essay: 'essays' };
  
  // Map for known title upgrades (Local Snippet -> Global Book)
  // Ensure we use the exact title string found in Firestore
  const SUPPRESS_MAP = {
    "Self-Reliance": "Essays — First Series",
    "Civil Disobedience": "On the Duty of Civil Disobedience",
    "The Road Not Taken": "Mountain Interval",
    "The Gift of the Magi": "The Four Million"
  };

  ['poem', 'story', 'essay'].forEach(key => {
      const item = entry[key];
      if (!item) return;
      
      const libraryKey = typeMap[key];
      const list = libraryData[libraryKey];
      if (!list) return;

      // 1. Direct Title Match
      let match = list.find(i => i.title === item.title);
      
      // 2. Map Match
      if (!match && SUPPRESS_MAP[item.title]) {
           match = list.find(i => i.title === SUPPRESS_MAP[item.title]);
      }

      if (match) {
          // Clone so we don't mutate the cached libraryData
          const processedItem = { ...match };

          // A. Clean raw text immediately
          processedItem.text = cleanContent(processedItem.text, processedItem.title, key);

          // B. Handle Anthologies (e.g. Grimms')
          if (key !== 'poem' && processedItem.text.length > 30000) {
              const subStory = extractRandomStory(processedItem.text, entry.date);
              if (subStory) {
                  processedItem.note = `From: ${processedItem.title}`;
                  processedItem.title = subStory.title;
                  processedItem.text = subStory.text;
                  // Author remains the same
              }
          }

          // C. Preserve notes
          if (!processedItem.note && entry[key].note) {
              processedItem.note = entry[key].note;
          }
          newEntry[key] = processedItem;
      }
  });
  return newEntry;
};

const formatReaderText = (text, category, title) => {
  // 0. Pre-clean the text using heuristics
  const cleanedText = cleanContent(text, title, category);

  // Split into paragraphs (double newline), robust for \r\n
  const paragraphs = cleanedText.split(/\r?\n\s*\r?\n/);
  
  return paragraphs.map(p => {
    // For Poems: Preserve line breaks explicitly
    if (category === 'poem') {
      return `<p>${p.replace(/\r?\n/g, "<br>")}</p>`;
    }
    // For Prose: Treat single newlines as spaces to allow reflow
    return `<p>${p.replace(/\r?\n/g, " ")}</p>`;
  }).join("");
};

const buildCard = (label, item, dateKey) => {
  const card = document.createElement("article");
  card.className = "card";

  const readHistory = loadReadHistory();
  const isRead = readHistory.has(item.url);
  // Robust check for full text availability
  // Handles numeric year (1916) or string year ("Public Domain")
  // Treat anything effectively 'old' or unmarked (likely PD) as readable if it has text.
  let isPD = false;
  if (typeof item.year === 'number') {
      isPD = item.year < 1929;
  } else if (typeof item.year === 'string') {
      isPD = item.year === "Public Domain" || item.year === "Unknown";
  } else {
      isPD = true; // Fallback
  }
  
  const hasFullText = isPD && item.text && item.text.length > 100;

  // Map label to data key category
  const categoryMap = { "Poem": "poem", "Short Story": "story", "Essay": "essay" };
  const category = categoryMap[label];

  // Construct URL or Link
  // We use query params to trigger reader view
  const href = hasFullText 
    ? `?read=true&date=${dateKey}&category=${category}`
    : item.url;
  
  // Create container to hold button for easier layout
  card.innerHTML = `
    <div style="position: relative; height: 100%;">
        <a 
        href="${href}" 
        class="card-front"
        ${hasFullText ? "" : 'target="_blank" rel="noopener noreferrer"'}
        >
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <span class="tag">${label}</span>
        </div>
        
        <h3>${item.title}</h3>
        <p class="byline">${item.author} (${item.year})</p>
        <p>${item.note || ""}</p>
        <span class="read-btn ${isRead ? "read" : ""}">
            ${isRead ? "Read \u2713" : (hasFullText ? "Read Now" : `Read from ${item.source} &rarr;`)}
        </span>
        </a>
        
        ${hasFullText && item.text ? `
        <button class="icon-btn-simple card-play-btn" 
            data-title="${item.title}"
            aria-label="Listen to ${item.title}" 
            title="Listen" 
            style="position: absolute; top: 1.25rem; right: 1.25rem; z-index: 10;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        </button>
        ` : ''}
    </div>
  `;

  const link = card.querySelector(".card-front");
  const playBtn = card.querySelector(".card-play-btn");
  const btn = link.querySelector(".read-btn"); // btn is inside link now

  if (playBtn) {
      playBtn.addEventListener("click", (e) => {
          e.stopPropagation(); // Don't trigger card link
          e.preventDefault();
          
          if (isPlaying && audioQueue.length > 0 && audioQueue[0].title === item.title) {
              stopAudio();
          } else {
              playText(item.text, item.title, item.author, label);
          }
      });
  }

  // Handle navigation click separately since button is outside anchor tag logically in some browsers if improper,
  // but here it is sibling. The issue with `card.innerHTML` rewrite is that it changes the structure expected by styles?
  // Check `card-front` styles. It expects to be direct child of `card`?
  // `.card-front` has `padding: 1.6rem`.
  // Since I wrapped it in a div, `card > .card-front` selector might fail if it exists.
  // Viewing styles.css: `.card-front` is a class selector, not child selector.
  // `.card` has flex column.
  // My wrapper div needs `height: 100%; display: flex; flex-direction: column;` to match?
  // No, `card-front` has `height: 100%`.
  // The wrapper div `height: 100%` should propagate.

  link.addEventListener("click", () => {
    if (!readHistory.has(item.url)) {
      readHistory.add(item.url);
      saveReadHistory(readHistory);
      if (btn.textContent !== "Read \u2713") {
         btn.textContent = "Read \u2713";
         btn.classList.add("read");
      }
      // Refresh archive badges
      const archive = loadArchive();
      updateArchives(archive);
    }
    // If it's a reader link, we let the browser handle the navigation (reload with params)
  });

  return card;
};

const renderDaily = (entry) => {
  const todayKey = isoDate(new Date());
  const isToday = entry.date === todayKey;

  // Update UI state for Archive vs Today
  if (isToday) {
     // heroLabel removed
     dailyHeaderTitle.textContent = "Today’s Reading";
     backToTodayBtn.classList.add("hidden");
  } else {
     // heroLabel removed
     dailyHeaderTitle.textContent = "Reading"; // or `Reading Quest: ${entry.date}`
     backToTodayBtn.classList.remove("hidden");
  }
  
  todayDate.textContent = dateFormatter.format(parseLocalDate(entry.date));
  
  // Ensure audio controls are visible if we have content
  const playAllBtn = document.getElementById("play-all-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  
  if (playAllBtn) playAllBtn.classList.remove("hidden");
  if (prevBtn) prevBtn.classList.remove("hidden");
  if (nextBtn) nextBtn.classList.remove("hidden");
  
  dailyContent.innerHTML = "";
  dailyContent.append(
    buildCard("Poem", entry.poem, entry.date),
    buildCard("Short Story", entry.story, entry.date),
    buildCard("Essay", entry.essay, entry.date)
  );
};

const toastMessage = (message) => {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
};

const getCompletionStatus = (entry) => {
  const history = loadReadHistory();
  const urls = [entry.poem.url, entry.story.url, entry.essay.url];
  const readCount = urls.filter(u => history.has(u)).length;
  
  if (readCount === 3) return { label: "Complete", cls: "complete" };
  if (readCount > 0) return { label: `${readCount}/3 Read`, cls: "partial" };
  return { label: "Not Started", cls: "none" };
};

const createArchiveItem = (entry) => {
  const wrapper = document.createElement("div");
  wrapper.className = "archive-item";

  const status = getCompletionStatus(entry);

  const label = document.createElement("div");
  label.innerHTML = `
    <h4>
      ${dateFormatter.format(parseLocalDate(entry.date))}
      <span class="status-badge ${status.cls}">${status.label}</span>
    </h4>
    <p class="muted">Poem: ${entry.poem.title} • Story: ${entry.story.title} • Essay: ${entry.essay.title}</p>
  `;

  const button = document.createElement("button");
  button.textContent = "View";
  button.addEventListener("click", () => {
    if (!currentUser) {
        authModal.showModal();
        return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("read");
    url.searchParams.delete("category");
    url.searchParams.set("date", entry.date);
    window.history.pushState({}, "", url);
    
    renderDaily(entry);
    
    // Switch to Home View
    archiveView.classList.add("hidden");
    readerView.classList.add("hidden");
    homeView.classList.remove("hidden");
    
    toastMessage(`Showing ${entry.date}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  wrapper.append(label, button);
  return wrapper;
};

const renderArchiveList = (entries, container) => {
  container.innerHTML = "";
  if (!entries.length) {
    container.innerHTML = "<p class=\"muted\">No archive yet.</p>";
    return;
  }
  entries.forEach(entry => container.append(createArchiveItem(entry)));
};

const updateArchives = (archive) => {
  const todayKey = isoDate(new Date());
  const entries = Object.values(archive)
    .filter(entry => entry.date !== todayKey)
    .sort((a, b) => (a.date < b.date ? 1 : -1));


  // Render recent (top 3)
  renderArchiveList(entries.slice(0, 3), dateList);
  
  // Render full
  renderArchiveList(entries, fullArchiveList);
};


const shareEntry = async (dateKey) => {
  const url = new URL(window.location.href);
  url.searchParams.set("date", dateKey);
  url.searchParams.delete("read");
  url.searchParams.delete("category");
  
  const shareData = {
    title: "RB Daily Quest",
    text: `Daily reading quest for ${dateKey}`,
    url: url.toString(),
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed', err);
      }
      // If user aborted or share failed, fallback to copy not strictly necessary 
      // but good UX if something weird happened. 
      // However, usually AbortError means user cancelled.
      if (err.name === 'AbortError') return;
    }
  }
  
  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(url.toString());
    toastMessage("Link copied");
  } catch (error) {
    toastMessage("Share failed");
  }
};

const showReader = (entry, category) => {
  const item = entry[category];
  if (!item) return;

  siteHeader.classList.add("hidden");
  homeView.classList.add("hidden");
  readerView.classList.remove("hidden");
  window.scrollTo(0, 0);

  const labelMap = { "poem": "Poem", "story": "Short Story", "essay": "Essay" };
  
  // Clean raw text first
  // Note: Text is already cleaned and extracted in hydrateEntry, but we double-check here just in case specific view logic is needed later.
  // Actually, trust hydrateEntry.
  const displayText = item.text || "";
  const displayTitle = item.title;
  const displayMeta = `${item.author} (${item.year})`;

  readerLabel.textContent = labelMap[category] || "Work";
  readerTitle.textContent = displayTitle;
  readerMeta.textContent = displayMeta;
  readerNote.textContent = item.note || "";
  readerSource.textContent = item.source || "Source";
  readerSource.href = item.url;
  
  // Set current global item for audio player
  window.currentReaderItem = {
      text: displayText,
      title: displayTitle,
      author: item.author,
      category: labelMap[category] || "Text"
  };
  
  // Set content class based on type for CSS styling
  readerText.className = "content-body " + (category === "poem" ? "poem-text" : "prose-text");
  readerText.innerHTML = displayText ? formatReaderText(displayText, category, displayTitle) : "<p>Text not available.</p>";

  // Populate Bottom Navigation
  readerNextNav.innerHTML = "";
  const categories = ["poem", "story", "essay"];
  
  categories.forEach(cat => {
    if (cat === category) return; // Skip current
    
    const catItem = entry[cat];
    const catLabel = labelMap[cat];
    if (!catItem) return;

    const btn = document.createElement("button");
    btn.className = "next-nav-btn";
    
    // Check Read Status
    const history = loadReadHistory();
    const isRead = history.has(catItem.url);
    if (isRead) {
        btn.classList.add("read");
        btn.textContent = `${catLabel} \u2713`;
    } else {
        btn.textContent = `Read ${catLabel}`;
    }
    
    // Robust Full Text Check (Same as card logic)
    let isPD = false;
    if (typeof catItem.year === 'number') {
        isPD = catItem.year < 1929;
    } else if (typeof catItem.year === 'string') {
        isPD = catItem.year === "Public Domain" || catItem.year === "Unknown";
    } else {
        isPD = true; // Fallback
    }
    const hasFullText = isPD && catItem.text && catItem.text.length > 100;

    btn.addEventListener("click", () => {
       if (hasFullText) {
         // Internal navigation
         const url = new URL(window.location.href);
         url.searchParams.set("read", "true");
         url.searchParams.set("category", cat);
         window.history.pushState({}, "", url);
         showReader(entry, cat);
         window.scrollTo(0, 0);
       } else {
         // External link
         window.open(catItem.url, "_blank");
         // Also mark as read? Yes, consistency with cards
         const readHistory = loadReadHistory();
         readHistory.add(catItem.url);
         saveReadHistory(readHistory);
         
         // Update UI immediately for this button
         btn.classList.add("read");
         btn.textContent = `${catLabel} \u2713`;
       }
    });
    
    readerNextNav.append(btn);
  });

  // Home Button
  const homeBtn = document.createElement("button");
  homeBtn.className = "next-nav-btn home-btn";
  homeBtn.textContent = "Home";
  homeBtn.addEventListener("click", () => {
     readerBack.click(); // Reuse existing back logic
  });
  readerNextNav.append(homeBtn);
};

const init = async () => {
  await fetchLibrary();
  let { today, archive } = ensureTodayEntry();
  
  // Hydrate today's entry with latest/fetched data
  // This seamlessly upgrades cached local entries to full-text versions
  today = hydrateEntry(today);
  // Update the archive with the improved version
  archive[today.date] = today;
  saveArchive(archive); // Persist the upgrade

  const params = new URLSearchParams(window.location.search);
  const isReadMode = params.get("read") === "true";
  const dateParam = params.get("date");
  const categoryParam = params.get("category");

  // Determine active entry
  let activeEntry = today;
  if (dateParam) {
    if (archive[dateParam]) {
       activeEntry = hydrateEntry(archive[dateParam]); // Hydrate past entries too
    } else {
       // Valid date but not in archive? Generate it.
       if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
         activeEntry = createEntry(dateParam);
         // No need to hydrate newly created entries as they use current libraryData
       }
    }
  }

  // todayDate update is now handled in renderDaily
  
  if (isReadMode && categoryParam && activeEntry[categoryParam] && activeEntry[categoryParam].text) {
    showReader(activeEntry, categoryParam);
  } else {
    siteHeader.classList.remove("hidden");
    homeView.classList.remove("hidden");
    readerView.classList.add("hidden");
    renderDaily(activeEntry);
  }

  updateArchives(archive);

  if (shareButton) {
    shareButton.addEventListener("click", () => shareEntry(activeEntry.date));
  }
  
  backToTodayBtn.addEventListener("click", () => {
    // Return to today's entry
    const url = new URL(window.location.href);
    url.searchParams.delete("date");
    window.history.pushState({}, "", url);
    
    renderDaily(today);
    toastMessage("Back to today");
  });

  readerBack.addEventListener("click", () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("read");
    url.searchParams.delete("category");
    // Keeps date param if it was there
    window.history.pushState({}, "", url);
    
    siteHeader.classList.remove("hidden");
    homeView.classList.remove("hidden");
    readerView.classList.add("hidden");
    renderDaily(activeEntry);
    
    // Also re-update archives to refresh status badges
    updateArchives(archive);
    
    window.scrollTo(0, 0);
  });

  // Archive View Navigation
  viewArchiveBtn.addEventListener("click", () => {
    if (!currentUser) {
        authModal.showModal();
        return;
    }
    siteHeader.classList.add("hidden");
    homeView.classList.add("hidden");
    archiveView.classList.remove("hidden");
    window.scrollTo(0, 0);
  });

  archiveBack.addEventListener("click", () => {
    archiveView.classList.add("hidden");
    homeView.classList.remove("hidden");
    siteHeader.classList.remove("hidden");
    window.scrollTo(0, 0);
  });
  
  // --- AUTH LISTENERS ---
  const emailAuthForm = document.getElementById("email-auth-form");
  const emailInput = document.getElementById("email-input");
  const passwordInput = document.getElementById("password-input");
  const authError = document.getElementById("auth-error");
  const emailSignupBtn = document.getElementById("email-signup-btn");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        authError.classList.add("hidden");
        authModal.showModal();
    });
  }
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => authModal.close());
  }

  // Handle Email Sign In
  if (emailAuthForm) {
      emailAuthForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          authError.classList.add("hidden");
          const email = emailInput.value;
          const password = passwordInput.value;
          
          try {
              await signInWithEmailAndPassword(auth, email, password);
              authModal.close();
              toastMessage("Welcome back!");
              emailAuthForm.reset();
          } catch (error) {
              console.error(error);
              authError.textContent = getAuthErrorMessage(error.code);
              authError.classList.remove("hidden");
          }
      });
  }

  // Handle Create Account
  if (emailSignupBtn) {
      emailSignupBtn.addEventListener("click", async () => {
          authError.classList.add("hidden");
          const email = emailInput.value;
          const password = passwordInput.value;
          
          if (!email || !password) {
              authError.textContent = "Please enter both email and password.";
              authError.classList.remove("hidden");
              return;
          }
          
          try {
              await createUserWithEmailAndPassword(auth, email, password);
              authModal.close();
              toastMessage("Account created!");
              emailAuthForm.reset();
          } catch (error) {
              console.error(error);
              authError.textContent = getAuthErrorMessage(error.code);
              authError.classList.remove("hidden");
          }
      });
  }
  
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", async () => {
       authError.classList.add("hidden");
       try {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
          authModal.close();
          toastMessage(`Welcome!`);
       } catch (e) {
          console.error(e);
          toastMessage("Google Sign In failed");
       }
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => signOut(auth));
  }
  
  if (auth) {
      onAuthStateChanged(auth, user => {
          currentUser = user;
          if (user) {
              loginBtn.classList.add("hidden");
              userProfile.classList.remove("hidden");
              // Use email as fallback for name if display name is missing
              const name = user.displayName ? user.displayName.split(" ")[0] : user.email.split("@")[0];
              userName.textContent = name;
              syncUserHistory(user);
          } else {
              loginBtn.classList.remove("hidden");
              userProfile.classList.add("hidden");
              
              // Revert to local storage only
              currentReadHistory = new Set();
              try {
                  const local = JSON.parse(localStorage.getItem(READ_KEY) || "[]");
                  local.forEach(url => currentReadHistory.add(url));
              } catch (e) {}

              
              // Force UI refresh
              const archive = loadArchive();
              updateArchives(archive);
          }
      });
  }
// --- END AUTH LISTENERS ---

  // --- AUDIO LISTENERS ---
  const audioModal = document.getElementById("audio-modal");
  const audioSettingsBtn = document.getElementById("audio-settings-btn");
  const closeAudioBtn = document.getElementById("close-audio-btn");
  const voiceSelect = document.getElementById("voice-select");
  const playAllBtn = document.getElementById("play-all-btn");
  const stopAudioBtn = document.getElementById("stop-audio-btn");
  const readerSpeakBtn = document.getElementById("reader-speak-btn");
  const readerShareBtn = document.getElementById("reader-share-btn");

  if (audioSettingsBtn) {
      audioSettingsBtn.addEventListener("click", () => {
          updateVoiceSelect(); // Refresh list just in case
          audioModal.showModal();
      });
  }
  
  if (closeAudioBtn) {
      closeAudioBtn.addEventListener("click", () => audioModal.close());
  }
  
  if (stopAudioBtn) {
      stopAudioBtn.addEventListener("click", () => {
          stopAudio();
          audioModal.close();
      });
  }
  
  if (voiceSelect) {
      voiceSelect.addEventListener("change", (e) => {
          const selectedURI = e.target.value;
          currentVoice = voices.find(v => v.voiceURI === selectedURI);
          if (currentVoice) {
              localStorage.setItem('rb-voice-uri', currentVoice.voiceURI);
              // Preview voice
              stopAudio(); // Stop current
              const utt = new SpeechSynthesisUtterance("Voice selected.");
              utt.voice = currentVoice;
              synth.speak(utt);
          }
      });
  }
  
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => skipAudio(-1));
  }
  
  if (nextBtn) {
    nextBtn.addEventListener("click", () => skipAudio(1));
  }
  
  if (playAllBtn) {
      // Logic for playing the full day's quest
      playAllBtn.addEventListener("click", () => {
          if (isPlaying) {
              stopAudio();
          } else {
              // We need the current active entry.
              // We can grab it from `hydrateEntry` cache or assume it's `today` if on home screen.
              // Better: renderDaily attaches the entry to the play button or we access a global `currentRenderedEntry`?
              // Let's use `ensureTodayEntry().today` if we are on the daily view.
              // Wait, if the user navigated to an archive day, we want THAT day.
              // `renderDaily` updates the UI based on an entry.
              // Let's modify renderDaily to store the current entry in a module-level variable or attached to the DOM.
              
              const currentDate = todayDate.textContent; // This is formatted.
              // Simple hack: We can fetch the entry from archive using the date param in URL or today.
              
              const params = new URLSearchParams(window.location.search);
              const dateParam = params.get("date") || isoDate(new Date());
              
              const { archive } = ensureTodayEntry();
              // Hydrate it to get text
              let entry = archive[dateParam] || createEntry(dateParam);
              entry = hydrateEntry(entry);
              
              playQuest(entry);
          }
      });
  }
  
  if (readerSpeakBtn) {
      readerSpeakBtn.addEventListener("click", () => {
          if (isPlaying) {
              stopAudio();
          } else {
              // Grab content from DOM or re-fetch?
              // Creating a global `currentReaderItem` is cleanest.
              // See `showReader` below. We will patch it.
              if (window.currentReaderItem) {
                  playText(
                      window.currentReaderItem.text, 
                      window.currentReaderItem.title, 
                      window.currentReaderItem.author, 
                      window.currentReaderItem.category
                  );
              }
          }
      });
  }

  if (readerShareBtn) {
    readerShareBtn.addEventListener("click", () => {
      const title = document.getElementById("reader-title")?.textContent || "Reading";
      const meta = document.getElementById("reader-meta")?.textContent || "";
      const url = window.location.href;

      const shareData = {
        title: `RB Daily Quest: ${title}`,
        text: `Reading "${title}" ${meta} on RB Daily Quest`,
        url: url,
      };

      if (navigator.share) {
        navigator.share(shareData).catch((err) => {
          if (err.name !== "AbortError") console.error("Share failed", err);
        });
      } else {
        navigator.clipboard
          .writeText(url)
          .then(() => toastMessage("Link copied"))
          .catch(() => toastMessage("Share failed"));
      }
    });
  }
}; // Ends init

const getAuthErrorMessage = (code) => {
    switch (code) {
        case 'auth/invalid-email': return 'Invalid email address.';
        case 'auth/user-disabled': return 'User disabled.';
        case 'auth/user-not-found': return 'User not found.';
        case 'auth/wrong-password': return 'Incorrect password.';
        case 'auth/email-already-in-use': return 'Email already in use.';
        case 'auth/weak-password': return 'Password is too weak.';
        case 'auth/missing-password': return 'Please enter a password.';
        default: return 'Authentication failed. Please try again.';
    }
};

init();
