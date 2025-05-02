// === DOM ELEMENTS ===
const tabs = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.tab-section');
const resultDiv = document.getElementById('apod-result');
const carouselTrack = document.getElementById('carousel-track');
const favoritesList = document.getElementById('favorites-list');
const feedbackPopup = document.getElementById('feedback-popup');
const searchForm = document.getElementById('search-form');
const searchQueryInput = document.getElementById('search-query');
const searchResults = document.getElementById('search-results');

// === API KEY ===
let apiKey = localStorage.getItem('apiKey') || prompt("Enter your NASA API Key:");
localStorage.setItem('apiKey', apiKey);

// === TAB SWITCHING ===
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(btn => btn.classList.remove('active'));
    sections.forEach(sec => sec.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'home') loadHome();
    if (tab.dataset.tab === 'favorites') renderFavorites();
  });
});

// === INITIALIZE ===
window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('[data-tab="home"]').click();
});

// === FEEDBACK ===
function showFeedback(message = "Added to Favorites") {
  feedbackPopup.textContent = message;
  feedbackPopup.classList.add('visible');
  setTimeout(() => feedbackPopup.classList.remove('visible'), 2000);
}

// === APOD VIEWER ===
async function fetchAPOD(date) {
  resultDiv.innerHTML = `<div class="spinner"></div>`;
  try {
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${date}`);
    const data = await res.json();
    if (data.code) throw new Error(data.msg);

    const media = data.media_type === 'image'
      ? `<img src="${data.url}" alt="${data.title}" />`
      : `<iframe src="${data.url}" frameborder="0" allowfullscreen></iframe>`;

    resultDiv.innerHTML = `
      <a href="${data.hdurl || data.url}" target="_blank">Download Image</a>
      <h2>${data.title}</h2>
      ${media}
      <p>${data.explanation}</p>
      <button class="card-btn" onclick='saveFavoriteByData(${JSON.stringify({
        title: data.title,
        date: data.date,
        url: data.url
      })})'>Add to Favorites</button>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// === HOMEPAGE ===
async function loadHome() {
  const today = new Date().toISOString().split('T')[0];
  fetchAPOD(today);
  loadCarousel();
}

// === CAROUSEL ===
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
          <button class="card-btn" onclick='saveFavoriteByData(${JSON.stringify({
            title: data.title,
            date: data.date,
            url: data.url
          })})'>Add to Favorites</button>
        `;
        carouselTrack.appendChild(card);
      }
    } catch (err) {
      console.error("Carousel fetch failed:", err);
    }
  }
}

// === FAVORITES ===
function saveFavoriteByData(data) {
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  if (!favorites.some(f => f.url === data.url)) {
    favorites.push(data);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    showFeedback();
  }
}

function renderFavorites() {
  favoritesList.innerHTML = '';
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  favorites.forEach(data => {
    const card = document.createElement('div');
    card.classList.add('favorite-card');
    card.innerHTML = `
      <img src="${data.url}" alt="${data.title}" />
      <h4>${data.title}</h4>
      <p>${data.date || ''}</p>
      <button class="card-btn" onclick="removeFavoriteByUrl('${data.url}')">Remove</button>
    `;
    favoritesList.appendChild(card);
  });
}

function removeFavoriteByUrl(url) {
  let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  favorites = favorites.filter(f => f.url !== url);
  localStorage.setItem('favorites', JSON.stringify(favorites));
  renderFavorites();
}

// === SEARCH ===
if (searchForm) {
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchQueryInput.value.trim();
    if (!query) return;

    searchResults.innerHTML = `<div class="spinner"></div>`;

    try {
      const res = await fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`);
      const data = await res.json();
      const items = data.collection.items.slice(0, 20);

      if (items.length === 0) {
        searchResults.innerHTML = `<p>No results found for "${query}".</p>`;
        return;
      }

      searchResults.innerHTML = '';
      items.forEach(item => {
        const img = item.links?.[0]?.href;
        const title = item.data?.[0]?.title || 'Untitled';
        const link = item.href || '#';

        const card = document.createElement('div');
        card.classList.add('search-card');
        card.innerHTML = `
          <img src="${img}" alt="${title}">
          <h4>${title}</h4>
          <a href="${link}" target="_blank">View Full</a>
          <button class="card-btn" onclick='saveFavoriteByData(${JSON.stringify({
            title: title,
            url: img,
            date: ''
          })})'>Add to Favorites</button>
        `;
        searchResults.appendChild(card);
      });
    } catch (err) {
      console.error("Search error:", err);
      searchResults.innerHTML = `<p>Error retrieving results. Please try again later.</p>`;
    }
  });
}

