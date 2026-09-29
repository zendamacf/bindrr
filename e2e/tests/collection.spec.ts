import { expect, type Locator, type Page, test } from '@playwright/test';
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from '../constants';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(E2E_USER_EMAIL);
  await page.getByTestId('login-password').fill(E2E_USER_PASSWORD);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(/\/collection/);
}

function visibleCollectionRows(page: Page): Locator {
  return page.locator('[data-testid="collection-row"]:visible');
}

function visibleSearchInput(page: Page): Locator {
  return page.locator('[data-testid="collection-search"]:visible');
}

function visibleAddCardsButton(page: Page): Locator {
  return page.locator('[data-testid="collection-add-cards"]:visible');
}

function visibleEditPanel(page: Page): Locator {
  return page.locator('[data-testid="collection-edit-panel"]:visible');
}

async function waitForCollectionReady(page: Page) {
  await expect(page.getByTestId('collection-view')).toBeVisible();
  await expect(visibleCollectionRows(page).first()).toBeVisible({ timeout: 15_000 });
}

async function sortCollectionByNameDescending(page: Page) {
  const nameHeader = page.locator('table:visible').getByRole('columnheader', { name: /Name/ });
  if (await nameHeader.count()) {
    await nameHeader.click();
    return;
  }
  await page.getByRole('radio', { name: /Desc/i }).click();
}

test.describe('Collection', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await login(page);
    await waitForCollectionReady(page);
  });

  test('loads seeded cards and supports search filter', async ({ page }) => {
    const rows = visibleCollectionRows(page);
    await expect(rows.filter({ hasText: 'Lightning Bolt' })).toBeVisible();
    await expect(rows.filter({ hasText: 'Island' })).toBeVisible();

    await visibleSearchInput(page).fill('Island');
    await expect(rows.filter({ hasText: 'Lightning Bolt' })).toHaveCount(0);
    await expect(rows.filter({ hasText: 'Island' })).toBeVisible();
  });

  test('sorts by name descending', async ({ page }) => {
    await sortCollectionByNameDescending(page);

    const rows = visibleCollectionRows(page);
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

    await visibleAddCardsButton(page).click();
    const addPanel = page.locator('[data-testid="add-card-search"]:visible');
    await addPanel.fill('mock');
    await expect(page.getByText('Mock Bolt')).toBeVisible();
  });

  test('updates quantity and opens change history', async ({ page }) => {
    await visibleCollectionRows(page).filter({ hasText: 'Lightning Bolt' }).click();
    const editPanel = visibleEditPanel(page);
    await expect(editPanel).toBeVisible();

    await editPanel.locator('[data-testid="collection-edit-quantity"]').fill('4');
    await editPanel.locator('[data-testid="collection-edit-save"]').click();
    await expect(page.getByText('Card updated.')).toBeVisible();

    await editPanel.locator('[data-testid="collection-change-history"]').click();
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
