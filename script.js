const form = document.getElementById('apod-form');
const resultDiv = document.getElementById('apod-result');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const date = document.getElementById('date').value;
  const apiKey = sessionStorage.getItem('apiKey') || prompt('Enter your NASA API Key:');
  sessionStorage.setItem('apiKey', apiKey);

  resultDiv.style.display = 'block';
  resultDiv.innerHTML = '<p>Loading...</p>';

  try {
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${date}`);
    const data = await res.json();

    if (data.media_type === 'image') {
      resultDiv.innerHTML = `
        <h2>${data.title}</h2>
        <img src="${data.url}" alt="${data.title}">
        <p>${data.explanation}</p>
      `;
    } else if (data.media_type === 'video') {
      resultDiv.innerHTML = `
        <h2>${data.title}</h2>
        <iframe src="${data.url}" frameborder="0" allowfullscreen></iframe>
        <p>${data.explanation}</p>
      `;
    } else {
      resultDiv.innerHTML = `<p>This media type is not supported.</p>`;
    }
  } catch (err) {
    resultDiv.innerHTML = `<p>There was a problem fetching the data. Please check your date or API key.</p>`;
    console.error(err);
  }
});
