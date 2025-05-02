const form = document.getElementById('apod-form');
const resultDiv = document.getElementById('apod-result');
const downloadBtn = document.getElementById('download-btn');
const randomBtn = document.getElementById('random-btn');
const toggleThemeBtn = document.getElementById('toggle-theme');
const dateInput = document.getElementById('date');

// Set today's date and valid range
const today = new Date().toISOString().split('T')[0];
dateInput.value = today;
dateInput.max = today;
dateInput.min = "1995-06-16";

// Load theme from localStorage
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
  toggleThemeBtn.textContent = "Switch to Dark Theme";
} else {
  toggleThemeBtn.textContent = "Switch to Light Theme";
}

// Fetch APOD
async function fetchAPOD(date) {
  const apiKey = localStorage.getItem('apiKey') || prompt('Enter your NASA API Key:');
  localStorage.setItem('apiKey', apiKey);

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
    `;
  } catch (err) {
    resultDiv.innerHTML = `<p>Error: ${err.message}</p>`;
    console.error(err);
  }
}

// Form submission
form.addEventListener('submit', e => {
  e.preventDefault();
  fetchAPOD(dateInput.value);
});

// Random date generator
randomBtn.addEventListener('click', () => {
  const start = new Date(1995, 5, 16).getTime();
  const end = new Date().getTime();
  const random = new Date(start + Math.random() * (end - start));
  const randomDate = random.toISOString().split('T')[0];
  dateInput.value = randomDate;
  fetchAPOD(randomDate);
});

// Theme toggle
toggleThemeBtn.addEventListener('click', () => {
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  toggleThemeBtn.textContent = isLight ? "Switch to Dark Theme" : "Switch to Light Theme";
});
