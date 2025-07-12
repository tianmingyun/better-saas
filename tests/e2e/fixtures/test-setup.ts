import { test as base, Page } from '@playwright/test';
import { 
  AuthHelper, 
  NavigationHelper, 
  FormHelper, 
  WaitHelper, 
  AssertionHelper, 
  ScreenshotHelper,
  DatabaseHelper 
} from '../utils/test-helpers';

/**
 * Extended test fixture with helper classes
 */
export interface TestFixtures {
  authHelper: AuthHelper;
  navigationHelper: NavigationHelper;
  formHelper: FormHelper;
  waitHelper: WaitHelper;
  assertionHelper: AssertionHelper;
  screenshotHelper: ScreenshotHelper;
}

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  authHelper: async ({ page }, use) => {
    const authHelper = new AuthHelper(page);
    await use(authHelper);
  },

  navigationHelper: async ({ page }, use) => {
    const navigationHelper = new NavigationHelper(page);
    await use(navigationHelper);
  },

  formHelper: async ({ page }, use) => {
    const formHelper = new FormHelper(page);
    await use(formHelper);
  },

  waitHelper: async ({ page }, use) => {
    const waitHelper = new WaitHelper(page);
    await use(waitHelper);
  },

  assertionHelper: async ({ page }, use) => {
    const assertionHelper = new AssertionHelper(page);
    await use(assertionHelper);
  },

  screenshotHelper: async ({ page }, use) => {
    const screenshotHelper = new ScreenshotHelper(page);
    await use(screenshotHelper);
  },
});

/**
 * Test setup and teardown hooks
 */
export const setupTest = {
  /**
   * Setup before all tests
   */
  beforeAll: async () => {
    console.log('Setting up test environment...');
    // Initialize test database
    await DatabaseHelper.resetDatabase();
  },

  /**
   * Setup before each test
   */
  beforeEach: async (page: Page) => {
    // Set default timeout
    page.setDefaultTimeout(30000);
    
    // Set viewport size
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Clear cookies and local storage
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  },

  /**
   * Cleanup after each test
   */
  afterEach: async (page: Page, testInfo: any) => {
    // Take screenshot on failure
    if (testInfo.status !== 'passed') {
      const screenshotHelper = new ScreenshotHelper(page);
      await screenshotHelper.takeFullPageScreenshot(`failure-${testInfo.title}-${Date.now()}`);
    }
    
    // Clean up test data
    await DatabaseHelper.cleanupTestData();
  },

  /**
   * Cleanup after all tests
   */
  afterAll: async () => {
    console.log('Cleaning up test environment...');
    await DatabaseHelper.cleanupTestData();
  },
};

/**
 * Test configuration constants
 */
export const TEST_CONFIG = {
  timeout: {
    default: 30000,
    slow: 60000,
    fast: 10000,
  },
  viewport: {
    desktop: { width: 1280, height: 720 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
  },
  urls: {
    baseUrl: 'http://localhost:3000',
    api: 'http://localhost:3000/api',
  },
};

/**
 * Common test patterns
 */
export const testPatterns = {
  /**
   * Test user authentication flow
   */
  testAuthFlow: async (page: Page, userType: 'admin' | 'user') => {
    const authHelper = new AuthHelper(page);
    const assertionHelper = new AssertionHelper(page);
    
    if (userType === 'admin') {
      await authHelper.loginAsAdmin();
      await assertionHelper.assertUrl(/\/dashboard/);
    } else {
      await authHelper.loginAsUser();
      await assertionHelper.assertUrl(/\/settings/);
    }
  },

  /**
   * Test protected route access
   */
  testProtectedRoute: async (page: Page, route: string, requiresAdmin = false) => {
    const authHelper = new AuthHelper(page);
    const assertionHelper = new AssertionHelper(page);
    
    // Test unauthenticated access
    await page.goto(route);
    await assertionHelper.assertUrl(/\/login/);
    
    // Test authenticated access
    if (requiresAdmin) {
      await authHelper.loginAsAdmin();
    } else {
      await authHelper.loginAsUser();
    }
    
    await page.goto(route);
    await assertionHelper.assertUrl(route);
  },

  /**
   * Test form submission
   */
  testFormSubmission: async (
    page: Page, 
    formData: Record<string, string>, 
    submitSelector: string,
    expectedResult: 'success' | 'error',
    expectedMessage?: string
  ) => {
    const formHelper = new FormHelper(page);
    
    await formHelper.fillForm(formData);
    await formHelper.submitForm(submitSelector);
    
    if (expectedResult === 'success') {
      await formHelper.waitForSuccessMessage(expectedMessage);
    } else {
      await formHelper.waitForErrorMessage(expectedMessage);
    }
  },

  /**
   * Test responsive design
   */
  testResponsiveDesign: async (page: Page, url: string) => {
    const screenshotHelper = new ScreenshotHelper(page);
    
    // Test desktop view
    await page.setViewportSize(TEST_CONFIG.viewport.desktop);
    await page.goto(url);
    await screenshotHelper.takeFullPageScreenshot(`desktop-${url.replace(/\//g, '-')}`);
    
    // Test tablet view
    await page.setViewportSize(TEST_CONFIG.viewport.tablet);
    await page.reload();
    await screenshotHelper.takeFullPageScreenshot(`tablet-${url.replace(/\//g, '-')}`);
    
    // Test mobile view
    await page.setViewportSize(TEST_CONFIG.viewport.mobile);
    await page.reload();
    await screenshotHelper.takeFullPageScreenshot(`mobile-${url.replace(/\//g, '-')}`);
  },
};

export { expect } from '@playwright/test'; 