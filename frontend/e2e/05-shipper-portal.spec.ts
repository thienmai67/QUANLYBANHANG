import { test, expect } from '@playwright/test';
import { injectAuthState, mockApiRoutes } from './helpers/auth';

test.describe('05. Shipper Delivery Dispatch Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await injectAuthState(page, 'SHIPPER');
  });

  test('should view shipper dispatch board and filter orders by delivery state', async ({ page }) => {
    await page.goto('/shipper');

    // Verify Shipper banner
    await expect(page.getByText('Bảng Giao Vận Shipper')).toBeVisible();
    await expect(page.getByText('Đang Sẵn Sàng Nhận Đơn')).toBeVisible();

    // Filter: "Chờ lấy hàng" (Preparing)
    await page.click('button:has-text("Chờ lấy hàng")');
    await expect(page.locator('text=Kho Đã Đóng Gói - Chờ Lấy Hàng').first()).toBeVisible();

    // Filter: "Đang vận chuyển" (Shipping2H)
    await page.click('button:has-text("Đang vận chuyển")');
    await expect(page.locator('text=Đang Trên Đường Giao Tới Điểm').first()).toBeVisible();

    // Filter: "Đã hoàn tất" (Completed)
    await page.click('button:has-text("Đã hoàn tất")');
    await expect(page.locator('text=Đã Giao Hàng Thành Công').first()).toBeVisible();
  });

  test('should execute full delivery lifecycle: pickup warehouse and confirm customer handover', async ({ page }) => {
    await page.goto('/shipper');

    // Filter to "Chờ lấy hàng"
    await page.click('button:has-text("Chờ lấy hàng")');

    // Pickup order button: "Lấy Hàng Tại Kho & Bắt Đầu Giao"
    const pickupButton = page.locator('button:has-text("Lấy Hàng Tại Kho & Bắt Đầu Giao")').first();
    await expect(pickupButton).toBeVisible();
    await pickupButton.click();

    // Switch to "Đang vận chuyển" tab where order transitioned
    await page.click('button:has-text("Đang vận chuyển")');
    await expect(page.locator('text=Đang Trên Đường Giao Tới Điểm').first()).toBeVisible();

    // Deliver order button: "Xác Nhận Đã Giao Hàng Cho Khách"
    const deliverButton = page.locator('button:has-text("Xác Nhận Đã Giao Hàng Cho Khách")').first();
    await expect(deliverButton).toBeVisible();
    await deliverButton.click();

    // Switch to "Đã hoàn tất" tab to verify handover slip
    await page.click('button:has-text("Đã hoàn tất")');
    const handoverSlip = page.locator('text=Biên Bản Giao Hàng Hoàn Tất').first();
    await expect(handoverSlip).toBeVisible();
  });
});
