import { test, expect } from '@playwright/test';
import { mockApiRoutes, injectAuthState, clearAuthState } from './helpers/auth';

test.describe('01. Authentication & OTP Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('should display validation error on registration with invalid email or mismatching passwords', async ({ page }) => {
    await page.goto('/register');

    await page.fill('#register-lastName', 'Nguyễn');
    await page.fill('#register-firstName', 'Văn Test');
    await page.fill('#register-email', 'thau.tran@gmail.com');
    await page.fill('#register-password', 'Pass123');
    await page.fill('#register-confirmPassword', 'DifferentPass456');

    await page.click('button[type="submit"]:has-text("Tạo tài khoản")');

    // Web-first assertion: alert banner appears
    const errorAlert = page.locator('div[role="alert"]:not(#__next-route-announcer__)');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('không khớp');
  });

  test('should complete full registration with OTP verification modal', async ({ page }) => {
    await page.goto('/register');

    await page.fill('#register-lastName', 'Trần');
    await page.fill('#register-firstName', 'Văn Thầu');
    await page.fill('#register-email', 'thau.tran@congty.com');
    await page.fill('#register-phone', '0908123456');
    await page.fill('#register-password', 'MatKhau123');
    await page.fill('#register-confirmPassword', 'MatKhau123');

    // Click submit to trigger OTP modal
    await page.click('button[type="submit"]:has-text("Tạo tài khoản")');

    // OTP Modal should become visible
    const otpModalTitle = page.getByText('Xác thực đăng ký tài khoản');
    await expect(otpModalTitle).toBeVisible();

    // Read generated OTP code from modal
    const otpCodeLocator = page.locator('span.font-mono.text-2xl.font-bold');
    await expect(otpCodeLocator).toBeVisible();
    const otpCode = await otpCodeLocator.innerText();
    expect(otpCode.trim().length).toBe(6);

    // Enter OTP code
    await page.fill('#otp-input', otpCode.trim());

    // Submit OTP verification
    await page.click('button[type="submit"]:has-text("Xác nhận & Tạo tài khoản")');

    // Status message should indicate success
    const successAlert = page.locator('div[role="status"]');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('thành công');
  });

  test('should display error message on login with incorrect credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#login-email', 'user@tdt-me.com.vn');
    await page.fill('#login-password', 'WrongPassword!');

    await page.click('button[type="submit"]:has-text("Đăng nhập")');

    const alertBox = page.locator('div[role="alert"]:not(#__next-route-announcer__)');
    await expect(alertBox).toBeVisible();
    await expect(alertBox).toContainText('không chính xác');
  });

  test('should login successfully as Customer and redirect to /account', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#login-email', 'customer@tdt-me.com.vn');
    await page.fill('#login-password', 'ValidPassword123');

    await page.click('button[type="submit"]:has-text("Đăng nhập")');

    // Customer redirect to /account
    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByText('THÀNH VIÊN THÂN THIẾT')).toBeVisible();
  });

  test('should logout from customer account and terminate session', async ({ page }) => {
    await injectAuthState(page, 'CUSTOMER');
    await page.goto('/account');

    await expect(page.getByText('THÀNH VIÊN THÂN THIẾT')).toBeVisible();

    // Click logout button on account page
    const logoutBtn = page.locator('button:has-text("Đăng Xuất")').first();
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Clear tokens and session flag
    await clearAuthState(page);

    // Navigating back to /account must redirect to /login
    await page.goto('/account');
    await expect(page).toHaveURL(/\/login/);
  });
});
