import { redirect, type Handle } from '@sveltejs/kit';
import { isAuthenticated } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const isLogin = path === '/login';
	const authed = isAuthenticated(event.cookies);

	event.locals.authenticated = authed;

	if (!authed && !isLogin) {
		throw redirect(303, '/login');
	}

	if (authed && isLogin) {
		throw redirect(303, '/');
	}

	return resolve(event);
};
