document.getElementById('apod-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const date = document.getElementById('date').value;
    const apiKey = sessionStorage.getItem('apiKey') || prompt('Enter your NASA API Key:');
    sessionStorage.setItem('apiKey', apiKey);
  
    try {
      const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${date}`);
      const data = await response.json();
  
      if (data.media_type === 'image') {
        document.getElementById('apod-result').innerHTML = `
          <h2>${data.title}</h2>
          <img src="${data.url}" alt="${data.title}" />
          <p>${data.explanation}</p>
        `;
      } else if (data.media_type === 'video') {
        document.getElementById('apod-result').innerHTML = `
          <h2>${data.title}</h2>
          <iframe src="${data.url}" frameborder="0" allowfullscreen></iframe>
          <p>${data.explanation}</p>
        `;
      } else {
        document.getElementById('apod-result').innerHTML = `<p>Media type not supported.</p>`;
      }
    } catch (error) {
      console.error('Error fetching the APOD:', error);
      document.getElementById('apod-result').innerHTML = `<p>There was an error fetching the data. Please try again later.</p>`;
    }
  });
  