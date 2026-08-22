import { json, error } from '@sveltejs/kit';
import { PREFECTURES } from '$lib/prefectures';
import {
	listVisitedPrefectureCodes,
	replaceVisitedPrefectures,
	setPrefectureVisited
} from '$lib/server/visited-prefectures';
import type { RequestHandler } from './$types';

const validCodes = new Set(PREFECTURES.map((prefecture) => prefecture.code));

function assertValidCode(code: string): void {
	if (!validCodes.has(code)) {
		throw error(400, 'Unknown prefecture code');
	}
}

export const GET: RequestHandler = async () => {
	const codes = await listVisitedPrefectureCodes();
	return json({ codes });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as { code?: string; visited?: boolean };
	const code = body.code?.trim() ?? '';

	if (!code || typeof body.visited !== 'boolean') {
		throw error(400, 'code and visited are required');
	}

	assertValidCode(code);
	await setPrefectureVisited(code, body.visited);
	const codes = await listVisitedPrefectureCodes();
	return json({ codes });
};

export const PUT: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as { codes?: string[] };

	if (!Array.isArray(body.codes)) {
		throw error(400, 'codes must be an array');
	}

	for (const code of body.codes) {
		if (typeof code !== 'string') {
			throw error(400, 'codes must be strings');
		}
		assertValidCode(code.trim());
	}

	const codes = await replaceVisitedPrefectures(body.codes);
	return json({ codes });
};
