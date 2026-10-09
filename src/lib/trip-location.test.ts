import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isLocationInJapan } from './trip-location.ts';
import { currencyForLocation } from './currency.ts';

describe('isLocationInJapan', () => {
	it('is false before the first Japan check-in', () => {
		assert.equal(isLocationInJapan(new Date('2026-08-12T06:59:59.000Z')), false);
	});

	it('is true from arrival through the final checkout, including gaps between stays', () => {
		assert.equal(isLocationInJapan(new Date('2026-08-12T07:00:00.000Z')), true);
		// Between checkout in Kobe and the next stay on 26 Aug.
		assert.equal(isLocationInJapan(new Date('2026-08-26T03:00:00.000Z')), true);
		assert.equal(isLocationInJapan(new Date('2026-10-09T03:00:00.000Z')), true);
		assert.equal(isLocationInJapan(new Date('2026-10-13T00:00:00.000Z')), true);
	});

	it('is false after the final Japan checkout', () => {
		assert.equal(isLocationInJapan(new Date('2026-10-13T00:00:01.000Z')), false);
	});
});

describe('currencyForLocation', () => {
	it('uses yen in Japan and euro otherwise', () => {
		assert.equal(currencyForLocation(true), 'JPY');
		assert.equal(currencyForLocation(false), 'EUR');
		assert.equal(
			currencyForLocation(isLocationInJapan(new Date('2026-10-09T03:00:00.000Z'))),
			'JPY'
		);
		assert.equal(
			currencyForLocation(isLocationInJapan(new Date('2026-07-01T00:00:00.000Z'))),
			'EUR'
		);
	});
});
