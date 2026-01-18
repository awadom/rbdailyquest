const DATA = {
  poems: [
    {
      title: "The Road Not Taken",
      author: "Robert Frost",
      source: "Poetry Foundation",
      url: "https://www.poetryfoundation.org/poems/44272/the-road-not-taken",
      note: "A classic meditation on choice and consequence.",
    },
    {
      title: "The Love Song of J. Alfred Prufrock",
      author: "T. S. Eliot",
      source: "Poetry Foundation",
      url: "https://www.poetryfoundation.org/poems/44212/the-love-song-of-j-alfred-prufrock",
      note: "Modernist uncertainty and longing in brilliant cadence.",
    },
    {
      title: "If—",
      author: "Rudyard Kipling",
      source: "Poets.org",
      url: "https://poets.org/poem/if",
      note: "A timeless poem of resolve and resilience.",
    },
    {
      title: "Because I could not stop for Death",
      author: "Emily Dickinson",
      source: "Poets.org",
      url: "https://poets.org/poem/because-i-could-not-stop-death-479",
      note: "An unforgettable ride with eternity.",
    },
    {
      title: "Ode to a Nightingale",
      author: "John Keats",
      source: "Poetry Foundation",
      url: "https://www.poetryfoundation.org/poems/44479/ode-to-a-nightingale",
      note: "An ode to beauty, impermanence, and escape.",
    },
  ],
  essays: [
    {
      title: "Self-Reliance",
      author: "Ralph Waldo Emerson",
      source: "Emerson Central",
      url: "https://emersoncentral.com/texts/essays-first-series/self-reliance/",
      note: "A foundational call for individual thought.",
    },
    {
      title: "Civil Disobedience",
      author: "Henry David Thoreau",
      source: "Project Gutenberg",
      url: "https://www.gutenberg.org/ebooks/71",
      note: "A fierce argument for conscience over compliance.",
    },
    {
      title: "A Room of One’s Own",
      author: "Virginia Woolf",
      source: "Project Gutenberg",
      url: "https://www.gutenberg.org/ebooks/14036",
      note: "A luminous essay on art, space, and freedom.",
    },
    {
      title: "A Modest Proposal",
      author: "Jonathan Swift",
      source: "Project Gutenberg",
      url: "https://www.gutenberg.org/files/1080/1080-h/1080-h.htm",
      note: "A satirical masterpiece on rational cruelty.",
    },
    {
      title: "Politics and the English Language",
      author: "George Orwell",
      source: "The Orwell Foundation",
      url: "https://www.orwellfoundation.com/the-orwell-foundation/orwell/essays-and-other-works/politics-and-the-english-language/",
      note: "A defense of clear thinking and clear writing.",
    },
  ],
  stories: [
    {
      title: "The Gift of the Magi",
      author: "O. Henry",
      source: "American Literature",
      url: "https://americanliterature.com/author/o-henry/short-story/the-gift-of-the-magi",
      note: "A classic tale of sacrifice and love.",
    },
    {
      title: "The Tell-Tale Heart",
      author: "Edgar Allan Poe",
      source: "American Literature",
      url: "https://americanliterature.com/author/edgar-allan-poe/short-story/the-tell-tale-heart",
      note: "A chilling study of guilt and obsession.",
    },
    {
      title: "The Story of an Hour",
      author: "Kate Chopin",
      source: "American Literature",
      url: "https://americanliterature.com/author/kate-chopin/short-story/the-story-of-an-hour",
      note: "A razor-sharp exploration of freedom.",
    },
    {
      title: "The Last Question",
      author: "Isaac Asimov",
      source: "East of the Web",
      url: "https://www.eastoftheweb.com/short-stories/UBooks/LastQues.shtml",
      note: "A cosmic story about humanity and entropy.",
    },
    {
      title: "The Open Window",
      author: "Saki",
      source: "Project Gutenberg",
      url: "https://www.gutenberg.org/ebooks/1477",
      note: "A witty, unsettling twist in miniature.",
    },
  ],
};

const STORAGE_KEY = "rb-daily-quest-v2";
const ARCHIVE_KEY = "rb-daily-quest-archive-v2";

const dailyContent = document.getElementById("daily-content");
const archiveList = document.getElementById("archive-list");
const todayDate = document.getElementById("today-date");
const archiveCount = document.getElementById("archive-count");
const copyLinkButton = document.getElementById("copy-link");
const exportButton = document.getElementById("export-archive");
const toast = document.getElementById("toast");

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const isoDate = (date) => date.toISOString().split("T")[0];

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
    poem: pickRandom(DATA.poems, random),
    story: pickRandom(DATA.stories, random),
    essay: pickRandom(DATA.essays, random),
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

const buildCard = (label, item) => {
  const card = document.createElement("a");
  card.className = "card";
  card.href = item.url;
  card.target = "_blank";
  card.rel = "noreferrer";

  card.innerHTML = `
    <span class="tag">${label}</span>
    <h3>${item.title}</h3>
    <p class="byline">${item.author}</p>
    <p>${item.note}</p>
    <span class="read-link">Read from ${item.source} &rarr;</span>
  `;

  return card;
};

const renderDaily = (entry) => {
  dailyContent.innerHTML = "";
  dailyContent.append(
    buildCard("Poem", entry.poem),
    buildCard("Short Story", entry.story),
    buildCard("Essay", entry.essay)
  );
};

const renderArchive = (archive) => {
  const entries = Object.values(archive).sort((a, b) =>
    a.date < b.date ? 1 : -1
  );

  archiveCount.textContent = entries.length.toString();

  if (!entries.length) {
    archiveList.innerHTML =
      "<p class=\"muted\">No archive yet. Visit daily to build your streak.</p>";
    return;
  }

  archiveList.innerHTML = "";

  entries.forEach((entry) => {
    const wrapper = document.createElement("div");
    wrapper.className = "archive-item";

    const label = document.createElement("div");
    label.innerHTML = `
      <h4>${dateFormatter.format(new Date(entry.date))}</h4>
      <p class="muted">Poem: ${entry.poem.title} • Story: ${entry.story.title} • Essay: ${entry.essay.title}</p>
    `;

    const button = document.createElement("button");
    button.textContent = "View";
    button.addEventListener("click", () => {
      renderDaily(entry);
      toastMessage(`Showing ${entry.date}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    wrapper.append(label, button);
    archiveList.append(wrapper);
  });
};

const toastMessage = (message) => {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
};

const copyShareLink = async (dateKey) => {
  const url = new URL(window.location.href);
  url.searchParams.set("date", dateKey);
  try {
    await navigator.clipboard.writeText(url.toString());
    toastMessage("Link copied");
  } catch (error) {
    toastMessage("Copy failed");
  }
};

const exportArchive = (archive) => {
  const data = JSON.stringify(archive, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "rb-daily-quest-archive.json";
  anchor.click();
  URL.revokeObjectURL(url);
  toastMessage("Archive exported");
};

const init = () => {
  const { today, archive } = ensureTodayEntry();
  todayDate.textContent = dateFormatter.format(new Date(today.date));

  const params = new URLSearchParams(window.location.search);
  const dateParam = params.get("date");
  if (dateParam && archive[dateParam]) {
    renderDaily(archive[dateParam]);
  } else {
    renderDaily(today);
  }

  renderArchive(archive);

  copyLinkButton.addEventListener("click", () => copyShareLink(today.date));
  exportButton.addEventListener("click", () => exportArchive(archive));
};

init();
