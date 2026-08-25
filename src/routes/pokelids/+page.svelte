<script lang="ts">
	import PokeLidMap from '$lib/components/PokeLidMap.svelte';
	import type { CustomManholeLid } from '$lib/custom-manhole-lids';
	import {
		DISPLAY_POKE_LIDS,
		POKE_LID_COUNT,
		POKE_LID_PREFECTURES,
		customLidToDisplay,
		type DisplayLid,
		type PokeLidStamp
	} from '$lib/poke-lids';
	import { compressStampImage } from '$lib/stamp-image';

	let { data } = $props();

	// svelte-ignore state_referenced_locally -- seed editable client state from the SSR payload
	let stamps = $state<PokeLidStamp[]>([...data.stamps]);
	// svelte-ignore state_referenced_locally -- seed editable client state from the SSR payload
	let customLids = $state<CustomManholeLid[]>([...data.customLids]);
	let selectedId = $state<string | null>(null);
	let query = $state('');
	let prefectureFilter = $state('all');
	let stampFilter = $state<'all' | 'stamped' | 'unstamped'>('all');
	let kindFilter = $state<'all' | 'pokemon' | 'custom'>('all');
	let saving = $state(false);
	let saveError = $state('');
	let noteDraft = $state('');
	let stampImageUrl = $state<string | null>(null);
	let fileInput: HTMLInputElement | undefined = $state();

	let placing = $state(false);
	let draftPoint = $state<{ lat: number; lng: number } | null>(null);
	let draftName = $state('');
	let draftDescription = $state('');
	let draftAddress = $state('');
	let draftPrefecture = $state('');

	const stampedMap = $derived(new Map(stamps.map((stamp) => [stamp.lidId, stamp])));
	const stampedIds = $derived(new Set(stamps.map((stamp) => stamp.lidId)));

	const allLids = $derived<DisplayLid[]>([
		...customLids.map(customLidToDisplay),
		...DISPLAY_POKE_LIDS
	]);

	const pokeStampedCount = $derived(
		stamps.filter((stamp) => !stamp.lidId.startsWith('custom-')).length
	);
	const customStampedCount = $derived(
		stamps.filter((stamp) => stamp.lidId.startsWith('custom-')).length
	);
	const percent = $derived(Math.round((pokeStampedCount / POKE_LID_COUNT) * 100));

	const selected = $derived(
		selectedId ? (allLids.find((lid) => lid.id === selectedId) ?? null) : null
	);
	const selectedStamp = $derived(selectedId ? (stampedMap.get(selectedId) ?? null) : null);

	const prefectureOptions = $derived.by(() => {
		const prefs = new Set(POKE_LID_PREFECTURES);
		for (const lid of customLids) {
			if (lid.prefecture?.trim()) prefs.add(lid.prefecture.trim());
		}
		if (customLids.some((lid) => !lid.prefecture?.trim())) prefs.add('Custom');
		return [...prefs];
	});

	const filteredLids = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return allLids.filter((lid) => {
			if (kindFilter !== 'all' && lid.kind !== kindFilter) return false;
			if (prefectureFilter !== 'all' && lid.prefecture !== prefectureFilter) return false;
			const stamped = stampedIds.has(lid.id);
			if (stampFilter === 'stamped' && !stamped) return false;
			if (stampFilter === 'unstamped' && stamped) return false;
			if (!q) return true;
			const hay = [lid.title, lid.subtitle, lid.prefecture, lid.address, lid.description ?? '']
				.join(' ')
				.toLowerCase();
			return hay.includes(q);
		});
	});

	const grouped = $derived.by(() => {
		const groups = new Map<string, DisplayLid[]>();
		for (const lid of filteredLids) {
			const key = lid.kind === 'custom' ? 'Custom' : lid.prefecture;
			const list = groups.get(key) ?? [];
			list.push(lid);
			groups.set(key, list);
		}
		return [...groups.entries()].sort(([a], [b]) => {
			if (a === 'Custom') return -1;
			if (b === 'Custom') return 1;
			return a.localeCompare(b);
		});
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
		if (placing) cancelPlacing();
		selectedId = id;
		saveError = '';
	}

	function startPlacing(): void {
		placing = true;
		selectedId = null;
		draftPoint = null;
		draftName = '';
		draftDescription = '';
		draftAddress = '';
		draftPrefecture = '';
		saveError = '';
	}

	function cancelPlacing(): void {
		placing = false;
		draftPoint = null;
	}

	function onMapClick(point: { lat: number; lng: number }): void {
		draftPoint = point;
	}

	async function createCustomLid(): Promise<void> {
		if (!draftPoint) {
			saveError = 'Click the map to set a location first';
			return;
		}
		const name = draftName.trim();
		if (!name) {
			saveError = 'Give this lid a name';
			return;
		}

		saving = true;
		saveError = '';
		try {
			const res = await fetch('/api/custom-manhole-lids', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					name,
					description: draftDescription.trim() || null,
					address: draftAddress.trim() || null,
					prefecture: draftPrefecture.trim() || null,
					lat: draftPoint.lat,
					lng: draftPoint.lng
				})
			});
			if (!res.ok) {
				throw new Error((await res.text()) || 'Could not save custom lid');
			}
			const body = (await res.json()) as { lid: CustomManholeLid };
			customLids = [body.lid, ...customLids];
			placing = false;
			draftPoint = null;
			selectedId = body.lid.id;
		} catch (err) {
			saveError = err instanceof Error ? err.message : 'Could not save custom lid';
		} finally {
			saving = false;
		}
	}

	async function deleteCustomLid(): Promise<void> {
		if (!selected || selected.kind !== 'custom') return;
		if (!confirm(`Delete “${selected.title}”? Its stamp will be removed too.`)) return;

		saving = true;
		saveError = '';
		try {
			const res = await fetch(`/api/custom-manhole-lids/${selected.id}`, {
				method: 'DELETE'
			});
			if (!res.ok) {
				throw new Error((await res.text()) || 'Could not delete custom lid');
			}
			const id = selected.id;
			customLids = customLids.filter((lid) => lid.id !== id);
			stamps = stamps.filter((stamp) => stamp.lidId !== id);
			selectedId = null;
			stampImageUrl = null;
			noteDraft = '';
		} catch (err) {
			saveError = err instanceof Error ? err.message : 'Could not delete custom lid';
		} finally {
			saving = false;
		}
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

	async function saveNote(): Promise<void> {
		if (!selectedStamp) {
			await saveStamp({ note: noteDraft });
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
				Stamp-rally map of Pokémon manhole covers — plus any other lids you add. Tap a lid,
				add your photo, and collect stamps together.
			</p>
		</div>
		<div class="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
			<span class="tabular-nums font-medium text-zinc-900"
				>{pokeStampedCount}/{POKE_LID_COUNT}</span
			>
			<span class="hidden sm:inline">Poké ({percent}%)</span>
			{#if customLids.length > 0}
				<span class="tabular-nums text-zinc-500">
					· {customStampedCount}/{customLids.length} custom
				</span>
			{/if}
			{#if saving}
				<span class="text-zinc-400">Saving…</span>
			{/if}
			<button
				type="button"
				class="rounded-md bg-zinc-900 px-2.5 py-1.5 text-sm text-white hover:bg-zinc-800 disabled:opacity-40"
				disabled={placing || saving}
				onclick={startPlacing}
			>
				Add custom lid
			</button>
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
					lids={allLids}
					{stampedIds}
					{selectedId}
					{placing}
					{draftPoint}
					onSelect={selectLid}
					onMapClick={onMapClick}
				/>
			</div>

			{#if placing}
				<article class="rounded-xl border border-blue-200 bg-white p-4 sm:p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p class="text-xs font-medium tracking-wide text-blue-700 uppercase">
								New custom lid
							</p>
							<h2 class="mt-1 text-lg font-semibold text-zinc-900">Non-Pokémon manhole</h2>
							<p class="mt-0.5 text-sm text-zinc-600">
								{#if draftPoint}
									Pinned at {draftPoint.lat.toFixed(5)}, {draftPoint.lng.toFixed(5)} — click
									again to move.
								{:else}
									Click the map to drop a pin, then fill in the details.
								{/if}
							</p>
						</div>
						<button
							type="button"
							class="rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
							onclick={cancelPlacing}
						>
							Cancel
						</button>
					</div>

					<div class="mt-4 grid gap-3 sm:grid-cols-2">
						<label class="block text-sm sm:col-span-2">
							<span class="mb-1 block font-medium text-zinc-700">Name</span>
							<input
								class="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
								placeholder="e.g. City crest lid near station"
								bind:value={draftName}
							/>
						</label>
						<label class="block text-sm">
							<span class="mb-1 block font-medium text-zinc-700">Prefecture</span>
							<input
								class="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
								placeholder="Optional"
								list="prefecture-suggestions"
								bind:value={draftPrefecture}
							/>
						</label>
						<label class="block text-sm">
							<span class="mb-1 block font-medium text-zinc-700">Address</span>
							<input
								class="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
								placeholder="Optional"
								bind:value={draftAddress}
							/>
						</label>
						<label class="block text-sm sm:col-span-2">
							<span class="mb-1 block font-medium text-zinc-700">Description</span>
							<textarea
								class="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
								rows="2"
								placeholder="What the lid shows, tips…"
								bind:value={draftDescription}
							></textarea>
						</label>
					</div>

					<datalist id="prefecture-suggestions">
						{#each POKE_LID_PREFECTURES as pref (pref)}
							<option value={pref}></option>
						{/each}
					</datalist>

					<div class="mt-4 flex flex-wrap gap-2">
						<button
							type="button"
							class="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-40"
							disabled={saving || !draftPoint || !draftName.trim()}
							onclick={() => void createCustomLid()}
						>
							Save custom lid
						</button>
					</div>
				</article>
			{:else if selected}
				<article class="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<p
								class={`text-xs font-medium tracking-wide uppercase ${
									selectedStamp
										? 'text-amber-700'
										: selected.kind === 'custom'
											? 'text-blue-700'
											: 'text-zinc-500'
								}`}
							>
								{#if selectedStamp}
									Stamped
								{:else if selected.kind === 'custom'}
									Custom lid · not stamped yet
								{:else}
									Not stamped yet
								{/if}
							</p>
							<h2 class="mt-1 text-lg font-semibold text-zinc-900">{selected.title}</h2>
							<p class="mt-0.5 text-sm text-zinc-600">
								{#if selected.kind === 'custom'}
									{selected.prefecture}
									{#if selected.address && selected.address !== selected.prefecture}
										· {selected.address}
									{/if}
								{:else}
									{selected.prefecture} · {selected.subtitle}
								{/if}
							</p>
							{#if selected.kind === 'pokemon' && selected.address}
								<p class="mt-1 text-xs text-zinc-500">{selected.address}</p>
							{/if}
							{#if selected.description}
								<p class="mt-2 text-sm text-zinc-600">{selected.description}</p>
							{/if}
						</div>
						<div class="flex shrink-0 flex-wrap gap-2">
							{#if selected.detailUrl}
								<a
									href={selected.detailUrl}
									target="_blank"
									rel="noreferrer"
									class="rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
								>
									Official page
								</a>
							{/if}
							{#if selected.kind === 'custom'}
								<button
									type="button"
									class="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-40"
									disabled={saving}
									onclick={() => void deleteCustomLid()}
								>
									Delete lid
								</button>
							{/if}
						</div>
					</div>

					<div
						class={`mt-4 grid gap-4 ${selected.kind === 'pokemon' ? 'sm:grid-cols-2' : ''}`}
					>
						{#if selected.kind === 'pokemon'}
							<div class="overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50">
								{#if selected.imageUrl}
									<img
										src={selected.imageUrl}
										alt={`Official Poké Lid art for ${selected.title}`}
										class="aspect-square w-full object-cover"
										loading="lazy"
									/>
								{:else}
									<div
										class="flex aspect-square items-center justify-center text-sm text-zinc-400"
									>
										No official image
									</div>
								{/if}
								<p class="px-2 py-1.5 text-[11px] text-zinc-500">Official lid</p>
							</div>
						{/if}

						<div class="overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50">
							{#if stampImageUrl}
								<img
									src={stampImageUrl}
									alt="Stamp you collected here"
									class="aspect-square w-full object-cover"
								/>
							{:else}
								<div
									class="flex aspect-square items-center justify-center px-4 text-center text-sm text-zinc-400"
								>
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
					Select a lid on the map or in the list to stamp it — or add a custom non-Pokémon lid.
				</div>
			{/if}
		</section>

		<aside class="rounded-xl border border-zinc-200 bg-white p-4">
			<div class="space-y-2">
				<input
					type="search"
					placeholder="Search Pokémon, city, custom lids…"
					class="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
					bind:value={query}
				/>
				<div class="grid grid-cols-2 gap-2">
					<select
						class="rounded-md border border-zinc-200 bg-white px-2 py-2 text-sm"
						bind:value={prefectureFilter}
					>
						<option value="all">All prefectures</option>
						{#each prefectureOptions as pref (pref)}
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
				<select
					class="w-full rounded-md border border-zinc-200 bg-white px-2 py-2 text-sm"
					bind:value={kindFilter}
				>
					<option value="all">Poké + custom</option>
					<option value="pokemon">Poké Lids only</option>
					<option value="custom">Custom only</option>
				</select>
				<p class="text-xs text-zinc-500">
					Showing {filteredLids.length} of {allLids.length}
					{#if customLids.length > 0}
						({customLids.length} custom)
					{/if}
				</p>
			</div>

			<div class="mt-4 max-h-[min(70vh,42rem)] space-y-4 overflow-y-auto pr-1">
				{#if grouped.length === 0}
					<p class="text-sm text-zinc-500">No lids match these filters.</p>
				{:else}
					{#each grouped as [group, lids] (group)}
						<section>
							<h3
								class="sticky top-0 z-10 bg-white py-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase"
							>
								{group}
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
														: lid.kind === 'custom'
															? selectedId === lid.id
																? 'bg-blue-300'
																: 'bg-blue-500'
															: selectedId === lid.id
																? 'bg-zinc-400'
																: 'bg-zinc-300'
												}`}
												aria-hidden="true"
											></span>
											<span class="min-w-0">
												<span class="block truncate font-medium">{lid.title}</span>
												<span
													class={`block truncate text-xs ${
														selectedId === lid.id ? 'text-zinc-300' : 'text-zinc-500'
													}`}
												>
													{#if lid.kind === 'custom' && lid.prefecture !== 'Custom'}
														{lid.prefecture}
														{#if lid.address} · {lid.address}{/if}
													{:else}
														{lid.subtitle}
													{/if}
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
		Poké locations from the
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
		. Custom lids and stamps save to {data.persistence === 'turso' ? 'Turso' : 'local database'}.
		Map markers: red = Poké, blue = custom, amber = stamped.
	</p>
</div>
