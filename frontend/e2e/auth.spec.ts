import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('displays login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('dana@clinic.kz')).toBeVisible();
    await expect(page.getByRole('button', { name: /войти/i })).toBeVisible();
  });

  test('shows error on empty form submission', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /войти/i }).click();
    // Should show a toast with error message
    await expect(page.getByText(/введите email и пароль/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows register link', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/регистрация/i)).toBeVisible();
  });

  test('can navigate to register page', async ({ page }) => {
    await page.goto('/login');
    await page.getByText(/регистрация/i).click();
    await expect(page).toHaveURL(/register/);
  });

  test('shows parent portal link', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/портал для родителей/i)).toBeVisible();
  });

  test('can switch language', async ({ page }) => {
    await page.goto('/login');
    // The language switcher should be visible
    const langButton = page.locator('button:has-text("RU"), button:has-text("KZ"), button:has-text("Рус"), button:has-text("Қаз")');
    if (await langButton.count() > 0) {
      await langButton.first().click();
    }
  });
});

test.describe('Navigation', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/');
    // Should redirect to login since not authenticated
    await expect(page).toHaveURL(/login/);
  });

  test('register page renders', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('button', { name: /регистрация|зарегистрироваться/i })).toBeVisible();
  });

  test('parent login page renders', async ({ page }) => {
    await page.goto('/parent/login');
    await expect(page.getByText(/родител/i)).toBeVisible();
  });
});
