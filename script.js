// === DOM ELEMENTS ===
const form = document.getElementById('apod-form');
const resultDiv = document.getElementById('apod-result');
const randomBtn = document.getElementById('random-btn');
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

  try {
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${date}`);
    const data = await res.json();

    if (!data || !data.url || data.code) {
      resultDiv.innerHTML = `
        <h2>NASA's APOD is currently unavailable.</h2>
        <p>Try using the Random button or check back later.</p>
      `;
      return;
    }

    let media = '';
    let downloadLink = '';

    if (data.media_type === 'image') {
      media = `<img src="${data.url}" alt="${data.title}" class="apod-image" />`;
      downloadLink = `<a href="${data.hdurl || data.url}" download class="download-btn">Download Image</a>`;
    } else if (data.media_type === 'video') {
      media = `
        <div class="video-container">
          <iframe src="${data.url}" frameborder="0" allowfullscreen></iframe>
        </div>
        <p class="video-note">This is a video. If it doesn't display, <a href="${data.url}" target="_blank">click here to view it externally</a>.</p>
      `;
    }

    resultDiv.innerHTML = `
      <h2 class="apod-title">${data.title}</h2>
      ${media}
      ${downloadLink}
      <p class="apod-description">${data.explanation}</p>
      <button onclick='saveFavoriteByData(${JSON.stringify({
        title: data.title,
        date: data.date,
        url: data.url
      })})' class="card-btn">Add to Favorites</button>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<p>Error fetching APOD: ${err.message}</p>`;
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

// === AUTO-SCROLLING CAROUSEL ===
async function loadCarousel() {
  carouselTrack.innerHTML = '';

  const images = [];
  let attempts = 0;
  let i = 0;

  while (images.length < 7 && attempts < 15) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    i++;
    attempts++;

    try {
      const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${dateStr}`);
      const data = await res.json();
      if (data.media_type === 'image' && data.url) {
        images.push(data);
      }
    } catch (err) {
      console.error(`Carousel fetch failed for ${dateStr}:`, err);
    }
  }

  if (images.length === 0) {
    carouselTrack.innerHTML = `<p>Could not load recent images.</p>`;
    return;
  }

  [...images, ...images].forEach(data => {
    const card = document.createElement('div');
    card.classList.add('carousel-card');
    card.innerHTML = `
      <img src="${data.url}" alt="${data.title}" />
      <h4 class="card-title">${data.title}</h4>
      <small>${data.date}</small>
      <button class="card-btn" onclick='saveFavoriteByData(${JSON.stringify({
        title: data.title,
        date: data.date,
        url: data.url
      })})'>Add to Favorites</button>
    `;
    carouselTrack.appendChild(card);
  });
}

// === FAVORITES SYSTEM ===
function saveFavoriteByData(data) {
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  const exists = favorites.some(f => f.url === data.url);
  if (!exists) {
    favorites.push(data);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    alert("Added to Favorites!");
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

// === SEARCH FUNCTIONALITY ===
const searchForm = document.getElementById('search-form');
const searchQueryInput = document.getElementById('search-query');
const searchResults = document.getElementById('search-results');

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = searchQueryInput.value.trim();
  if (!query) return;

  searchResults.innerHTML = `<p>Searching...</p>`;
  try {
    const res = await fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`);
    const data = await res.json();
    const items = data.collection.items;

    if (!items.length) {
      searchResults.innerHTML = `<p>No results found for "${query}".</p>`;
      return;
    }

    searchResults.innerHTML = '';
    items.slice(0, 15).forEach(item => {
      const title = item.data[0].title;
      const imageUrl = item.links?.[0]?.href;

      const card = document.createElement('div');
      card.classList.add('search-card');
      card.innerHTML = `
        <img src="${imageUrl}" alt="${title}" />
        <h4>${title}</h4>
        <button class="card-btn" onclick='saveFavoriteByData(${JSON.stringify({
          title: title,
          url: imageUrl
        })})'>Add to Favorites</button>
      `;
      searchResults.appendChild(card);
    });
  } catch (err) {
    console.error("Search failed:", err);
    searchResults.innerHTML = `<p>Error fetching search results.</p>`;
  }
});

// === INITIAL LOAD ===
document.addEventListener('DOMContentLoaded', () => {
  fetchAPOD(today);
  loadCarousel();
});
