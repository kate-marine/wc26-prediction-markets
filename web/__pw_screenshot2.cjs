const { chromium } = require("playwright");
const OUT = "/private/tmp/claude-501/-Users-katemarine-Documents-wc26-prediction-markets/9f4a2fe2-c9a5-48c1-b15f-35a36d57bf53/scratchpad";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto("http://localhost:4321/explore?team=argentina", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/explore_team2.png` });

  const chart = page.locator(".match-chart").first();
  const box = await chart.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/explore_team_hover.png` });

    // find a circle to hover
    const circle = page.locator(".match-chart circle").nth(3);
    if (await circle.count()) {
      const cbox = await circle.boundingBox();
      if (cbox) {
        await page.mouse.move(cbox.x + cbox.width / 2, cbox.y + cbox.height / 2);
        await page.waitForTimeout(200);
        await page.screenshot({ path: `${OUT}/explore_team_dot_hover.png` });
      }
    }
  }

  await page.goto("http://localhost:4321/explore?match=" + (await (async () => {
    const res = await page.evaluate(() => fetch("/data/manifest.json").then(r => r.json()));
    return res[0].id;
  })()), { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const mchart = page.locator(".match-chart").first();
  const mbox = await mchart.boundingBox();
  if (mbox) {
    await page.mouse.move(mbox.x + mbox.width * 0.5, mbox.y + mbox.height * 0.3);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/explore_match_hover2.png` });
  }

  await browser.close();
  console.log("done2");
})();
