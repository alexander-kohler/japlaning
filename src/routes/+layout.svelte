<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();

	const links = [
		{ href: '/' as const, label: 'Home', public: true },
		{ href: '/calendar' as const, label: 'Calendar', public: false },
		{ href: '/split' as const, label: 'Cost split', public: false }
	];

	const isLogin = $derived(page.url.pathname === '/login');
	const visibleLinks = $derived(links.filter((link) => link.public || data.authenticated));
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-zinc-50 text-zinc-900">
	{#if !isLogin}
		<nav class="border-b border-zinc-200 bg-white">
			<div class="mx-auto flex max-w-7xl items-center gap-1 px-3 py-2 sm:px-4">
				<a
					href={resolve('/')}
					class="mr-3 text-sm font-semibold tracking-tight text-zinc-900 hover:text-zinc-700"
				>
					Japlaning
				</a>
				{#each visibleLinks as link (link.href)}
					{@const active =
						page.url.pathname === link.href ||
						(link.href === '/calendar' && page.url.pathname.startsWith('/accommodation'))}
					<a
						href={resolve(link.href)}
						class={`rounded-md px-2.5 py-1.5 text-sm transition ${
							active
								? 'bg-zinc-900 text-white'
								: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
						}`}
					>
						{link.label}
					</a>
				{/each}
				{#if data.authenticated}
					<form method="POST" action="/logout" class="ml-auto">
						<button
							type="submit"
							class="rounded-md px-2.5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
						>
							Log out
						</button>
					</form>
				{:else}
					<a
						href={resolve('/login')}
						class="ml-auto rounded-md px-2.5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
					>
						Log in
					</a>
				{/if}
			</div>
		</nav>
	{/if}
	{@render children()}
</div>
