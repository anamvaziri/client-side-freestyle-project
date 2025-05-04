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
  
      // Fallback handling if the API fails or no media is returned
      if (!data.url || data.code) {
        resultDiv.innerHTML = `
          <h2>NASA's Astronomy Picture of the Day is currently unavailable.</h2>
          <p>Please try again later or use the Random button to view an older image.</p>
        `;
        return;
      }
  
      // Media rendering logic
      let media = '';
      let downloadLink = '';
  
      if (data.media_type === 'image') {
        media = `<img src="${data.url}" alt="${data.title}" class="apod-image" />`;
        downloadLink = `<a href="${data.hdurl || data.url}" download class="download-btn">Download Image</a>`;
      } else if (data.media_type === 'video') {
        media = `<iframe src="${data.url}" frameborder="0" allowfullscreen></iframe>`;
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

// === CAROUSEL LOAD ===
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
          <h4 class="card-title">${data.title}</h4>
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
