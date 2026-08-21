import { test, expect } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
});

test("Comprehensive Mobile Verification", async ({ page }) => {
  console.log("Navigating to Home...");
  await page.goto("http://localhost:3000/");
  await page.waitForTimeout(2000);
  await expect(page.getByText("בית").first()).toBeVisible();
  await page.screenshot({ path: "p6_1_home.png" });

  console.log("Navigating to Programs...");
  await page.click("text=תוכניות");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "p6_2_programs.png" });

  console.log("Navigating to Exercises...");
  await page.click("text=תרגילים");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "p6_3_exercises.png" });

  console.log("Navigating to Nutrition...");
  await page.click("text=תזונה");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "p6_4_nutrition.png" });

  console.log("Navigating to History...");
  await page.click("text=היסטוריה");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "p6_5_history.png" });

  console.log("Testing Cloud Sync Auth Modal...");
  await page.click("text=בית");
  await page.waitForTimeout(1000);
  const cloudBtn = page.locator('button[title*="ענן"], button[title*="סנכרון"]').first();
  if (await cloudBtn.isVisible()) {
    await cloudBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "p6_6_auth_modal.png" });
  }
});
