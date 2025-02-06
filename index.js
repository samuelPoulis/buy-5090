const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    userDataDir: './tmp',
    devtools: true
  });

  try {
    const page = await browser.newPage();

    // Set user agent to mimic a real browser
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    // Navigate to the Amazon search results page
    await page.goto('https://www.amazon.com/s?k=rtx+5090', {
      waitUntil: 'domcontentloaded'
    });

    // Your original selectors
    const titleSelector =
      'div.a-section.a-spacing-none.puis-padding-right-small.s-title-instructions-style > a > h2 > span';
    const linkSelector =
      'div.a-section.a-spacing-none.puis-padding-right-small.s-title-instructions-style > a';
    const priceSelector =
      'div.a-section.a-spacing-none.a-spacing-top-micro.puis-price-instructions-style > div > ' +
      'div:nth-child(1) > a > span > span:nth-child(2) > span.a-price-whole';

    // Wait for the title elements
    await page.waitForSelector(titleSelector, { timeout: 60000 });

    // Select all
    const titleElements = await page.$$(titleSelector);
    const linkElements = await page.$$(linkSelector);
    const priceElements = await page.$$(priceSelector);

    const titles = [];
    const links = [];
    const prices = [];

    for (let i = 0; i < titleElements.length; i++) {
      // Title
      const titleText = await page.evaluate(
        el => el.textContent.trim(),
        titleElements[i]
      );
      titles.push(titleText);

      // Link
      const linkHref = await page.evaluate(
        el => el.href,
        linkElements[i]
      );
      links.push(linkHref);

      // Price
      let priceText = 'N/A';
      if (priceElements[i]) {
        let raw = await page.evaluate(
          el => el.textContent.trim(),
          priceElements[i]
        );
        raw = raw.toLowerCase();

        // Handle "See buying options" or "From $", etc.
        if (raw.includes('see buying options')) {
          // This means there's no direct numeric price
          priceText = 'N/A';
        } else {
          // Remove 'from $', commas, currency symbols
          raw = raw.replace(/from\s*\$/i, '');
          raw = raw.replace(/[^0-9.]/g, '');
          priceText = raw || 'N/A';
        }
      }
      prices.push(priceText);
    }

    // Now search by title & price
    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      const priceNum = Number(prices[i]); // can be NaN

      // Example: Check both 4090 and 5090, skip items with N/A or broken price
      if (
        (
          title.includes('RTX 4090') ||
          title.includes('RTX™ 4090') ||
          title.includes('RTX 5090') ||
          title.includes('RTX™ 5090')
        ) &&
        !isNaN(priceNum) &&
        priceNum > 0 &&
        priceNum < 9999  // or whatever range you want
      ) {
        console.log(`Navigating to product: ${title} with price: $${priceNum}`);
        await page.goto(links[i], { waitUntil: 'domcontentloaded' });
        // optional: break;  // if you only want the first
      } else {
        console.log('Searching...');
      }
    }

    console.log('Extracted Titles:', titles);
    console.log('Extracted Links:', links);
    console.log('Extracted Prices:', prices);

    // If your Puppeteer doesn't support page.waitForTimeout():
    await page.waitForTimeout(5000000);

    await browser.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();



