import { test, expect } from '@playwright/test';

test.describe('Public pages smoke test', () => {
  test('Chat page (landing) loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NEURALTWIN/);
    // Chat page should have the input area
    await expect(page.locator('.chat-page, [data-testid="chat"]')).toBeVisible({ timeout: 10_000 });
  });

  test('Product page loads', async ({ page }) => {
    await page.goto('/product');
    await expect(page).toHaveTitle(/NEURALTWIN/);
    await expect(page.locator('text=NEURALSENSE')).toBeVisible({ timeout: 10_000 });
  });

  test('Pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).toHaveTitle(/NEURALTWIN/);
    await expect(page.locator('text=HQ')).toBeVisible({ timeout: 10_000 });
  });

  test('Contact page loads', async ({ page }) => {
    await page.goto('/contact');
    await expect(page).toHaveTitle(/NEURALTWIN/);
  });

  test('Auth page loads', async ({ page }) => {
    await page.goto('/auth');
    await expect(page).toHaveTitle(/NEURALTWIN/);
  });
});

test.describe('i18n language switching', () => {
  test('Language toggle cycles ko → en → ja', async ({ page }) => {
    await page.goto('/product');
    await page.waitForLoadState('networkidle');

    // Default is Korean — look for the language toggle button
    const toggleBtn = page.locator('button[aria-label="Toggle language"]');
    if (await toggleBtn.isVisible({ timeout: 5_000 })) {
      // Click to switch to English
      await toggleBtn.click();
      await expect(toggleBtn).toContainText('EN');

      // Click to switch to Japanese
      await toggleBtn.click();
      await expect(toggleBtn).toContainText('JP');

      // Click to return to Korean
      await toggleBtn.click();
      await expect(toggleBtn).toContainText('KR');
    }
  });
});

test.describe('SEO meta tags', () => {
  test('Product page has proper meta description', async ({ page }) => {
    await page.goto('/product');
    // react-helmet-async adds data-rh="true" to managed elements
    const metaDesc = page.locator('meta[name="description"][data-rh="true"]');
    await expect(metaDesc).toHaveAttribute('content', /.+/, { timeout: 10_000 });
  });

  test('Pricing page has canonical link', async ({ page }) => {
    await page.goto('/pricing');
    const canonical = page.locator('link[rel="canonical"][data-rh="true"]');
    await expect(canonical).toHaveAttribute('href', /neuraltwin\.io\/pricing/, { timeout: 10_000 });
  });
});

test.describe('Navigation', () => {
  test('Navigate from Chat to Product', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to find and click product link
    const productLink = page.locator('a[href="/product"]').first();
    if (await productLink.isVisible({ timeout: 5_000 })) {
      await productLink.click();
      await expect(page).toHaveURL(/\/product/);
    }
  });

  test('Protected routes redirect to auth', async ({ page }) => {
    await page.goto('/os/insights');
    // Should redirect to auth page since not logged in
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
  });
});
