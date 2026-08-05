import { redirect, type Handle } from '@sveltejs/kit';
import { isAuthenticated } from '$lib/server/auth';

const PUBLIC_PATHS = new Set(['/', '/login']);

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const isPublic = PUBLIC_PATHS.has(path);
	const isLogin = path === '/login';
	const authed = isAuthenticated(event.cookies);

	event.locals.authenticated = authed;

	if (!authed && !isPublic) {
		throw redirect(303, '/login');
	}

	if (authed && isLogin) {
		throw redirect(303, '/calendar');
	}

	return resolve(event);
};
