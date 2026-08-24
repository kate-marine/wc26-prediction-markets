const { chromium } = require("playwright");

const OUT = "/private/tmp/claude-501/-Users-katemarine-Documents-wc26-prediction-markets/9f4a2fe2-c9a5-48c1-b15f-35a36d57bf53/scratchpad";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Homepage — top (question cards)
  await page.goto("http://localhost:4321/", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/home_top.png` });

  // Homepage — scroll to method section
  await page.locator("#method").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/home_method.png` });

  // Homepage — scroll to result/findings section
  await page.locator("#result").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/home_result.png` });

  // Homepage — scroll to takeaway section
  await page.locator("#takeaway").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/home_takeaway.png` });

  // Full page screenshot
  await page.goto("http://localhost:4321/", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/home_full.png`, fullPage: true });

  // Explore page with a match selected
  await page.goto("http://localhost:4321/explore", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/explore_top.png` });

  // click match tab row if needed, select a match via table
  const matchRow = page.locator(".match-table tbody tr").first();
  if (await matchRow.count()) {
    await matchRow.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/explore_match.png` });

    // hover the chart to check crosshair/readout
    const chart = page.locator(".match-chart").first();
    const box = await chart.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.3);
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${OUT}/explore_match_hover.png` });
    }
  }

  // team tab
  const teamTab = page.locator('[role="tab"]', { hasText: /team/i });
  if (await teamTab.count()) {
    await teamTab.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/explore_team.png` });
  }

  await browser.close();
  console.log("done");
})();
