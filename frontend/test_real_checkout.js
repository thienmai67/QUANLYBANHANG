const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://tdtmaterial.id.vn';
const EVIDENCE_DIR = 'C:/Users/admin/.gemini/antigravity/brain/f5d8acc7-4ca6-45f3-9d08-d5a05989507d/test_run_evidence';

async function testRealProductCheckout() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('Fetching live products from backend...');
  const res = await page.request.get(`${BASE_URL}/api/v1/products`);
  const products = await res.json();
  const realProduct = products[0];
  console.log('Found product:', realProduct.name, '(Price:', realProduct.basePrice, ')');

  await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
  await page.evaluate((p) => {
    const sampleCart = {
      state: {
        items: [
          {
            id: p.id,
            name: p.name,
            sku: p.sku,
            unitPrice: p.basePrice,
            quantity: 2,
            image: '/images/products/schneider-mcb.jpg'
          }
        ],
        isOpen: false,
        openToCheckout: false
      },
      version: 2
    };
    localStorage.setItem('tdt-cart-storage', JSON.stringify(sampleCart));
  }, realProduct);

  await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('Filling form fields...');
  await page.locator('form input[placeholder*="Nguyễn Văn A"]').fill('Pham Minh Chuyen Khoan');
  await page.locator('form input[placeholder*="0901234567"]').fill('0901234567');
  await page.locator('form input[placeholder*="80/3A"]').fill('456 Hai Ba Trung, Quan 1, TP.HCM');

  await page.locator('form div:has-text("Chuyển khoản VietQR (PayOS)")').last().click();
  await page.waitForTimeout(500);

  console.log('Clicking Submit button...');
  await page.locator('form button[type="submit"]').click();

  console.log('Waiting for VietQR container...');
  const qrImage = page.locator('img[alt*="PayOS VietQR Code"], img[src*="vietqr.io"]');
  await qrImage.waitFor({ state: 'visible', timeout: 10000 });

  await page.waitForTimeout(2000);
  const screenshotPath = path.join(EVIDENCE_DIR, 'LIVE_VIETQR_PAYMENT_SUCCESS.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('SCREENSHOT SAVED TO:', screenshotPath);

  const qrSrc = await qrImage.getAttribute('src');
  console.log('SUCCESS! VietQR Image Source:', qrSrc);

  await browser.close();
}

testRealProductCheckout();
