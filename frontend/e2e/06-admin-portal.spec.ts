import { test, expect } from '@playwright/test';
import { injectAuthState, mockApiRoutes } from './helpers/auth';

test.describe('06. Admin Control Center & Operations', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await injectAuthState(page, 'ADMIN');
  });

  test('should view executive KPIs, revenue area chart, and brand share distribution on /admin/dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Title
    await expect(page.getByRole('heading', { name: /Tổng Quan Kinh Doanh TDT M&E/i })).toBeVisible();

    // 4 Key Stat Cards
    await expect(page.getByText('Doanh Thu Vật Tư', { exact: true })).toBeVisible();
    await expect(page.getByText('Đơn Hàng Công Trình', { exact: true })).toBeVisible();
    await expect(page.getByText('Yêu Cầu BOM Chờ Duyệt', { exact: true })).toBeVisible();
    await expect(page.getByText('Nhà Thầu & Đại Lý', { exact: true })).toBeVisible();

    // Chart titles
    await expect(page.getByText('Xu Hướng Doanh Thu Vật Tư M&E')).toBeVisible();
    await expect(page.getByText('Thị Phần Doanh Số Theo Thương Hiệu')).toBeVisible();

    // Switch time range filter
    await page.click('button:has-text("30 ngày")');
    await expect(page.locator('button:has-text("30 ngày")')).toHaveClass(/bg-cyan-600/);
  });

  test('should list products and add a new material item via modal on /admin/products', async ({ page }) => {
    await page.goto('/admin/products');

    // Page title
    await expect(page.getByRole('heading', { name: /Quản Lý Danh Mục Vật Tư M&E/i })).toBeVisible();

    // Open Add Product Modal
    await page.click('button:has-text("Thêm Vật Tư Mới")');

    // Verify modal is open
    await expect(page.getByText('Thêm Vật Tư M&E Mới')).toBeVisible();

    // Fill new product form
    await page.fill('input[placeholder*="CAD-CV-2.5"]', 'TEST-NEW-SKU-99');
    await page.fill('input[placeholder*="Dây Cáp Điện Cadivi"]', 'Cáp Điện Thử Nghiệm TDT 4.0');
    await page.fill('input[type="number"] >> nth=0', '1500000'); // Base price
    await page.fill('input[type="number"] >> nth=1', '25');      // Discount rate
    await page.fill('input[type="number"] >> nth=2', '80');      // Stock

    // Submit form
    await page.click('button[type="submit"]:has-text("Tạo Mới")');

    // Verify toast confirmation
    await expect(page.locator('text=Đã thêm mới vật tư').first()).toBeVisible();
  });

  test('should review orders and trigger Excel spreadsheet export on /admin/orders', async ({ page }) => {
    await page.goto('/admin/orders');

    // Header
    await expect(page.getByRole('heading', { name: /Quản Lý Đơn Hàng Công Trình/i })).toBeVisible();

    // Export Excel
    const exportBtn = page.getByRole('button', { name: /Xuất Excel Đơn Hàng/i });
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    // Verify success toast alert
    await expect(page.locator('text=Đã xuất thành công file Excel Đơn Hàng M&E').first()).toBeVisible();

    // Open detail modal for inspection
    const detailBtn = page.locator('button:has-text("Chi tiết")').first();
    await detailBtn.click();
    await expect(page.getByText('Địa điểm giao vật tư 2H:')).toBeVisible();
  });
});
