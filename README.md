# client-side-freestyle-project
## API Key Setup Instructions

This application uses the [NASA APIs](https://api.nasa.gov/) to fetch data such as the Astronomy Picture of the Day (APOD) and search results from the NASA Image and Video Library.

### How to Get an API Key

1. Visit [https://api.nasa.gov](https://api.nasa.gov).
2. Scroll to the "Generate API Key" section.
3. Fill in your name and email.
4. Click **“Generate API Key”**.
5. You will receive an API key immediately on the page and via email.

### Using Your API Key

When you first load the site, a prompt will ask you to enter your NASA API key. This key is stored in `localStorage` in your browser and reused during your session. It is **not exposed in the source code**, ensuring your credentials remain secure.

If you'd like to reset your key, you can clear your browser’s local storage for the site.

