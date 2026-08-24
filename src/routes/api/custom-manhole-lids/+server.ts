import { error, json } from '@sveltejs/kit';
import {
	insertCustomManholeLid,
	listCustomManholeLids
} from '$lib/server/custom-manhole-lids';
import type { RequestHandler } from './$types';

function assertCoord(value: unknown, label: string): number {
	const n = Number(value);
	if (!Number.isFinite(n)) throw error(400, `${label} must be a number`);
	return n;
}

export const GET: RequestHandler = async () => {
	const lids = await listCustomManholeLids();
	return json({ lids });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as {
		name?: string;
		description?: string | null;
		address?: string | null;
		prefecture?: string | null;
		lat?: number;
		lng?: number;
	};

	const name = body.name?.trim() ?? '';
	if (!name) throw error(400, 'Name is required');
	if (name.length > 120) throw error(400, 'Name is too long');

	const lat = assertCoord(body.lat, 'lat');
	const lng = assertCoord(body.lng, 'lng');
	if (lat < -90 || lat > 90) throw error(400, 'lat out of range');
	if (lng < -180 || lng > 180) throw error(400, 'lng out of range');

	const description = body.description?.trim() || null;
	const address = body.address?.trim() || null;
	const prefecture = body.prefecture?.trim() || null;

	if (description && description.length > 500) {
		throw error(400, 'Description is too long');
	}
	if (address && address.length > 240) {
		throw error(400, 'Address is too long');
	}
	if (prefecture && prefecture.length > 80) {
		throw error(400, 'Prefecture is too long');
	}

	const lid = await insertCustomManholeLid({
		name,
		description,
		address,
		prefecture,
		lat,
		lng
	});

	return json({ lid }, { status: 201 });
};
