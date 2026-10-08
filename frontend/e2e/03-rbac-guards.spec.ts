import { test, expect } from '@playwright/test';
import { injectAuthState, mockApiRoutes } from './helpers/auth';

test.describe('03. Role-Based Access Control (RBAC) & RouteGuard Enforcement', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('should redirect unauthenticated users accessing /admin/dashboard to /login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login\?reason=unauthenticated/);
  });

  test('should redirect unauthenticated users accessing /manager to /login', async ({ page }) => {
    await page.goto('/manager');
    await expect(page).toHaveURL(/\/login\?reason=unauthenticated/);
  });

  test('should redirect unauthenticated users accessing /shipper to /login', async ({ page }) => {
    await page.goto('/shipper');
    await expect(page).toHaveURL(/\/login\?reason=unauthenticated/);
  });

  test('should block CUSTOMER from accessing /admin dashboard (403 unauthorized)', async ({ page }) => {
    await injectAuthState(page, 'CUSTOMER');
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/auth\/error\?reason=unauthorized/);
  });

  test('should block CUSTOMER from accessing /manager portal (403 unauthorized)', async ({ page }) => {
    await injectAuthState(page, 'CUSTOMER');
    await page.goto('/manager');
    await expect(page).toHaveURL(/\/auth\/error\?reason=unauthorized/);
  });

  test('should block SHIPPER from accessing /admin dashboard', async ({ page }) => {
    await injectAuthState(page, 'SHIPPER');
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/auth\/error\?reason=unauthorized/);
  });

  test('should allow MANAGER access to /manager but block from /admin/dashboard', async ({ page }) => {
    await injectAuthState(page, 'MANAGER');

    // Manager allowed in /manager
    await page.goto('/manager');
    await expect(page).toHaveURL(/\/manager/);
    await expect(page.getByText('Manager Portal')).toBeVisible();

    // Manager blocked from /admin/dashboard
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/auth\/error\?reason=unauthorized/);
  });

  test('should grant ADMIN universal access across /admin, /manager, and /shipper portals', async ({ page }) => {
    await injectAuthState(page, 'ADMIN');

    // Admin in /admin/dashboard
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.getByText('Tổng Quan Kinh Doanh TDT M&E')).toBeVisible();

    // Admin bypass into /manager
    await page.goto('/manager');
    await expect(page).toHaveURL(/\/manager/);
    await expect(page.getByText('Manager Portal')).toBeVisible();

    // Admin bypass into /shipper
    await page.goto('/shipper');
    await expect(page).toHaveURL(/\/shipper/);
    await expect(page.getByText('Bảng Giao Vận Shipper')).toBeVisible();
  });
});
