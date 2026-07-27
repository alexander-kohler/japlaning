<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const links = [
		{ href: '/' as const, label: 'Calendar' },
		{ href: '/split' as const, label: 'Cost split' }
	];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-zinc-50 text-zinc-900">
	<nav class="border-b border-zinc-200 bg-white">
		<div class="mx-auto flex max-w-7xl items-center gap-1 px-3 py-2 sm:px-4">
			<span class="mr-3 text-sm font-semibold tracking-tight text-zinc-900">Reiseplaner</span>
			{#each links as link (link.href)}
				<a
					href={resolve(link.href)}
					class={`rounded-md px-2.5 py-1.5 text-sm transition ${
						page.url.pathname === link.href
							? 'bg-zinc-900 text-white'
							: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
					}`}
				>
					{link.label}
				</a>
			{/each}
		</div>
	</nav>
	{@render children()}
</div>
