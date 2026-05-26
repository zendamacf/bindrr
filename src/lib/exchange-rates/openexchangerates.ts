const OPENEXCHANGERATES_URL = 'https://openexchangerates.org/api/latest.json';

type LatestRatesResponse = {
  rates: Record<string, number>;
};

export async function fetchLatestExchangeRates(): Promise<Record<string, number>> {
  const appId = process.env.OPENEXCHANGERATES_APPID;
  if (!appId) throw new Error('OPENEXCHANGERATES_APPID is not set');

  const url = new URL(OPENEXCHANGERATES_URL);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('base', 'USD');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open Exchange Rates request failed (${response.status})`);
  }

  const body = (await response.json()) as LatestRatesResponse;
  if (!body.rates || typeof body.rates !== 'object') {
    throw new Error('Open Exchange Rates response missing rates');
  }

  return body.rates;
}
