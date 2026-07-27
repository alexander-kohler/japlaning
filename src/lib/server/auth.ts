import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';

export const AUTH_COOKIE = 'rp_auth';
export const USER_COOKIE = 'rp_user';

const ONE_YEAR_S = 60 * 60 * 24 * 365;

export function getAppPassword(): string {
	return env.APP_PASSWORD?.trim() || 'reiseplaner';
}

export function isValidPassword(password: string): boolean {
	return password === getAppPassword();
}

export function isAuthenticated(cookies: Cookies): boolean {
	return cookies.get(AUTH_COOKIE) === getAppPassword();
}

export function setAuthCookies(cookies: Cookies, password: string): void {
	const options = {
		path: '/',
		maxAge: ONE_YEAR_S,
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: !dev
	};

	cookies.set(AUTH_COOKIE, password, options);
	cookies.delete(USER_COOKIE, { path: '/' });
}

export function clearAuthCookies(cookies: Cookies): void {
	cookies.delete(USER_COOKIE, { path: '/' });
	cookies.delete(AUTH_COOKIE, { path: '/' });
}
