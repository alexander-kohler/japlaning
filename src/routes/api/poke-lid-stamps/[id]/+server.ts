import { error, json } from '@sveltejs/kit';
import { getPokeLid } from '$lib/poke-lids';
import { deletePokeLidStamp, getPokeLidStamp } from '$lib/server/poke-lid-stamps';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const lidId = params.id?.trim() ?? '';
	if (!lidId || !getPokeLid(lidId)) {
		throw error(404, 'Poké Lid not found');
	}

	const includeImage = url.searchParams.get('image') === '1';
	const stamp = await getPokeLidStamp(lidId, includeImage);
	if (!stamp) {
		throw error(404, 'Stamp not found');
	}

	return json({ stamp });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const lidId = params.id?.trim() ?? '';
	if (!lidId || !getPokeLid(lidId)) {
		throw error(404, 'Poké Lid not found');
	}

	const deleted = await deletePokeLidStamp(lidId);
	if (!deleted) {
		throw error(404, 'Stamp not found');
	}

	return json({ ok: true });
};
