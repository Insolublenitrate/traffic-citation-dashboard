const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => {
    if (!response.ok()) {
      console.log('NETWORK ERROR:', response.status(), response.url());
    }
  });

  console.log('Navigating to http://localhost:3000...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    console.log('Page loaded!');
    
    // Wait a few seconds to let Mapbox initialize
    await new Promise(r => setTimeout(r, 5000));
  } catch (err) {
    console.error('Failed to load:', err);
  }

  await browser.close();
})();
