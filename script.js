document.getElementById('apod-form').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const date = document.getElementById('date').value;
    const apiKey = sessionStorage.getItem('apiKey') || prompt('Enter your NASA API Key:');
    sessionStorage.setItem('apiKey', apiKey);
  
    const resultDiv = document.getElementById('apod-result');
  
    // Show loading message
    resultDiv.innerHTML = `<p>🚀 Fetching your space photo...</p>`;
  
    try {
      const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${date}`);
      const data = await response.json();
  
      if (data.media_type === 'image') {
        resultDiv.innerHTML = `
          <div class="fade-in">
            <h2>${data.title}</h2>
            <img src="${data.url}" alt="${data.title}" />
            <p>${data.explanation}</p>
          </div>
        `;
      } else if (data.media_type === 'video') {
        resultDiv.innerHTML = `
          <div class="fade-in">
            <h2>${data.title}</h2>
            <iframe src="${data.url}" frameborder="0" allowfullscreen></iframe>
            <p>${data.explanation}</p>
          </div>
        `;
      } else {
        resultDiv.innerHTML = `<p class="fade-in">⚠️ Media type not supported for this date.</p>`;
      }
    } catch (error) {
      console.error('Error fetching the APOD:', error);
      resultDiv.innerHTML = `<p class="fade-in">❌ Something went wrong. Please check your API key or try a different date.</p>`;
    }
  });
  
  