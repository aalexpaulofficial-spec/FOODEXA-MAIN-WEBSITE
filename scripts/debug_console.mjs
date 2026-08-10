import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER PAGE_ERROR:', err.toString()));
  page.on('requestfailed', req => {
    console.log('BROWSER REQUEST_FAILED:', req.url(), req.failure()?.errorText);
  });

  console.log('Navigating to http://127.0.0.1:2000');
  await page.goto('http://127.0.0.1:2000', { waitUntil: 'networkidle2' });
  
  // Wait a little bit for the portal to load or throw error
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
})();
