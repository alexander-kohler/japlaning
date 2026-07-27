const API_BASE = 'https://api.frankfurter.dev/v2';

export type Currency = {
	iso_code: string;
	iso_numeric?: string;
	name: string;
	symbol?: string;
	start_date?: string;
	end_date?: string;
};

type RateResponse = {
	date: string;
	base: string;
	quote: string;
	rate: number;
};

let currenciesCache: Currency[] | null = null;
const rateToEurCache = new Map<string, number>();

export async function fetchCurrencies(): Promise<Currency[]> {
	if (currenciesCache) return currenciesCache;

	const response = await fetch(`${API_BASE}/currencies`);
	if (!response.ok) {
		throw new Error(`Failed to load currencies (${response.status})`);
	}

	const data = (await response.json()) as Currency[];
	currenciesCache = data
		.filter((currency) => Boolean(currency.iso_code && currency.name))
		.sort((a, b) => a.iso_code.localeCompare(b.iso_code));

	return currenciesCache;
}

/** Convert an amount from `fromCurrency` into EUR using Frankfurter rates. */
export async function convertToEur(amount: number, fromCurrency: string): Promise<number> {
	const code = fromCurrency.toUpperCase();
	if (!Number.isFinite(amount)) return 0;
	if (code === 'EUR') return amount;

	const cached = rateToEurCache.get(code);
	if (cached !== undefined) return amount * cached;

	const response = await fetch(`${API_BASE}/rate/${encodeURIComponent(code)}/EUR`);
	if (!response.ok) {
		throw new Error(`Failed to convert ${code} to EUR (${response.status})`);
	}

	const data = (await response.json()) as RateResponse;
	if (!Number.isFinite(data.rate)) {
		throw new Error(`Invalid rate for ${code} → EUR`);
	}

	rateToEurCache.set(code, data.rate);
	return amount * data.rate;
}

export function formatEur(amount: number): string {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR'
	}).format(amount);
}

export function formatMoney(amount: number, currency: string): string {
	try {
		return new Intl.NumberFormat('en-GB', {
			style: 'currency',
			currency
		}).format(amount);
	} catch {
		return `${amount.toFixed(2)} ${currency}`;
	}
}

export function currencyLabel(currency: Currency): string {
	const symbol = currency.symbol ? ` (${currency.symbol})` : '';
	return `${currency.iso_code} — ${currency.name}${symbol}`;
}
