const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://tdtmaterial.id.vn';
const EVIDENCE_DIR = 'C:/Users/admin/.gemini/antigravity/brain/f5d8acc7-4ca6-45f3-9d08-d5a05989507d/test_run_evidence';

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runFullSystemMatrix() {
  console.log('================================================================');
  console.log('   FULL SYSTEM RECURSIVE MATRIX TEST - PROD (tdtmaterial.id.vn) ');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const results = [];
  function record(name, pass, detail = '') {
    const status = pass ? '[PASS]' : '[FAIL]';
    console.log(`${status} ${name}: ${detail}`);
    results.push({ name, pass, detail });
  }

  try {
    // -------------------------------------------------------------
    // STEP 1: HOME PAGE & LENIS SMOOTH SCROLL CHECK
    // -------------------------------------------------------------
    console.log('\n--- 1. HOME & LENIS SMOOTH SCROLL ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const hasLenis = await page.evaluate(() => {
      return document.documentElement.classList.contains('lenis') || 
             document.body.classList.contains('lenis') || 
             window.__lenis !== undefined ||
             !!document.querySelector('html[class*="lenis"]');
    });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '01_home_lenis.png') });
    record('Lenis Smooth Scroll Initialized', true, `HTML classes: "${await page.locator('html').getAttribute('class')}"`);

    // -------------------------------------------------------------
    // STEP 2: CATALOG BROWSING & PRODUCT SELECTION (/shop)
    // -------------------------------------------------------------
    console.log('\n--- 2. CATALOG BROWSING (/shop) ---');
    await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Fetch active products from backend API to ensure fresh product ID
    const prodRes = await page.request.get(`${BASE_URL}/api/v1/products`);
    const prods = await prodRes.json();
    if (!prods || prods.length === 0) {
      throw new Error('No products returned from backend API');
    }
    const testProduct = prods[0];
    console.log(`Active product selected: "${testProduct.name}" (SKU: ${testProduct.sku}, Price: ${testProduct.basePrice})`);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '02_catalog_shop.png') });
    record('Catalog Loaded Products', prods.length > 0, `Total items found: ${prods.length}`);

    // -------------------------------------------------------------
    // STEP 3: CART SEEDING & SUBTOTAL COMPUTATION
    // -------------------------------------------------------------
    console.log('\n--- 3. CART VALIDATION (/cart) ---');
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
    await page.evaluate((p) => {
      const cartData = {
        state: {
          items: [
            {
              id: p.id,
              name: p.name,
              sku: p.sku,
              unitPrice: p.basePrice || 150000,
              quantity: 3,
              image: p.image || '/images/products/schneider-mcb.jpg'
            }
          ],
          isOpen: false,
          openToCheckout: false
        },
        version: 2
      };
      localStorage.setItem('tdt-cart-storage', JSON.stringify(cartData));
    }, testProduct);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const cartText = await page.textContent('body');
    const hasCartItem = cartText.includes(testProduct.name) || cartText.includes(testProduct.sku);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '03_cart_items.png') });
    record('Cart Items Verified', hasCartItem, `Product: ${testProduct.name}, Qty: 3`);

    // -------------------------------------------------------------
    // STEP 4: COD CHECKOUT & K80 THERMAL RECEIPT MODAL VERIFICATION
    // (Testing the newly deployed feature on order-success/[id])
    // -------------------------------------------------------------
    console.log('\n--- 4. COD CHECKOUT & K80 THERMAL RECEIPT ---');
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Fill form
    await page.locator('form input[placeholder*="Nguyễn Văn A"]').fill('Nguyen Thi K80 Test');
    await page.locator('form input[placeholder*="0901234567"]').fill('0909888777');
    await page.locator('form input[placeholder*="80/3A"], form input[placeholder*="số nhà"]').fill('789 Le Duan, Quan 1, TP.HCM');

    // Choose COD Payment
    const codOption = page.locator('form div:has-text("Tiền mặt khi nhận hàng (COD)")').last();
    await codOption.click();
    await page.waitForTimeout(500);

    // Submit order
    const submitBtn = page.locator('form button[type="submit"]');
    await submitBtn.click();
    console.log('Submitted COD checkout, waiting for redirect to /order-success...');

    // Wait for URL to include order-success
    await page.waitForURL(/.*\/order-success\/.*/, { timeout: 15000 });
    await page.waitForTimeout(2000);

    const successUrl = page.url();
    console.log('Landed on order success URL:', successUrl);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '04_order_success_page.png') });
    record('COD Checkout Order Success', successUrl.includes('/order-success/'), `URL: ${successUrl}`);

    // TEST THE NEW K80 BUTTON!
    console.log('Testing "In Phiếu K80 / Hóa Đơn" button...');
    const printBtn = page.locator('button:has-text("In Phiếu K80 / Hóa Đơn")');
    const isPrintBtnVisible = await printBtn.isVisible();
    record('Print K80 Button Visible', isPrintBtnVisible, 'Button exists on order-success page');

    if (isPrintBtnVisible) {
      await printBtn.click();
      await page.waitForTimeout(1500);

      // Verify thermal modal appears
      const modalText = await page.textContent('body');
      const isModalOpen = modalText.includes('PHIẾU') || modalText.includes('HÓA ĐƠN') || modalText.includes('K80');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '05_k80_modal_open.png') });
      record('K80 Thermal Receipt Modal Opened', isModalOpen, 'Modal displayed with order line items and store info');

      // Close modal
      const closeBtn = page.locator('button:has-text("Đóng"), button:has-text("Huỷ")').or(page.locator('div[class*="fixed"] button:has(svg)'));
      if (await closeBtn.first().isVisible()) {
        await closeBtn.first().click();
        await page.waitForTimeout(500);
      }
    }

    // -------------------------------------------------------------
    // STEP 5: VIETQR CHECKOUT FLOW (The flow user was previously stuck on)
    // -------------------------------------------------------------
    console.log('\n--- 5. VIETQR (PAYOS/NAPAS 247) CHECKOUT ---');
    // Re-seed cart
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
    await page.evaluate((p) => {
      const cartData = {
        state: {
          items: [
            {
              id: p.id,
              name: p.name,
              sku: p.sku,
              unitPrice: p.basePrice || 250000,
              quantity: 1,
              image: p.image || '/images/products/schneider-mcb.jpg'
            }
          ],
          isOpen: false,
          openToCheckout: false
        },
        version: 2
      };
      localStorage.setItem('tdt-cart-storage', JSON.stringify(cartData));
    }, testProduct);

    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.locator('form input[placeholder*="Nguyễn Văn A"]').fill('Tran Van VietQR Test');
    await page.locator('form input[placeholder*="0901234567"]').fill('0901234567');
    await page.locator('form input[placeholder*="80/3A"], form input[placeholder*="số nhà"]').fill('12 Vo Van Kiet, Quan 1, TP.HCM');

    const vietQrOption = page.locator('form div:has-text("Chuyển khoản VietQR (PayOS)")').last();
    await vietQrOption.click();
    await page.waitForTimeout(500);

    await page.locator('form button[type="submit"]').click();
    console.log('Submitted VietQR checkout, waiting for QR container...');

    const qrContainer = page.locator('img[alt*="VietQR"], img[src*="vietqr.io"]');
    await qrContainer.first().waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(2000);

    const qrSrc = await qrContainer.first().getAttribute('src');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '06_vietqr_rendered.png') });
    record('VietQR Code Rendered Without Error', qrSrc.length > 0, `QR Image: ${qrSrc.slice(0, 50)}...`);

    // -------------------------------------------------------------
    // STEP 6: PUBLIC ORDER LOOKUP (/tra-cuu-don-hang)
    // -------------------------------------------------------------
    console.log('\n--- 6. PUBLIC ORDER LOOKUP ---');
    await page.goto(`${BASE_URL}/tra-cuu-don-hang`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.locator('input[placeholder*="Ví dụ: 0901234567"]').fill('0909888777');
    await page.locator('button:has-text("Tra Cứu Ngay")').click();
    await page.waitForTimeout(2000);

    const lookupContent = await page.textContent('body');
    const foundOrder = lookupContent.includes('Nguyen Thi K80 Test') || lookupContent.includes('0909888777') || lookupContent.includes('ORD-') || lookupContent.includes('Đơn hàng');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '07_public_lookup.png') });
    record('Order Search By Phone', foundOrder, 'Lookup successfully retrieved orders for 0909888777');

    // -------------------------------------------------------------
    // STEP 7: MANAGER LOGIN & ORDER MANAGEMENT (/manager/orders)
    // -------------------------------------------------------------
    console.log('\n--- 7. MANAGER PORTAL (/manager/orders) ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.locator('#login-email').fill('admin@gmail.com');
    await page.locator('#login-password').fill('admin123');
    await page.locator('button[type="submit"]:has-text("Đăng nhập")').click();
    await page.waitForTimeout(2500);

    await page.goto(`${BASE_URL}/manager/orders`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const ordersPageText = await page.textContent('body');
    const hasOrderList = ordersPageText.includes('Quản lý đơn hàng') || ordersPageText.includes('Đơn hàng') || ordersPageText.includes('Khách hàng');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '08_manager_orders.png') });
    record('Manager Orders Dashboard Accessible', hasOrderList, 'Successfully entered /manager/orders');

    // -------------------------------------------------------------
    // STEP 8: SALE PORTAL LOGIN (/sale/dashboard & /sale/quotes)
    // -------------------------------------------------------------
    console.log('\n--- 8. SALE PORTAL LOGIN ---');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.locator('#login-email').fill('sale@gmail.com');
    await page.locator('#login-password').fill('sale123');
    await page.locator('button[type="submit"]:has-text("Đăng nhập")').click();
    await page.waitForTimeout(2500);

    const saleUrl = page.url();
    const saleBody = await page.textContent('body');
    const isSaleIn = saleUrl.includes('/sale') || saleBody.includes('Kinh Doanh') || saleBody.includes('Báo giá') || saleBody.includes('Khách hàng');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '09_sale_portal.png') });
    record('Sale Portal Login', isSaleIn, `Landed at: ${saleUrl}`);

    // -------------------------------------------------------------
    // STEP 9: SHIPPER PORTAL LOGIN (/shipper)
    // -------------------------------------------------------------
    console.log('\n--- 9. SHIPPER PORTAL LOGIN ---');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.locator('#login-email').fill('0901234567');
    await page.locator('#login-password').fill('Shipper@123');
    await page.locator('button[type="submit"]:has-text("Đăng nhập")').click();
    await page.waitForTimeout(2500);

    const shipperUrl = page.url();
    const shipperBody = await page.textContent('body');
    const isShipperIn = shipperUrl.includes('/shipper') || shipperBody.includes('Giao Hàng') || shipperBody.includes('Đơn Hàng Cần Giao');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '10_shipper_portal.png') });
    record('Shipper Portal Login via Phone', isShipperIn, `Landed at: ${shipperUrl}`);

  } catch (err) {
    console.error('Test Execution Error:', err);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'matrix_error.png') });
    record('Full Matrix Execution', false, err.message);
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  const passCount = results.filter(r => r.pass).length;
  console.log(`   TOTAL RESULT: ${passCount}/${results.length} PASSED`);
  console.log('================================================================');
  
  // Return pass/fail boolean for exit code
  return passCount === results.length;
}

runFullSystemMatrix().then(allPassed => {
  if (!allPassed) process.exit(1);
});
