import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
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
  if (!db) return; // Fallback to local
  
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
  }
};


const STORAGE_KEY = "rb-daily-quest-v3";
const ARCHIVE_KEY = "rb-daily-quest-archive-v3";
const READ_KEY = "rb-daily-quest-read-history-v3";

const loadReadHistory = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const saveReadHistory = (history) => {
  localStorage.setItem(READ_KEY, JSON.stringify([...history]));
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
          newEntry[key] = match;
      }
  });
  return newEntry;
};

const formatReaderText = (text) => 
  text.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");

const buildCard = (label, item, dateKey) => {
  const card = document.createElement("article");
  card.className = "card";

  const readHistory = loadReadHistory();
  const isRead = readHistory.has(item.url);
  const hasFullText = item.year < 1929 && item.text;

  // Map label to data key category
  const categoryMap = { "Poem": "poem", "Short Story": "story", "Essay": "essay" };
  const category = categoryMap[label];

  // Construct URL or Link
  // We use query params to trigger reader view
  const href = hasFullText 
    ? `?read=true&date=${dateKey}&category=${category}`
    : item.url;

  card.innerHTML = `
    <a 
      href="${href}" 
      class="card-front"
      ${hasFullText ? "" : 'target="_blank" rel="noopener noreferrer"'}
    >
      <span class="tag">${label}</span>
      <h3>${item.title}</h3>
      <p class="byline">${item.author} (${item.year})</p>
      <p>${item.note}</p>
      <span class="read-btn ${isRead ? "read" : ""}">
        ${isRead ? "Read \u2713" : (hasFullText ? "Read Now" : `Read from ${item.source} &rarr;`)}
      </span>
    </a>
  `;

  const link = card.querySelector(".card-front");
  const btn = card.querySelector(".read-btn");

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
  readerLabel.textContent = labelMap[category] || "Work";
  readerTitle.textContent = item.title;
  readerMeta.textContent = `${item.author} (${item.year})`;
  readerNote.textContent = item.note || "";
  readerSource.textContent = item.source || "Source";
  readerSource.href = item.url;
  
  readerText.innerHTML = item.text ? formatReaderText(item.text) : "<p>Text not available.</p>";

  // Populate Bottom Navigation
  readerNextNav.innerHTML = "";
  const categories = ["poem", "story", "essay"];
  
  categories.forEach(cat => {
    if (cat === category) return; // Skip current
    
    // Check if item exists and has text (simple check, or just link to it?)
    // If it's internal text, we can link directly.
    // If external, we can still show it but it will open external link?
    // User requested "options like 'poem' 'short story' 'essay'".
    // We should treat them like the cards do.
    
    const catItem = entry[cat];
    const catLabel = labelMap[cat];
    if (!catItem) return;

    const btn = document.createElement("button");
    btn.className = "next-nav-btn";
    btn.textContent = `Read ${catLabel}`;
    
    const hasFullText = catItem.year < 1929 && catItem.text;

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
};

init();
