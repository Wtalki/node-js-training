import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import cron from 'node-cron';
import fs from 'fs';

puppeteer.use(StealthPlugin());

const COOKIES_FILE = 'cookies.json';
const POST_URL = 'https://www.facebook.com/photo/?fbid=954625223495252&set=pcb.954625346828573';
const KEYWORDS = ['bonus', 'join', '1000MMK'];
const COMMENT_TEXT = '🔥 Join now and claim your bonus today!';

// 🕐 Run every 1 minute
cron.schedule('* * * * *', async () => {
  console.log(`[${new Date().toISOString()}] 🚀 Checking post...`);

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  });

  const page = await browser.newPage();

  try {
    // ✅ Step 1: Load cookies (if available)
    if (fs.existsSync(COOKIES_FILE)) {
      const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE));
      await page.setCookie(...cookies);
      console.log('✅ Loaded saved cookies');
    }

    // ✅ Step 2: Go to Facebook
    await page.goto('https://facebook.com', { waitUntil: 'networkidle2' });

    // ✅ Step 3: If not logged in, manually log in and save cookies
    const isLoggedIn = await page.evaluate(() => {
      return !!document.querySelector('[aria-label="Your profile"]') ||
             !!document.querySelector('a[href*="logout"]') ||
             !!document.body.innerText.toLowerCase().includes("what's on your mind");
    });

    if (!isLoggedIn) {
      console.log('⚠️ Not logged in. Please log in manually.');
      console.log('⏳ Waiting 60 seconds for manual login...');

      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));

      const postLogin = await page.evaluate(() => {
        return !!document.querySelector('[aria-label="Your profile"]');
      });

      if (postLogin) {
        const cookies = await page.cookies();
        fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
        console.log('✅ Login success — cookies saved!');
      } else {
        console.log('❌ Manual login failed. Try again.');
        await page.screenshot({ path: 'login-failed.png' });
        await browser.close();
        return;
      }
    } else {
      console.log('✅ Already logged in via cookies.');
    }

    // ✅ Step 4: Go to target post
    await page.goto(POST_URL, { waitUntil: 'networkidle2' });

    // ✅ Step 5: Scroll down to load comments
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ✅ Step 6: Grab comments and look for keywords
    const comments = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-ad-preview="message"]'))
        .map(el => el.innerText);
    });

    const matched = comments.find(c =>
      KEYWORDS.some(k => c.toLowerCase().includes(k.toLowerCase()))
    );

    if (matched) {
      console.log(`✅ Keyword matched: "${matched}"`);

      const commentBox = await page.$('div[aria-label^="Write a comment"]');
      if (commentBox) {
        await commentBox.click();
        await page.keyboard.type(COMMENT_TEXT, { delay: 50 });
        await page.keyboard.press('Enter');
        console.log('💬 Auto comment sent!');
      } else {
        console.warn('❌ Comment box not found.');
      }
    } else {
      console.log('❌ No keyword match found.');
    }

  } catch (e) {
    console.error('❗ Error:', e.message);
    await page.screenshot({ path: 'error.png' });
  } finally {
    await browser.close();
  }
});
