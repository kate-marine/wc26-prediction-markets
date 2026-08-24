const { chromium } = require("playwright");
const OUT = "/private/tmp/claude-501/-Users-katemarine-Documents-wc26-prediction-markets/9f4a2fe2-c9a5-48c1-b15f-35a36d57bf53/scratchpad";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto("http://localhost:4321/", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/blue_home_top.png` });

  await page.goto("http://localhost:4321/", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/blue_home_full.png`, fullPage: true });

  await page.goto("http://localhost:4321/explore", { waitUntil: "networkidle" });
  const matchRow = page.locator(".match-table tbody tr").first();
  if (await matchRow.count()) {
    await matchRow.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: `${OUT}/blue_explore_match.png`, fullPage: true });

  const teamTab = page.locator('[role="tab"]', { hasText: /team/i });
  if (await teamTab.count()) {
    await teamTab.first().click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: `${OUT}/blue_explore_team.png`, fullPage: true });

  await browser.close();
  console.log("done");
})();
