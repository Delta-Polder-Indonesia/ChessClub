import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:5173/papan-interaktif", { waitUntil: "networkidle0" });
  const html = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    return nav ? nav.outerHTML : "NO NAV FOUND";
  });
  console.log(html);
  await browser.close();
})();
