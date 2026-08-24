import { error, json } from '@sveltejs/kit';
import { isCustomLidId } from '$lib/custom-manhole-lids';
import {
	deleteCustomManholeLid,
	getCustomManholeLid,
	updateCustomManholeLid
} from '$lib/server/custom-manhole-lids';
import type { RequestHandler } from './$types';

function assertCoord(value: unknown, label: string): number {
	const n = Number(value);
	if (!Number.isFinite(n)) throw error(400, `${label} must be a number`);
	return n;
}

export const GET: RequestHandler = async ({ params }) => {
	const id = params.id?.trim() ?? '';
	if (!id || !isCustomLidId(id)) throw error(404, 'Custom lid not found');

	const lid = await getCustomManholeLid(id);
	if (!lid) throw error(404, 'Custom lid not found');
	return json({ lid });
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = params.id?.trim() ?? '';
	if (!id || !isCustomLidId(id)) throw error(404, 'Custom lid not found');

	const body = (await request.json()) as {
		name?: string;
		description?: string | null;
		address?: string | null;
		prefecture?: string | null;
		lat?: number;
		lng?: number;
	};

	const patch: {
		name?: string;
		description?: string | null;
		address?: string | null;
		prefecture?: string | null;
		lat?: number;
		lng?: number;
	} = {};

	if (body.name !== undefined) {
		const name = body.name.trim();
		if (!name) throw error(400, 'Name is required');
		if (name.length > 120) throw error(400, 'Name is too long');
		patch.name = name;
	}
	if (body.description !== undefined) {
		const description = body.description?.trim() || null;
		if (description && description.length > 500) {
			throw error(400, 'Description is too long');
		}
		patch.description = description;
	}
	if (body.address !== undefined) {
		const address = body.address?.trim() || null;
		if (address && address.length > 240) throw error(400, 'Address is too long');
		patch.address = address;
	}
	if (body.prefecture !== undefined) {
		const prefecture = body.prefecture?.trim() || null;
		if (prefecture && prefecture.length > 80) {
			throw error(400, 'Prefecture is too long');
		}
		patch.prefecture = prefecture;
	}
	if (body.lat !== undefined) {
		const lat = assertCoord(body.lat, 'lat');
		if (lat < -90 || lat > 90) throw error(400, 'lat out of range');
		patch.lat = lat;
	}
	if (body.lng !== undefined) {
		const lng = assertCoord(body.lng, 'lng');
		if (lng < -180 || lng > 180) throw error(400, 'lng out of range');
		patch.lng = lng;
	}

	try {
		const lid = await updateCustomManholeLid(id, patch);
		if (!lid) throw error(404, 'Custom lid not found');
		return json({ lid });
	} catch (err) {
		if (err instanceof Error && err.message === 'Name is required') {
			throw error(400, err.message);
		}
		throw err;
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = params.id?.trim() ?? '';
	if (!id || !isCustomLidId(id)) throw error(404, 'Custom lid not found');

	const deleted = await deleteCustomManholeLid(id);
	if (!deleted) throw error(404, 'Custom lid not found');
	return json({ ok: true });
};
