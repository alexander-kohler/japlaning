<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Travel Planner</title>
</svelte:head>

<div class="min-h-screen bg-slate-100">
	<div class="mx-auto max-w-6xl px-4 py-8">
		<header class="mb-6">
			<h1 class="text-2xl font-bold text-slate-900">Travel Planner</h1>
			<p class="mt-1 text-sm text-slate-500">Plan dates, accommodation, and activities for your trip.</p>
		</header>
		{@render children()}
	</div>
</div>
