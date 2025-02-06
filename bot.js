const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    userDataDir: './tmp'
  });
  const page = await browser.newPage();
  let found = false;
  let captchaStop = false;
  await page.goto('https://www.amazon.com/s?k=rtx+5090', {
    waitUntil: 'networkidle2'
  });
do {
  const timeToReload = Math.floor(Math.random() * 3500) + 5000;
  page.reload();
  console.log('Reloading');
  await new Promise(res => setTimeout(res, timeToReload));
  await page.waitForSelector('div[data-component-type="s-search-result"]');
  const captchaForm = await page.$('form[action="/errors/validateCaptcha"]');
if (captchaForm) {
  console.log('CAPTCHA triggered. You may need to solve it or slow down requests.');
  found = true;
  captchaForm = true;
}
  const productHandles = await page.$$('div[data-component-type="s-search-result"]');

  for (const product of productHandles) {
    // Get title text (if it exists)
    const titleSel = '.a-size-medium.a-color-base.a-text-normal';
    const titleElement = await product.$(titleSel);
    if (!titleElement) continue;

    const titleText = await product.$eval(titleSel, el => el.textContent.trim());

    // Check for desired GPU
    if (titleText.includes('GeForce RTX 5090') || titleText.includes('GeForce RTX™ 5090')) {
      console.log(`Found product titled: ${titleText}`);

      try {
        // Grab the price text from .a-offscreen (this often has the "full price", e.g. "$3,999.99")
        const priceText = await product.$eval('.a-price .a-offscreen', el => el.textContent.trim());
        // Strip out anything not digits or dots, then parse
        const numericPrice = parseFloat(priceText.replace(/[^\d.]/g, ''));
        console.log(`Price: ${numericPrice}`);

        // Check if it's in the 65-75 range
        if (numericPrice >= 1999 && numericPrice <= 2500) {
          console.log('Price is in desired range. Clicking product...');
          found = true;
          // Use `titleElement` instead of `titleHandle`
          const linkHandle = await titleElement.evaluateHandle(el => el.closest('a'));
          console.log('Link handle:', linkHandle);

          if (linkHandle) {
            await linkHandle.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            // Done after first match—remove if you want to keep checking
            break;
          }
        } else {
          console.log('Price not in range, skipping...');
        }
      } catch (err) {
        console.log('Error extracting price, skipping...', err);
      }
    }
  }
  console.log('Nope.');
} while(!found);
console.log('Found it!');


console.log("Attempting to do it...");
if (!captchaStop) {
await page.waitForSelector('#buy-now-button', { visible: true });
// Click the "Buy Now" button
await page.click('#buy-now-button');
console.log('Buy Now button clicked!');
await page.waitForSelector('#turbo-checkout-pyo-button', { visible: true });
await page.click('#turbo-checkout-pyo-button');
console.log('The deed is done.');
}
  // Keep the browser open for 5s so you can observe; remove or change as needed
  await new Promise(res => setTimeout(res, 5000));
  await browser.close();
})();
//turbo-checkout-pyo-button