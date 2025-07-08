import { test, expect } from '@playwright/test';

test.describe('User Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/sign-in');
  });

  test('should display login form', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/登录|Sign In/);

    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check social login buttons
    await expect(page.locator('text=GitHub')).toBeVisible();
    await expect(page.locator('text=Google')).toBeVisible();
  });

  test('should display required field validation errors', async ({ page }) => {
    // Click submit button without filling any fields
    await page.click('button[type="submit"]');

    // Check validation error messages
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should display invalid email format error', async ({ page }) => {
    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Check email format error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('should display password length error', async ({ page }) => {
    // Enter password that is too short
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');

    // Check password length error
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
  });

  test('should handle login failure', async ({ page }) => {
    // Mock failed login response
    await page.route('**/api/auth/sign-in', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid email or password' }),
      });
    });

    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Check error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should successfully login and redirect to dashboard', async ({ page }) => {
    // Mock successful login response
    await page.route('**/api/auth/sign-in', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
          },
          session: {
            id: 'session-1',
            token: 'test-token',
          },
        }),
      });
    });

    // Mock dashboard page
    await page.route('**/dashboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body><h1>Dashboard</h1></body></html>',
      });
    });

    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should display loading state', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/auth/sign-in', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Fill form and submit
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Check loading state
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await expect(page.locator('text=Signing in...')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Use Tab key for navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();

    // Use Enter key to submit form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.locator('input[type="password"]').press('Enter');

    // Verify form submission
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('should remember user choice', async ({ page }) => {
    // Check "Remember me" checkbox
    const rememberCheckbox = page.locator('input[type="checkbox"]');
    await expect(rememberCheckbox).toBeVisible();

    // Check "Remember me"
    await rememberCheckbox.check();
    await expect(rememberCheckbox).toBeChecked();

    // Uncheck
    await rememberCheckbox.uncheck();
    await expect(rememberCheckbox).not.toBeChecked();
  });

  test('should have sign up link', async ({ page }) => {
    // Check sign up link
    const signUpLink = page.locator("text=Don't have an account? Sign up");
    await expect(signUpLink).toBeVisible();

    // Click sign up link
    await signUpLink.click();
    await expect(page).toHaveURL(/.*sign-up/);
  });

  test('should have forgot password link', async ({ page }) => {
    // Check forgot password link
    const forgotPasswordLink = page.locator('text=Forgot password?');
    await expect(forgotPasswordLink).toBeVisible();

    // Click forgot password link
    await forgotPasswordLink.click();
    await expect(page).toHaveURL(/.*forgot-password/);
  });
});

test.describe('Social Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/sign-in');
  });

  test('should support GitHub login', async ({ page }) => {
    // Mock GitHub OAuth redirect
    await page.route('**/api/auth/github', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          Location: 'https://github.com/login/oauth/authorize?client_id=test',
        },
      });
    });

    // Click GitHub login button
    await page.click('text=GitHub');

    // Verify redirect to GitHub
    await page.waitForURL('**/github.com/**');
  });

  test('should support Google login', async ({ page }) => {
    // Mock Google OAuth redirect
    await page.route('**/api/auth/google', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          Location: 'https://accounts.google.com/oauth/authorize?client_id=test',
        },
      });
    });

    // Click Google login button
    await page.click('text=Google');

    // Verify redirect to Google
    await page.waitForURL('**/accounts.google.com/**');
  });
});
