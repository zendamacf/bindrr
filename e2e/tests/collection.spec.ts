import { expect, type Locator, type Page, test } from '@playwright/test';
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from '../constants';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(E2E_USER_EMAIL);
  await page.getByTestId('login-password').fill(E2E_USER_PASSWORD);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(/\/collection/);
}

function desktopToolbar(page: Page): Locator {
  return page.getByTestId('collection-desktop-toolbar');
}

function collectionTableRows(page: Page): Locator {
  return page.getByTestId('collection-desktop-table').getByTestId('collection-row');
}

function editCardDialog(page: Page): Locator {
  return page.getByRole('dialog').filter({ has: page.getByTestId('collection-edit-panel') });
}

test.describe('Collection', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await login(page);
    await expect(page.getByTestId('collection-desktop-table')).toBeVisible();
  });

  test('loads seeded cards and supports search filter', async ({ page }) => {
    const rows = collectionTableRows(page);
    await expect(rows.filter({ hasText: 'Lightning Bolt' })).toBeVisible();
    await expect(rows.filter({ hasText: 'Island' })).toBeVisible();

    await desktopToolbar(page).getByTestId('collection-search').fill('Island');
    await expect(rows.filter({ hasText: 'Lightning Bolt' })).toHaveCount(0);
    await expect(rows.filter({ hasText: 'Island' })).toBeVisible();
  });

  test('sorts by name descending', async ({ page }) => {
    const nameHeader = page.getByTestId('collection-desktop-table').getByRole('columnheader', {
      name: /Name/,
    });
    await nameHeader.click();

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

    await desktopToolbar(page).getByTestId('collection-add-cards').click();
    const addDialog = page.getByRole('dialog', { name: 'Add cards' });
    await addDialog.getByTestId('add-card-search').fill('mock');
    await expect(addDialog.getByText('Mock Bolt')).toBeVisible();
  });

  test('updates quantity and opens change history', async ({ page }) => {
    await collectionTableRows(page).filter({ hasText: 'Lightning Bolt' }).click();
    const editDialog = editCardDialog(page);
    await expect(editDialog.getByTestId('collection-edit-panel')).toBeVisible();

    await editDialog.locator('[data-testid="collection-edit-quantity"]:visible').fill('4');
    await editDialog.locator('[data-testid="collection-edit-save"]:visible').click();
    await expect(page.getByText('Card updated.')).toBeVisible();

    await editDialog.locator('[data-testid="collection-change-history"]:visible').click();
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
