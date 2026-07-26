const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    const response = await page.goto('https://foodexa-six.vercel.app/');
    console.log('Status:', response.status());
    
    await new Promise(r => setTimeout(r, 5000)); // wait for client-side render
    
    await browser.close();
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
  }
})();
