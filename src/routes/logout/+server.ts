import { redirect } from '@sveltejs/kit';
import { clearAuthCookies } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	clearAuthCookies(cookies);
	throw redirect(303, '/');
};
