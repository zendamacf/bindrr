import { expect, test, type Page } from '@playwright/test';
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from '../constants';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(E2E_USER_EMAIL);
  await page.getByTestId('login-password').fill(E2E_USER_PASSWORD);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(/\/collection/);
}

/** Desktop table rows (mobile card rows share the same test id but stay in the DOM). */
function collectionTableRows(page: Page) {
  return page.locator('table [data-testid="collection-row"]');
}

/** Desktop toolbar button (mobile uses an additional full-width variant). */
function desktopAddCardsButton(page: Page) {
  return page.getByTestId('collection-add-cards').filter({ hasNot: page.locator('[data-block="true"]') });
}

test.describe('Collection', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await login(page);
  });

  test('loads seeded cards and supports search filter', async ({ page }) => {
    const rows = collectionTableRows(page);
    await expect(rows.filter({ hasText: 'Lightning Bolt' })).toBeVisible();
    await expect(rows.filter({ hasText: 'Island' })).toBeVisible();

    await page.getByTestId('collection-search').first().fill('Island');
    await expect(rows.filter({ hasText: 'Island' })).toBeVisible();
    await expect(rows.filter({ hasText: 'Lightning Bolt' })).toHaveCount(0);
  });

  test('sorts by name descending', async ({ page }) => {
    await page.getByRole('columnheader', { name: /Name/ }).click();
    await page.getByRole('columnheader', { name: /Name/ }).click();

    const rows = collectionTableRows(page);
    await expect(rows.nth(0)).toContainText('Lightning Bolt');
    await expect(rows.nth(1)).toContainText('Island');
  });

  test('shows mocked card search results in the add panel', async ({ page }) => {
    await page.route('**/api/cards/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              scryfallId: 'mock-scryfall-1',
              name: 'Mock Bolt',
              setName: 'Mock Set',
              setCode: 'MOCK',
              collectorNumber: '1',
              languageCode: 'en',
              imageUrl: null,
              price: 1,
              priceFoil: null,
              priceEtched: null,
              currencyCode: 'USD',
              tcgplayerProductId: null,
              canAddNonfoil: true,
              canAddFoil: false,
              canAddEtched: false,
            },
          ],
        }),
      });
    });

    await desktopAddCardsButton(page).click();
    await page.getByTestId('add-card-search').fill('mock');
    await expect(page.getByText('Mock Bolt')).toBeVisible();
  });

  test('updates quantity and opens change history', async ({ page }) => {
    await collectionTableRows(page).filter({ hasText: 'Lightning Bolt' }).click();
    await expect(page.getByTestId('collection-edit-panel')).toBeVisible();

    const quantity = page.getByTestId('collection-edit-quantity');
    await quantity.fill('4');
    await page.getByTestId('collection-edit-save').click();
    await expect(page.getByText('Card updated.')).toBeVisible();

    await page.getByTestId('collection-change-history').click();
    await expect(page.getByRole('dialog', { name: 'Change history' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '+2' })).toBeVisible();
  });

  test('changes preferred currency', async ({ page }) => {
    const select = page.getByTestId('currency-select');
    await select.click();
    await page.getByRole('option', { name: 'Euro' }).click();
    await expect(select).toHaveValue('Euro');
  });
});
