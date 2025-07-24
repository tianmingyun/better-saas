import { Page, expect } from '@playwright/test';

/**
 * Test user credentials for different scenarios
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'TestPassword123!',
    name: 'Test Admin',
  },
  user: {
    email: 'user@test.com',
    password: 'TestPassword123!',
    name: 'Test User',
  },
  newUser: {
    email: 'newuser@test.com',
    password: 'TestPassword123!',
    name: 'New Test User',
  },
};

/**
 * Common test data
 */
export const TEST_DATA = {
  files: {
    validImage: 'tests/fixtures/test-image.jpg',
    validPdf: 'tests/fixtures/test-document.pdf',
    invalidFile: 'tests/fixtures/invalid-file.txt',
  },
  urls: {
    home: '/',
    login: '/login',
    signup: '/signup',
    dashboard: '/dashboard',
    settings: '/settings',
    billing: '/settings/billing',
    profile: '/settings/profile',
    security: '/settings/security',
    users: '/dashboard/users',
    files: '/dashboard/files',
  },
};

/**
 * Authentication helper functions
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login with email and password
   */
  async loginWithEmail(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for successful login redirect
    await this.page.waitForURL(/\/(dashboard|settings)/);
  }

  /**
   * Login as admin user
   */
  async loginAsAdmin() {
    await this.ensureTestUser(TEST_USERS.admin);
  }

  /**
   * Login as regular user
   */
  async loginAsUser() {
    await this.ensureTestUser(TEST_USERS.user);
  }

  /**
   * Logout current user
   */
  async logout() {
    await this.page.click('[data-testid="user-menu-trigger"]');
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL('/');
  }

  /**
   * Sign up new user
   */
  async signUp(userData: { email: string; password: string; name: string }) {
    await this.page.goto('/signup');
    await this.page.fill('[data-testid="name-input"]', userData.name);
    await this.page.fill('[data-testid="email-input"]', userData.email);
    await this.page.fill('[data-testid="password-input"]', userData.password);
    await this.page.fill('[data-testid="confirm-password-input"]', userData.password);
    await this.page.click('[data-testid="signup-button"]');
    
    // Wait for successful signup redirect
    await this.page.waitForURL(/\/(dashboard|settings)/);
  }

  /**
   * Ensure test user exists (create if not exists)
   */
  async ensureTestUser(userData: { email: string; password: string; name: string }) {
    try {
      // Try to login first
      await this.loginWithEmail(userData.email, userData.password);
      return;
    } catch {
      // If login fails, try to signup
      try {
        await this.signUp(userData);
      } catch {
        // If signup also fails, the user might already exist
        // Try login again
        await this.loginWithEmail(userData.email, userData.password);
      }
    }
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForSelector('[data-testid="user-menu-trigger"]', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if user is admin
   */
  async isAdmin(): Promise<boolean> {
    try {
      await this.page.waitForSelector('[data-testid="admin-menu"]', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Navigation helper functions
 */
export class NavigationHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to dashboard
   */
  async goToDashboard() {
    await this.page.goto('/dashboard');
    await this.page.waitForSelector('[data-testid="dashboard-content"]');
  }

  /**
   * Navigate to user management
   */
  async goToUserManagement() {
    await this.page.goto('/dashboard/users');
    await this.page.waitForSelector('[data-testid="users-table"]');
  }

  /**
   * Navigate to file management
   */
  async goToFileManagement() {
    await this.page.goto('/dashboard/files');
    await this.page.waitForSelector('[data-testid="file-manager"]');
  }

  /**
   * Navigate to settings
   */
  async goToSettings() {
    await this.page.goto('/settings');
    await this.page.waitForSelector('[data-testid="settings-content"]');
  }

  /**
   * Navigate to billing
   */
  async goToBilling() {
    await this.page.goto('/settings/billing');
    await this.page.waitForSelector('[data-testid="billing-content"]');
  }

  /**
   * Navigate to profile
   */
  async goToProfile() {
    await this.page.goto('/settings/profile');
    await this.page.waitForSelector('[data-testid="profile-content"]');
  }

  /**
   * Navigate to security settings
   */
  async goToSecurity() {
    await this.page.goto('/settings/security');
    await this.page.waitForSelector('[data-testid="security-content"]');
  }

  /**
   * Switch language
   */
  async switchLanguage(locale: 'en' | 'zh') {
    await this.page.click('[data-testid="language-switcher"]');
    await this.page.click(`[data-testid="language-${locale}"]`);
    await this.page.waitForURL(`/${locale}/**`);
  }
}

/**
 * Form helper functions
 */
export class FormHelper {
  constructor(private page: Page) {}

  /**
   * Fill form fields
   */
  async fillForm(fields: Record<string, string>) {
    for (const [selector, value] of Object.entries(fields)) {
      await this.page.fill(selector, value);
    }
  }

  /**
   * Submit form and wait for response
   */
  async submitForm(submitSelector: string, expectedUrl?: string | RegExp) {
    await this.page.click(submitSelector);
    
    if (expectedUrl) {
      await this.page.waitForURL(expectedUrl);
    }
  }

  /**
   * Upload file
   */
  async uploadFile(inputSelector: string, filePath: string) {
    await this.page.setInputFiles(inputSelector, filePath);
  }

  /**
   * Wait for success message
   */
  async waitForSuccessMessage(message?: string) {
    if (message) {
      await expect(this.page.locator('[data-testid="success-toast"]')).toContainText(message);
    } else {
      await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
    }
  }

  /**
   * Wait for error message
   */
  async waitForErrorMessage(message?: string) {
    if (message) {
      await expect(this.page.locator('[data-testid="error-toast"]')).toContainText(message);
    } else {
      await expect(this.page.locator('[data-testid="error-toast"]')).toBeVisible();
    }
  }
}

/**
 * Database helper functions for test data setup
 */
export class DatabaseHelper {
  /**
   * Create test user in database
   */
  static async createTestUser(userData: { email: string; password: string; name: string; role?: 'admin' | 'user' }) {
    // This would typically use a database connection or API call
    // For now, we'll use the signup flow to create users
    console.log('Creating test user:', userData.email);
  }

  /**
   * Clean up test data
   */
  static async cleanupTestData() {
    // Clean up any test data created during tests
    console.log('Cleaning up test data');
  }

  /**
   * Reset database to initial state
   */
  static async resetDatabase() {
    // Reset database to known state for consistent testing
    console.log('Resetting database');
  }
}

/**
 * Wait helper functions
 */
export class WaitHelper {
  constructor(private page: Page) {}

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Wait for text to appear
   */
  async waitForText(text: string, timeout = 10000) {
    await this.page.waitForSelector(`text=${text}`, { timeout });
  }

  /**
   * Wait for URL change
   */
  async waitForUrlChange(expectedUrl: string | RegExp, timeout = 10000) {
    await this.page.waitForURL(expectedUrl, { timeout });
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete() {
    // Wait for any loading spinners to disappear
    await this.page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden' });
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string | RegExp) {
    await this.page.waitForResponse(urlPattern);
  }
}

/**
 * Assertion helper functions
 */
export class AssertionHelper {
  constructor(private page: Page) {}

  /**
   * Assert page title
   */
  async assertPageTitle(expectedTitle: string) {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  /**
   * Assert URL
   */
  async assertUrl(expectedUrl: string | RegExp) {
    await expect(this.page).toHaveURL(expectedUrl);
  }

  /**
   * Assert element visible
   */
  async assertElementVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  /**
   * Assert element hidden
   */
  async assertElementHidden(selector: string) {
    await expect(this.page.locator(selector)).toBeHidden();
  }

  /**
   * Assert text content
   */
  async assertTextContent(selector: string, expectedText: string) {
    await expect(this.page.locator(selector)).toContainText(expectedText);
  }

  /**
   * Assert element count
   */
  async assertElementCount(selector: string, expectedCount: number) {
    await expect(this.page.locator(selector)).toHaveCount(expectedCount);
  }
}

/**
 * Screenshot helper functions
 */
export class ScreenshotHelper {
  constructor(private page: Page) {}

  /**
   * Take full page screenshot
   */
  async takeFullPageScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Take element screenshot
   */
  async takeElementScreenshot(selector: string, name: string) {
    await this.page.locator(selector).screenshot({ path: `test-results/screenshots/${name}.png` });
  }
} 