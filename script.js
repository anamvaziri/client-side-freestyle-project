// === DOM ELEMENTS ===
const form = document.getElementById('apod-form');
const resultDiv = document.getElementById('apod-result');
const downloadBtn = document.getElementById('download-btn');
const randomBtn = document.getElementById('random-btn');
const toggleThemeBtn = document.getElementById('toggle-theme');
const dateInput = document.getElementById('date');
const tabs = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.tab-section');
const carouselTrack = document.getElementById('carousel-track');
const favoritesList = document.getElementById('favorites-list');

// === INITIAL SETUP ===
const today = new Date().toISOString().split('T')[0];
dateInput.value = today;
dateInput.max = today;
dateInput.min = "1995-06-16";

let apiKey = localStorage.getItem('apiKey') || prompt("Enter your NASA API Key:");
localStorage.setItem('apiKey', apiKey);

// === THEME HANDLING ===
function setTheme(isLight) {
  document.body.classList.toggle('light', isLight);
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  toggleThemeBtn.textContent = isLight ? "Switch to Dark Theme" : "Switch to Light Theme";
}
setTheme(localStorage.getItem('theme') === 'light');

// === TAB SWITCHING ===
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(btn => btn.classList.remove('active'));
    sections.forEach(sec => sec.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'home') loadCarousel();
    if (tab.dataset.tab === 'favorites') renderFavorites();
  });
});

// === FETCH SINGLE APOD ===
async function fetchAPOD(date) {
  resultDiv.innerHTML = `<div class="spinner"></div>`;
  resultDiv.style.display = 'block';
  downloadBtn.style.display = 'none';

  try {
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${date}`);
    const data = await res.json();

    if (data.code) throw new Error(data.msg);

    let media = '';
    if (data.media_type === 'image') {
      media = `<img src="${data.url}" alt="${data.title}" />`;
      downloadBtn.href = data.hdurl || data.url;
      downloadBtn.style.display = 'block';
    } else if (data.media_type === 'video') {
      media = `<iframe src="${data.url}" frameborder="0" allowfullscreen></iframe>`;
      downloadBtn.style.display = 'none';
    }

    resultDiv.innerHTML = `
      <h2>${data.title}</h2>
      ${media}
      <p>${data.explanation}</p>
      <button onclick="saveFavorite('${data.date}')">Save to Favorites</button>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<p>Error: ${err.message}</p>`;
    console.error(err);
  }
}

// === FORM SUBMIT ===
form.addEventListener('submit', e => {
  e.preventDefault();
  fetchAPOD(dateInput.value);
});

// === RANDOM BUTTON ===
randomBtn.addEventListener('click', () => {
  const start = new Date(1995, 5, 16).getTime();
  const end = new Date().getTime();
  const random = new Date(start + Math.random() * (end - start));
  const randomDate = random.toISOString().split('T')[0];
  dateInput.value = randomDate;
  fetchAPOD(randomDate);
});

// === TOGGLE THEME BUTTON ===
toggleThemeBtn.addEventListener('click', () => {
  const isLight = !document.body.classList.contains('light');
  setTheme(isLight);
});

// === RECENT APOD CAROUSEL ===
async function loadCarousel() {
  carouselTrack.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    try {
      const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${dateStr}`);
      const data = await res.json();
      if (data.media_type === 'image') {
        const card = document.createElement('div');
        card.classList.add('carousel-card');
        card.innerHTML = `
          <img src="${data.url}" alt="${data.title}" />
          <h4>${data.title}</h4>
          <small>${data.date}</small>
        `;
        carouselTrack.appendChild(card);
      }
    } catch (err) {
      console.error("Carousel fetch failed:", err);
    }
  }
}

// === FAVORITES SYSTEM ===
function saveFavorite(date) {
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  if (!favorites.includes(date)) {
    favorites.push(date);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    alert("Saved to favorites!");
  }
}

async function renderFavorites() {
  favoritesList.innerHTML = '';
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

  for (const date of favorites) {
    try {
      const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${date}`);
      const data = await res.json();

      const card = document.createElement('div');
      card.classList.add('favorite-card');
      card.innerHTML = `
        <img src="${data.url}" alt="${data.title}" />
        <h4>${data.title}</h4>
        <p>${data.date}</p>
        <button onclick="removeFavorite('${date}')">Remove</button>
      `;
      favoritesList.appendChild(card);
    } catch (err) {
      console.error("Error loading favorite:", err);
    }
  }
}

function removeFavorite(date) {
  let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  favorites = favorites.filter(f => f !== date);
  localStorage.setItem('favorites', JSON.stringify(favorites));
  renderFavorites();
}

// === SEARCH TAB ===
const searchForm = document.getElementById('search-form');
const searchQueryInput = document.getElementById('search-query');
const searchResults = document.getElementById('search-results');

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = searchQueryInput.value.trim();
  if (!query) return;

  searchResults.innerHTML = `<div class="spinner"></div>`;

  try {
    const res = await fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`);
    const data = await res.json();
    const items = data.collection.items.slice(0, 20); // limit to first 20 results

    if (items.length === 0) {
      searchResults.innerHTML = `<p>No results found for "${query}".</p>`;
      return;
    }

    searchResults.innerHTML = '';
    items.forEach(item => {
      const img = item.links?.[0]?.href;
      const title = item.data?.[0]?.title || 'Untitled';
      const desc = item.data?.[0]?.description || '';
      const link = item.href || '#';

      const card = document.createElement('div');
      card.classList.add('search-card');
      card.innerHTML = `
        <img src="${img}" alt="${title}">
        <h4>${title}</h4>
        <a href="${link}" target="_blank" rel="noopener noreferrer">View Full Item</a>
      `;
      searchResults.appendChild(card);
    });

  } catch (err) {
    console.error("Search error:", err);
    searchResults.innerHTML = `<p>Error retrieving results. Please try again later.</p>`;
  }
});
