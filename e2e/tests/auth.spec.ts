import { expect, test } from '@playwright/test';
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from '../constants';

test.describe('Login', () => {
  test('shows an error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill('nobody@bindrr.test');
    await page.getByTestId('login-password').fill('wrong-password');
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('login-error')).toContainText('Invalid email or password');
  });

  test('redirects to the collection after a successful login', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(E2E_USER_EMAIL);
    await page.getByTestId('login-password').fill(E2E_USER_PASSWORD);
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL(/\/collection/);
    await expect(page.getByTestId('collection-view')).toBeVisible();
  });
});
