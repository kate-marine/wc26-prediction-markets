const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("console", (msg) => console.log("CONSOLE:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("PAGEERROR:", err.message));
  await page.goto("http://localhost:4321/explore?team=argentina", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const html = await page.locator(".match-detail").innerHTML().catch(e => "NO MATCH-DETAIL: " + e.message);
  console.log("MATCH-DETAIL HTML LENGTH:", html.length);
  console.log(html.slice(0, 500));
  await browser.close();
})();
