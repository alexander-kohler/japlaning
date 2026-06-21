<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Travel Planner</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100" style="font-family: 'Inter', system-ui, sans-serif;">
	<div class="mx-auto max-w-6xl px-4 pb-12 pt-8">
		<header class="mb-8 flex items-center gap-4">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 shadow-md shadow-sky-200">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
					<path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>
				</svg>
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-slate-900">Travel Planner</h1>
				<p class="text-sm text-slate-500">Plan your accommodation, transport, and activities.</p>
			</div>
		</header>
		{@render children()}
	</div>
</div>
