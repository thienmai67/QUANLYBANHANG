const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://tdtmaterial.id.vn';
const EVIDENCE_DIR = 'C:/Users/admin/.gemini/antigravity/brain/f5d8acc7-4ca6-45f3-9d08-d5a05989507d/test_run_evidence';

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runLiveUITests() {
  console.log('====================================================');
  console.log('   STARTING PLAYWRIGHT LIVE UI EXPLORATORY TEST     ');
  console.log('   TARGET: ' + BASE_URL);
  console.log('====================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const testResults = [];

  function record(name, pass, detail = '') {
    const status = pass ? '[OK]' : '[FAIL]';
    console.log(`${status} ${name}: ${detail}`);
    testResults.push({ name, pass, detail });
  }

  try {
    // ----------------------------------------------------
    // TEST 1: HOME PAGE
    // ----------------------------------------------------
    console.log('--- TEST 1: HOME PAGE ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const title = await page.title();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '01_home_page.png') });
    record('Home Page Load', title.length > 0, `Title: "${title}"`);

    // ----------------------------------------------------
    // TEST 2: CART PREPARATION WITH LIVE PRODUCT
    // ----------------------------------------------------
    console.log('\n--- TEST 2: CART PREPARATION WITH LIVE PRODUCT ---');
    const prodRes = await page.request.get(`${BASE_URL}/api/v1/products`);
    const prods = await prodRes.json();
    const liveProd = prods[0];

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
              image: p.image || '/images/products/schneider-mcb.jpg'
            }
          ],
          isOpen: false,
          openToCheckout: false
        },
        version: 2
      };
      localStorage.setItem('tdt-cart-storage', JSON.stringify(sampleCart));
    }, liveProd);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '02_cart_ready.png') });
    record('Cart Seed & Setup', true, `Cart loaded with: "${liveProd.name}"`);

    // ----------------------------------------------------
    // TEST 3: CHECKOUT FORM & VIETQR PAYMENT GENERATION
    // (The exact flow the user reported being stuck on)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: CHECKOUT FORM & VIETQR GENERATION ---');
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Target inputs inside form explicitly to avoid top search header
    const nameInput = page.locator('form input[placeholder*="Nguyễn Văn A"]');
    await nameInput.fill('Tran Van Chuyen Khoan Test');

    const phoneInput = page.locator('form input[placeholder*="0901234567"]');
    await phoneInput.fill('0901234567');

    const addressInput = page.locator('form input[placeholder*="80/3A"], form input[placeholder*="số nhà"]');
    await addressInput.fill('120 Nguyen Thi Minh Khai, Phuong Ben Nghe, Quan 1');

    // Click "Chuyển khoản VietQR (PayOS)"
    const vietQrOption = page.locator('form div:has-text("Chuyển khoản VietQR (PayOS)")').last();
    await vietQrOption.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '03_checkout_form_ready.png') });
    record('Checkout Form Inputs Filled', true, 'Name, Phone, Address & VietQR radio selected');

    // Click Submit Button: "Xác Nhận & Lấy Mã QR Thanh Toán"
    const submitBtn = page.locator('form button[type="submit"]');
    console.log('Clicking "Xác Nhận & Lấy Mã QR Thanh Toán"...');
    await submitBtn.click();

    // Wait for the VietQR section to appear
    console.log('Waiting for VietQR container to render on screen...');
    const qrContainer = page.locator('img[alt*="VietQR"], img[src*="vietqr.io"], div:has-text("Quét mã VietQR")');
    await qrContainer.first().waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '04_vietqr_rendered_live.png') });

    const qrImg = page.locator('img[alt*="VietQR"], img[src*="vietqr.io"]').first();
    const isQrVisible = await qrImg.isVisible();
    const qrSrc = isQrVisible ? await qrImg.getAttribute('src') : '';
    record('VietQR Code Rendered on Screen', isQrVisible, `QR Source: ${qrSrc ? qrSrc.slice(0, 65) + '...' : 'none'}`);

    // Verify countdown timer and Bank details
    const pageText = await page.textContent('body');
    const hasBankInfo = pageText.includes('Thanh Toán Đơn Hàng') && pageText.includes('VND');
    record('VietQR Payment Metadata Visible', hasBankInfo, 'Order title, amount VND and payment card displayed');

    // ----------------------------------------------------
    // TEST 4: PUBLIC ORDER LOOKUP (/tra-cuu-don-hang)
    // ----------------------------------------------------
    console.log('\n--- TEST 4: PUBLIC ORDER LOOKUP ---');
    await page.goto(`${BASE_URL}/tra-cuu-don-hang`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const lookupPhoneInput = page.locator('input[placeholder*="Ví dụ: 0901234567"]');
    await lookupPhoneInput.fill('0901234567');

    const lookupBtn = page.locator('button:has-text("Tra Cứu Ngay")');
    await lookupBtn.click();
    await page.waitForTimeout(2500);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '05_public_lookup_result.png') });
    const lookupBody = await page.textContent('body');
    const hasOrderResult = lookupBody.includes('ORD-') || lookupBody.includes('Đơn hàng') || lookupBody.includes('Tổng tiền');
    record('Public Order Lookup by Phone', hasOrderResult, 'Found orders associated with 0901234567');

    // ----------------------------------------------------
    // TEST 5: LOGIN MANAGER PORTAL
    // ----------------------------------------------------
    console.log('\n--- TEST 5: LOGIN MANAGER PORTAL ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.locator('#login-email').fill('admin@gmail.com');
    await page.locator('#login-password').fill('admin123');
    await page.locator('button[type="submit"]:has-text("Đăng nhập")').click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '06_manager_authenticated.png') });
    const managerUrl = page.url();
    const managerBody = await page.textContent('body');
    const isManagerAuth = managerUrl.includes('/admin') || managerBody.includes('Quản lý') || managerBody.includes('Đơn Hàng') || managerBody.includes('Tài khoản');
    record('Manager Login Flow', isManagerAuth, `Current URL: ${managerUrl}`);

    // ----------------------------------------------------
    // TEST 6: LOGIN SHIPPER VIA PHONE
    // ----------------------------------------------------
    console.log('\n--- TEST 6: LOGIN SHIPPER VIA PHONE NUMBER ---');
    // Clear storage to log out
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.locator('#login-email').fill('0901234567');
    await page.locator('#login-password').fill('Shipper@123');
    await page.locator('button[type="submit"]:has-text("Đăng nhập")').click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '07_shipper_authenticated.png') });
    const shipperUrl = page.url();
    const shipperBody = await page.textContent('body');
    const isShipperAuth = shipperUrl.includes('/shipper') || shipperBody.includes('Giao Hàng') || shipperBody.includes('Đơn Hàng Cần Giao');
    record('Shipper Login via Phone (0901234567)', isShipperAuth, `Current URL: ${shipperUrl}`);

  } catch (err) {
    console.error('Test Execution Error:', err);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'error_screenshot.png') });
    record('Test Suite Execution', false, err.message);
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  const passed = testResults.filter(r => r.pass).length;
  console.log(`   TEST SUMMARY: ${passed}/${testResults.length} PASSED`);
  console.log('====================================================');
}

runLiveUITests();
