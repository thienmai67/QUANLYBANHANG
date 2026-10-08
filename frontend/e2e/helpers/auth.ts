import { Page } from '@playwright/test';

export type UserRole = 'CUSTOMER' | 'MANAGER' | 'SHIPPER' | 'ADMIN';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export const PRESET_USERS: Record<UserRole, TestUser> = {
  CUSTOMER: {
    id: 'u-cust-001',
    email: 'customer@tdt-me.com.vn',
    name: 'Trần Văn Thầu',
    role: 'CUSTOMER',
  },
  MANAGER: {
    id: 'u-mgr-001',
    email: 'manager@tdt-me.com.vn',
    name: 'Nguyễn Hải Đăng',
    role: 'MANAGER',
  },
  SHIPPER: {
    id: 'u-ship-001',
    email: 'shipper@tdt-me.com.vn',
    name: 'Tài Xế Hoàng Nam',
    role: 'SHIPPER',
  },
  ADMIN: {
    id: 'u-admin-001',
    email: 'admin@tdt-me.com.vn',
    name: 'Nguyễn Trung Dũng',
    role: 'ADMIN',
  },
};

/**
 * Generates a valid Base64-encoded JWT access token for testing.
 * Compatible with decodeToken() in frontend/src/lib/auth.ts.
 */
export function generateTestToken(role: UserRole, overrides?: Partial<TestUser>): string {
  const user = { ...PRESET_USERS[role], ...overrides };
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      iss: 'tdt-me-platform',
      aud: ['access'],
      iat: now,
      exp: now + 86400, // 24 hours validity
    })
  ).toString('base64url');

  const signature = 'test_signed_hmac_sha256_mock_signature';
  return `${header}.${payload}.${signature}`;
}

/**
 * Injects authenticated session into browser localStorage via page.addInitScript.
 * This sets both `access_token` (for RouteGuard / lib/auth) and `tdt-auth-storage` (for Zustand useAuthStore).
 */
export async function injectAuthState(
  page: Page,
  role: UserRole,
  userOverrides?: Partial<TestUser>
): Promise<{ token: string; user: TestUser }> {
  const user: TestUser = { ...PRESET_USERS[role], ...userOverrides };
  const token = generateTestToken(role, userOverrides);

  const authStorage = {
    state: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      isAuthenticated: true,
    },
    version: 0,
  };

  await page.addInitScript(
    ({ token, authStorage }) => {
      window.localStorage.setItem('access_token', token);
      window.localStorage.setItem('refresh_token', 'mock_refresh_token_valid');
      window.localStorage.setItem('tdt-auth-storage', JSON.stringify(authStorage));
    },
    { token, authStorage }
  );

  return { token, user };
}

/**
 * Clears authentication state in localStorage.
 */
export async function clearAuthState(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.localStorage.removeItem('access_token');
    window.localStorage.removeItem('refresh_token');
    window.localStorage.removeItem('tdt-auth-storage');
  });
}

/**
 * Intercepts and mocks backend API routes to ensure self-contained, offline-resilient E2E execution.
 */
export async function mockApiRoutes(page: Page): Promise<void> {
  // Handle /api/v1/auth/login
  await page.route('**/api/v1/auth/login', async (route) => {
    if (route.request().method() === 'POST') {
      try {
        const postData = route.request().postDataJSON() || {};
        const email = (postData.email || '').toLowerCase();
        const password = postData.password || '';

        // Simulate password validation failure if password is wrong
        if (password === 'WrongPassword!' || password === 'wrong') {
          return route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Email hoặc mật khẩu không chính xác' }),
          });
        }

        let role: UserRole = 'CUSTOMER';
        if (email.includes('admin')) role = 'ADMIN';
        else if (email.includes('manager')) role = 'MANAGER';
        else if (email.includes('shipper')) role = 'SHIPPER';

        const token = generateTestToken(role, { email });

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: token,
            refreshToken: 'mock_refresh_token_e2e',
            expiresIn: 7200,
          }),
        });
      } catch {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid request body' }),
        });
      }
    }
    return route.continue();
  });

  // Handle /api/v1/auth/register
  await page.route('**/api/v1/auth/register', async (route) => {
    if (route.request().method() === 'POST') {
      const postData = route.request().postDataJSON() || {};
      const email = (postData.email || '').toLowerCase();

      if (email === 'existing@tdt-me.com.vn') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.' }),
        });
      }

      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Đăng ký tài khoản thành công',
        }),
      });
    }
    return route.continue();
  });

  // Handle /api/v1/orders
  await page.route('**/api/v1/orders', async (route) => {
    if (route.request().method() === 'POST') {
      const postData = route.request().postDataJSON() || {};
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'ord-test-uuid',
          orderNumber: postData.orderNumber || 'ORD-999999',
          customerName: postData.customerName || 'Khách Mua Lẻ',
          totalAmount: postData.totalAmount || 100000,
          status: 'PENDING',
          items: postData.items || [],
        }),
      });
    }
    return route.continue();
  });
}
