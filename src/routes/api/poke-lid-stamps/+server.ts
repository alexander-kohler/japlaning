import { error, json } from '@sveltejs/kit';
import { getPokeLid } from '$lib/poke-lids';
import { listPokeLidStamps, upsertPokeLidStamp } from '$lib/server/poke-lid-stamps';
import type { RequestHandler } from './$types';

const MAX_IMAGE_CHARS = 900_000; // ~675KB base64 ≈ comfortably under common row limits
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const GET: RequestHandler = async () => {
	const stamps = await listPokeLidStamps();
	return json({ stamps });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as {
		lidId?: string;
		note?: string | null;
		imageMime?: string | null;
		imageData?: string | null;
		clearImage?: boolean;
	};

	const lidId = body.lidId?.trim() ?? '';
	if (!lidId || !getPokeLid(lidId)) {
		throw error(400, 'Unknown Poké Lid id');
	}

	if (body.imageData != null) {
		if (typeof body.imageData !== 'string' || !body.imageData) {
			throw error(400, 'imageData must be a non-empty base64 string');
		}
		if (body.imageData.length > MAX_IMAGE_CHARS) {
			throw error(400, 'Image is too large — try a smaller photo');
		}
		if (!/^[A-Za-z0-9+/=\s]+$/.test(body.imageData)) {
			throw error(400, 'imageData must be base64');
		}
		const mime = body.imageMime?.trim() || 'image/jpeg';
		if (!ALLOWED_MIME.has(mime)) {
			throw error(400, 'imageMime must be image/jpeg, image/png, or image/webp');
		}
	}

	const stamp = await upsertPokeLidStamp({
		lidId,
		note: body.note,
		imageMime: body.imageMime,
		imageData: body.imageData,
		clearImage: Boolean(body.clearImage)
	});

	return json({ stamp }, { status: 201 });
};
