<script lang="ts">
	import PokeLidMap from '$lib/components/PokeLidMap.svelte';
	import {
		POKE_LID_COUNT,
		POKE_LID_PREFECTURES,
		POKE_LIDS,
		lidLabel,
		pokemonLabel,
		type PokeLid,
		type PokeLidStamp
	} from '$lib/poke-lids';
	import { compressStampImage } from '$lib/stamp-image';

	let { data } = $props();

	// svelte-ignore state_referenced_locally -- seed editable client state from the SSR payload
	let stamps = $state<PokeLidStamp[]>([...data.stamps]);
	let selectedId = $state<string | null>(null);
	let query = $state('');
	let prefectureFilter = $state('all');
	let stampFilter = $state<'all' | 'stamped' | 'unstamped'>('all');
	let saving = $state(false);
	let saveError = $state('');
	let noteDraft = $state('');
	let stampImageUrl = $state<string | null>(null);
	let fileInput: HTMLInputElement | undefined = $state();

	const stampedMap = $derived(new Map(stamps.map((stamp) => [stamp.lidId, stamp])));
	const stampedIds = $derived(new Set(stamps.map((stamp) => stamp.lidId)));
	const progress = $derived(stamps.length);
	const percent = $derived(Math.round((progress / POKE_LID_COUNT) * 100));

	const selected = $derived(
		selectedId ? (POKE_LIDS.find((lid) => lid.id === selectedId) ?? null) : null
	);
	const selectedStamp = $derived(selectedId ? (stampedMap.get(selectedId) ?? null) : null);

	const filteredLids = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return POKE_LIDS.filter((lid) => {
			if (prefectureFilter !== 'all' && lid.prefecture !== prefectureFilter) return false;
			const stamped = stampedIds.has(lid.id);
			if (stampFilter === 'stamped' && !stamped) return false;
			if (stampFilter === 'unstamped' && stamped) return false;
			if (!q) return true;
			const hay = [
				lid.prefecture,
				lid.city,
				lid.cityEn ?? '',
				lid.address,
				...lid.pokemon
			]
				.join(' ')
				.toLowerCase();
			return hay.includes(q);
		});
	});

	const grouped = $derived.by(() => {
		const groups = new Map<string, PokeLid[]>();
		for (const lid of filteredLids) {
			const list = groups.get(lid.prefecture) ?? [];
			list.push(lid);
			groups.set(lid.prefecture, list);
		}
		return [...groups.entries()];
	});

	$effect(() => {
		const id = selectedId;
		const stamp = id ? stampedMap.get(id) : null;
		noteDraft = stamp?.note ?? '';
		if (!id || !stamp?.hasImage) {
			stampImageUrl = null;
			return;
		}
		stampImageUrl = `/api/poke-lid-stamps/${id}/image?t=${encodeURIComponent(stamp.stampedAt)}`;
	});

	function selectLid(id: string): void {
		selectedId = id;
		saveError = '';
	}

	async function saveStamp(payload: {
		note?: string | null;
		imageMime?: string | null;
		imageData?: string | null;
		clearImage?: boolean;
	}): Promise<void> {
		if (!selectedId) return;
		saving = true;
		saveError = '';

		try {
			const res = await fetch('/api/poke-lid-stamps', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ lidId: selectedId, ...payload })
			});
			if (!res.ok) {
				throw new Error((await res.text()) || 'Could not save stamp');
			}
			const body = (await res.json()) as { stamp: PokeLidStamp };
			const next = stamps.filter((stamp) => stamp.lidId !== body.stamp.lidId);
			next.unshift(body.stamp);
			stamps = next;
		} catch (err) {
			saveError = err instanceof Error ? err.message : 'Could not save stamp';
		} finally {
			saving = false;
		}
	}

	async function stampWithoutPhoto(): Promise<void> {
		await saveStamp({ note: noteDraft });
	}

	async function saveNote(): Promise<void> {
		if (!selectedStamp) {
			await stampWithoutPhoto();
			return;
		}
		await saveStamp({ note: noteDraft });
	}

	async function onPhotoSelected(event: Event): Promise<void> {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file || !selectedId) return;

		saving = true;
		saveError = '';
		try {
			const compressed = await compressStampImage(file);
			await saveStamp({
				note: noteDraft,
				imageMime: compressed.mime,
				imageData: compressed.data
			});
		} catch (err) {
			saveError = err instanceof Error ? err.message : 'Could not process photo';
			saving = false;
		}
	}

	async function removeStamp(): Promise<void> {
		if (!selectedId || !selectedStamp) return;
		if (!confirm('Remove this stamp and photo?')) return;

		saving = true;
		saveError = '';
		try {
			const res = await fetch(`/api/poke-lid-stamps/${selectedId}`, { method: 'DELETE' });
			if (!res.ok) {
				throw new Error((await res.text()) || 'Could not remove stamp');
			}
			stamps = stamps.filter((stamp) => stamp.lidId !== selectedId);
			stampImageUrl = null;
			noteDraft = '';
		} catch (err) {
			saveError = err instanceof Error ? err.message : 'Could not remove stamp';
		} finally {
			saving = false;
		}
	}

	async function clearPhoto(): Promise<void> {
		if (!selectedStamp?.hasImage) return;
		await saveStamp({ note: noteDraft, clearImage: true });
		stampImageUrl = null;
	}
</script>

<svelte:head>
	<title>Poké Lids · Japlaning</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-3 py-6 sm:px-4">
	<header class="mb-6 flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-zinc-900">Poké Lids</h1>
			<p class="mt-1 max-w-2xl text-sm text-zinc-600">
				Stamp-rally map of Pokémon manhole covers across Japan. Tap a lid, add your photo, and
				collect stamps together.
			</p>
		</div>
		<div class="flex items-center gap-3 text-sm text-zinc-600">
			<span class="tabular-nums font-medium text-zinc-900">{progress}/{POKE_LID_COUNT}</span>
			<span class="hidden sm:inline">({percent}%)</span>
			{#if saving}
				<span class="text-zinc-400">Saving…</span>
			{/if}
		</div>
	</header>

	{#if saveError}
		<p class="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
			{saveError}
		</p>
	{/if}

	<div class="mb-4 h-1.5 overflow-hidden rounded-full bg-zinc-100" aria-hidden="true">
		<div
			class="h-full rounded-full bg-amber-500 transition-[width] duration-300"
			style={`width: ${percent}%`}
		></div>
	</div>

	<div class="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
		<section class="min-w-0 space-y-4">
			<div class="h-[min(58vh,34rem)] min-h-[320px]">
				<PokeLidMap
					lids={POKE_LIDS}
					{stampedIds}
					{selectedId}
					onSelect={selectLid}
				/>
			</div>

			{#if selected}
				<article class="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="text-xs font-medium tracking-wide text-amber-700 uppercase">
								{selectedStamp ? 'Stamped' : 'Not stamped yet'}
							</p>
							<h2 class="mt-1 text-lg font-semibold text-zinc-900">
								{pokemonLabel(selected)}
							</h2>
							<p class="mt-0.5 text-sm text-zinc-600">{lidLabel(selected)}</p>
							{#if selected.address}
								<p class="mt-1 text-xs text-zinc-500">{selected.address}</p>
							{/if}
						</div>
						{#if selected.detailUrl}
							<a
								href={selected.detailUrl}
								target="_blank"
								rel="noreferrer"
								class="shrink-0 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
							>
								Official page
							</a>
						{/if}
					</div>

					<div class="mt-4 grid gap-4 sm:grid-cols-2">
						<div class="overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50">
							{#if selected.imageUrl}
								<img
									src={selected.imageUrl}
									alt={`Official Poké Lid art for ${pokemonLabel(selected)}`}
									class="aspect-square w-full object-cover"
									loading="lazy"
								/>
							{:else}
								<div class="flex aspect-square items-center justify-center text-sm text-zinc-400">
									No official image
								</div>
							{/if}
							<p class="px-2 py-1.5 text-[11px] text-zinc-500">Official lid</p>
						</div>

						<div class="overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50">
							{#if stampImageUrl}
								<img
									src={stampImageUrl}
									alt="Stamp you collected here"
									class="aspect-square w-full object-cover"
								/>
							{:else}
								<div class="flex aspect-square items-center justify-center px-4 text-center text-sm text-zinc-400">
									Your photo will appear here
								</div>
							{/if}
							<p class="px-2 py-1.5 text-[11px] text-zinc-500">Your stamp photo</p>
						</div>
					</div>

					<div class="mt-4 space-y-3">
						<label class="block text-sm">
							<span class="mb-1 block font-medium text-zinc-700">Note</span>
							<textarea
								class="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
								rows="2"
								placeholder="Where you found it, weather, tip…"
								bind:value={noteDraft}
							></textarea>
						</label>

						<input
							bind:this={fileInput}
							type="file"
							accept="image/*"
							capture="environment"
							class="hidden"
							onchange={(event) => void onPhotoSelected(event)}
						/>

						<div class="flex flex-wrap gap-2">
							<button
								type="button"
								class="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-40"
								disabled={saving}
								onclick={() => fileInput?.click()}
							>
								{selectedStamp?.hasImage ? 'Replace photo' : 'Add photo & stamp'}
							</button>
							<button
								type="button"
								class="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
								disabled={saving}
								onclick={() => void saveNote()}
							>
								{selectedStamp ? 'Save note' : 'Stamp without photo'}
							</button>
							{#if selectedStamp?.hasImage}
								<button
									type="button"
									class="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
									disabled={saving}
									onclick={() => void clearPhoto()}
								>
									Remove photo
								</button>
							{/if}
							{#if selectedStamp}
								<button
									type="button"
									class="rounded-md border border-rose-200 bg-white px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-40"
									disabled={saving}
									onclick={() => void removeStamp()}
								>
									Remove stamp
								</button>
							{/if}
						</div>
					</div>
				</article>
			{:else}
				<div
					class="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500"
				>
					Select a lid on the map or in the list to stamp it.
				</div>
			{/if}
		</section>

		<aside class="rounded-xl border border-zinc-200 bg-white p-4">
			<div class="space-y-2">
				<input
					type="search"
					placeholder="Search Pokémon, city, address…"
					class="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
					bind:value={query}
				/>
				<div class="grid grid-cols-2 gap-2">
					<select
						class="rounded-md border border-zinc-200 bg-white px-2 py-2 text-sm"
						bind:value={prefectureFilter}
					>
						<option value="all">All prefectures</option>
						{#each POKE_LID_PREFECTURES as pref (pref)}
							<option value={pref}>{pref}</option>
						{/each}
					</select>
					<select
						class="rounded-md border border-zinc-200 bg-white px-2 py-2 text-sm"
						bind:value={stampFilter}
					>
						<option value="all">All lids</option>
						<option value="stamped">Stamped</option>
						<option value="unstamped">Not stamped</option>
					</select>
				</div>
				<p class="text-xs text-zinc-500">
					Showing {filteredLids.length} of {POKE_LID_COUNT}
				</p>
			</div>

			<div class="mt-4 max-h-[min(70vh,42rem)] space-y-4 overflow-y-auto pr-1">
				{#if grouped.length === 0}
					<p class="text-sm text-zinc-500">No lids match these filters.</p>
				{:else}
					{#each grouped as [pref, lids] (pref)}
						<section>
							<h3 class="sticky top-0 z-10 bg-white py-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
								{pref}
								<span class="font-normal text-zinc-400">· {lids.length}</span>
							</h3>
							<ul class="space-y-0.5">
								{#each lids as lid (lid.id)}
									{@const stamped = stampedIds.has(lid.id)}
									<li>
										<button
											type="button"
											class={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${
												selectedId === lid.id
													? 'bg-zinc-900 text-white'
													: 'hover:bg-zinc-50'
											}`}
											onclick={() => selectLid(lid.id)}
										>
											<span
												class={`mt-1.5 size-2 shrink-0 rounded-full ${
													stamped
														? selectedId === lid.id
															? 'bg-amber-300'
															: 'bg-amber-500'
														: selectedId === lid.id
															? 'bg-zinc-400'
															: 'bg-zinc-300'
												}`}
												aria-hidden="true"
											></span>
											<span class="min-w-0">
												<span class="block truncate font-medium">
													{pokemonLabel(lid)}
												</span>
												<span
													class={`block truncate text-xs ${
														selectedId === lid.id ? 'text-zinc-300' : 'text-zinc-500'
													}`}
												>
													{lid.cityEn ? `${lid.cityEn} · ${lid.city}` : lid.city}
												</span>
											</span>
										</button>
									</li>
								{/each}
							</ul>
						</section>
					{/each}
				{/if}
			</div>
		</aside>
	</div>

	<p class="mt-4 text-xs text-zinc-400">
		Locations from the
		<a
			class="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-700"
			href="https://www.google.com/mymaps/viewer?mid=1QPKuUgVDUhKN9KJVgS_WmnIpFDQqOLM&hl=de"
			target="_blank"
			rel="noreferrer"
		>
			Poké Lids My Map
		</a>
		and
		<a
			class="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-700"
			href="https://local.pokemon.jp/manhole/"
			target="_blank"
			rel="noreferrer"
		>
			Pokémon Local Acts
		</a>
		. Stamps save to {data.persistence === 'turso' ? 'Turso' : 'local database'}.
	</p>
</div>
