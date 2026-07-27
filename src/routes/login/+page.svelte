<script lang="ts">
	let { form } = $props();
</script>

<div class="flex min-h-screen items-center justify-center px-4 py-12">
	<form method="POST" class="w-full max-w-sm space-y-4">
		<div>
			<p class="text-sm font-semibold tracking-tight text-zinc-900">Reiseplaner</p>
			<h1 class="mt-3 text-xl font-semibold tracking-tight text-zinc-900">Sign in</h1>
			<p class="mt-1 text-sm text-zinc-500">Enter your name and the shared password.</p>
		</div>

		<label class="block space-y-1.5">
			<span class="text-sm font-medium text-zinc-700">Username</span>
			<input
				name="username"
				type="text"
				autocomplete="username"
				required
				value={form?.username ?? ''}
				class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
			/>
		</label>

		<label class="block space-y-1.5">
			<span class="text-sm font-medium text-zinc-700">Password</span>
			<input
				name="password"
				type="password"
				autocomplete="current-password"
				required
				class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
			/>
		</label>

		{#if form?.error}
			<p class="text-sm text-red-600">{form.error}</p>
		{/if}

		<button
			type="submit"
			class="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
		>
			Sign in
		</button>
	</form>
</div>
