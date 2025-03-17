import puppeteer, { SupportedBrowser, Page } from "puppeteer";
import fs from "fs";

const sourceURL = "https://dev-shop-integration.alerabat.com/";
const outFileName = "valid_codes.txt";
const testCodes = [
  "RABAT10",
  "RABAT20",
  "DISCOUNT50",
  "PROMO25",
  "SALE30",
  "BONUS15",
  "SHOP5",
  "EXTRA40",
  "WELCOME2024",
  "VIPDEAL",
] as const;
type DiscountCode = (typeof testCodes)[number];

(async () => {
  try {
    const validCodesChrome = await testDiscountCodesOnBrowser(
      testCodes,
      "chrome",
      sourceURL,
    );

    writeOutCodes(validCodesChrome, outFileName);
  } catch (error: any) {
    console.error("Error during discount code testing:", error);
  }
})();

async function testDiscountCodesOnBrowser(
  codes: readonly DiscountCode[],
  browserName: SupportedBrowser,
  pageURL: typeof sourceURL
) {
  const browser = await puppeteer.launch({ browser: browserName });
  const page = await browser.newPage();
  try {
    await page.goto(pageURL, { waitUntil: "domcontentloaded" });
    return await getValidCodes(page, codes);
  } catch (error: any) {
    throw new Error(
      `Error while testing codes in ${browserName}: ${error.message}`
    );
  } finally {
    await browser.close();
  }
}

async function getValidCodes(page: Page, codes: readonly DiscountCode[]) {
  const validCodes: DiscountCode[] = [];
  for (const code of codes) {
    try {
      const isCodeValid = await checkDiscountCode(page, code);
      if (isCodeValid) {
        validCodes.push(code);
      }
    } catch (error: any) {
      throw new Error(`Error checking code "${code}": ${error.message}`);
    }
  }
  return validCodes;
}

async function checkDiscountCode(page: Page, code: DiscountCode) {
  const inputSelector = '[placeholder="Wpisz kod rabatowy"]';
  try {
    await page.locator(inputSelector).fill("");

    await page.type(inputSelector, code);
    await page
      .locator("button")
      .filter((button) => button.innerText === "Zastosuj")
      .click();

    return await page.evaluate((text) => {
      return document.body.innerText.includes(text);
    }, "Zastosowano kod rabatowy");
  } catch (error: any) {
    throw new Error(
      `Error while applying discount code "${code}": ${error.message}`
    );
  }
}

function writeOutCodes(codes: DiscountCode[], fileName: typeof outFileName) {
  if (codes.length === 0) return;
  fs.writeFileSync(fileName, codes.join("\n"), "utf8");
}
