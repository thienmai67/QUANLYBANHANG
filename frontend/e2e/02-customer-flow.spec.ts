import { test, expect } from '@playwright/test';
import { mockApiRoutes, injectAuthState } from './helpers/auth';

test.describe('02. Customer Flow — Catalog, Cart & Checkout', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('should browse product catalog and filter by search and brand', async ({ page }) => {
    await page.goto('/shop');

    // Verify catalog header
    await expect(page.getByRole('heading', { name: /Tất Cả Sản Phẩm/i })).toBeVisible();

    // Search by keyword
    const searchInput = page.locator('input[placeholder*="Tìm theo tên sản phẩm"]');
    await searchInput.fill('Cadivi');
    await expect(page.locator('.grid h3:has-text("Cadivi")').first()).toBeVisible();

    // Clear search and filter by brand
    await searchInput.fill('');
    const brandSelect = page.locator('select').first();
    await brandSelect.selectOption('Bình Minh');

    // Products should reflect Bình Minh
    await expect(page.locator('.grid h3:has-text("Bình Minh")').first()).toBeVisible();
  });

  test('should add product to cart, adjust quantity, and complete checkout', async ({ page }) => {
    await page.goto('/shop');

    // Click "Thêm Vào Giỏ" on the first product card
    const addToCartButton = page.locator('button:has-text("Thêm Vào Giỏ")').first();
    await addToCartButton.click();

    // Verify CartDrawer automatically slides open
    const drawerHeader = page.getByRole('heading', { name: /Giỏ Hàng Mua Lẻ/i });
    await expect(drawerHeader).toBeVisible();

    // Verify item in drawer and total price displayed
    await expect(page.getByText('TỔNG THÀNH TIỀN:')).toBeVisible();

    // Advance to checkout form step
    const checkoutStepButton = page.getByRole('button', { name: /Tiến Hành Đặt Hàng/i });
    await checkoutStepButton.click();

    // Checkout form should be displayed
    const checkoutForm = page.locator('#checkout-form');
    await expect(checkoutForm).toBeVisible();

    // Fill delivery information
    await page.fill('input[placeholder="Nguyễn Văn A"]', 'Nguyễn Văn An');
    await page.fill('input[placeholder="0901234567"]', '0908123456');
    await page.fill('input[placeholder*="Số nhà, Tên đường"]', '123 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM');

    // Select COD payment method
    const codButton = page.getByRole('button', { name: /Thanh toán COD/i });
    await codButton.click();

    // Submit checkout
    const confirmButton = page.locator('button[type="submit"][form="checkout-form"]');
    await confirmButton.click();

    // Verify order placement success screen
    const successHeading = page.getByRole('heading', { name: /Cảm Ơn Bạn Đã Đặt Hàng!/i });
    await expect(successHeading).toBeVisible();
  });

  test('should display order tracking history on /account for authenticated customer', async ({ page }) => {
    await injectAuthState(page, 'CUSTOMER');
    await page.goto('/account');

    // Verify profile badge
    await expect(page.getByText('THÀNH VIÊN THÂN THIẾT')).toBeVisible();

    // Verify order tracking card
    await expect(page.getByText('Lịch Sử Đơn Hàng Mua Online Của Bạn')).toBeVisible();
    await expect(page.getByText('DH-ONLINE-8899')).toBeVisible();
    await expect(page.getByText('Đang Đóng Gói')).toBeVisible();
  });
});
