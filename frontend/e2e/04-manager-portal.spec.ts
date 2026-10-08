import { test, expect } from '@playwright/test';
import { injectAuthState, mockApiRoutes } from './helpers/auth';

test.describe('04. Manager Portal Operations', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await injectAuthState(page, 'MANAGER');
  });

  test('should load manager portal with tabs and switch between operational views', async ({ page }) => {
    await page.goto('/manager');

    // Verify Manager Header Banner
    await expect(page.getByText('Trang Vận Hành Quản Lý (Manager Portal)')).toBeVisible();

    // Default view: Orders Manager
    await expect(page.getByRole('heading', { name: /Quản Lý Đơn Hàng Công Trình/i })).toBeVisible();

    // Switch to Warehouse tab
    await page.click('button:has-text("🛠️ Kho Vật Tư")');
    await expect(page.getByRole('heading', { name: /Quản Lý Danh Mục Vật Tư M&E/i })).toBeVisible();

    // Switch to Customers tab
    await page.click('button:has-text("👥 Khách Bán Lẻ")');
    await expect(page.locator('main')).toBeVisible();

    // Switch to Statistics tab
    await page.click('button:has-text("📊 Thống Kê")');
    await expect(page.getByRole('heading', { name: /Tổng Quan Kinh Doanh TDT M&E/i })).toBeVisible();
  });

  test('should inspect order details, assign shipper, and update order status', async ({ page }) => {
    await page.goto('/manager');

    // Switch back to Orders tab
    await page.click('button:has-text("📦 Quản Lý Đơn Hàng")');

    // Click "Chi tiết" on the first order in the table
    const detailButton = page.locator('button:has-text("Chi tiết")').first();
    await expect(detailButton).toBeVisible();
    await detailButton.click();

    // Verify Order Detail Modal is visible
    await expect(page.getByText('Địa điểm giao vật tư 2H:')).toBeVisible();
    await expect(page.getByText('Chi tiết danh mục vật tư trong đơn')).toBeVisible();

    // Assign Shipper via dropdown
    const shipperSelect = page.locator('select:has-text("Chọn Shipper")');
    await expect(shipperSelect).toBeVisible();
    await shipperSelect.selectOption('u-ship-001');

    // Verify assigned confirmation tag
    await expect(page.getByText('✓ Đã gán: Tài Xế Hoàng Nam')).toBeVisible();

    // Update status to "Đang chuẩn bị" inside modal
    const preparingButton = page.locator('.fixed.inset-0 button:has-text("Đang chuẩn bị")');
    await preparingButton.click();

    // Toast alert should notify status update
    await expect(page.locator('text=Đã cập nhật trạng thái đơn').first()).toBeVisible();
  });
});
