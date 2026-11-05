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
    await injectAuthState(page, 'CUSTOMER');
    await page.goto('/shop');

    // Click "Thêm Vào Giỏ" on the first product card
    const addToCartButton = page.locator('button:has-text("Thêm Vào Giỏ")').first();
    await addToCartButton.click();

    // Verify CartDrawer automatically slides open
    const drawerHeader = page.getByRole('heading', { name: /Giỏ Hàng Mua Lẻ/i });
    await expect(drawerHeader).toBeVisible();

    // Click "Xem giỏ hàng" to go to /cart
    const viewCartBtn = page.getByRole('button', { name: /Xem giỏ hàng/i });
    await viewCartBtn.click();
    await expect(page).toHaveURL(/\/cart/);

    // On /cart page, verify table and advance to /checkout
    await expect(page.getByRole('heading', { name: /Giỏ Hàng Mua Lẻ/i })).toBeVisible();
    const proceedCheckoutBtn = page.getByRole('button', { name: /Tiến hành đặt hàng/i }).first();
    await proceedCheckoutBtn.click();
    await expect(page).toHaveURL(/\/checkout/);

    // Fill delivery information
    await page.fill('input[placeholder="Nguyễn Văn A"]', 'Nguyễn Văn An');
    await page.fill('input[placeholder="0901234567"]', '0908123456');
    await page.fill('input[placeholder*="Số nhà, Tên đường"]', '123 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM');

    // Select COD payment method
    const codRadio = page.locator('input[type="radio"]').nth(1);
    await codRadio.click();

    // Submit checkout
    const confirmButton = page.getByRole('button', { name: /Xác Nhận Đặt Hàng \(COD\)/i });
    await confirmButton.click();

    // Verify order placement success screen
    await expect(page).toHaveURL(/\/order-success/);
    const successHeading = page.getByRole('heading', { name: /Đặt Hàng Thành Công!/i });
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
