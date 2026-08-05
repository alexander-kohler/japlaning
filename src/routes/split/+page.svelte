<script lang="ts">
	import { onMount } from 'svelte';
	import {
		convertToEur,
		currencyLabel,
		fetchCurrencies,
		formatEur,
		formatMoney,
		type Currency
	} from '$lib/currency';
	import { computeBalances, computeSettlements, type Expense, type Person } from '$lib/expenses';

	let { data } = $props();

	let people = $state<Person[]>([]);
	let expenses = $state<Expense[]>([]);
	let persistence = $state<'turso' | 'local'>('local');
	let currencies = $state<Currency[]>([]);
	let currenciesError = $state('');
	let currenciesLoading = $state(true);
	let formError = $state('');
	let converting = $state(false);
	let saving = $state(false);

	let newPersonName = $state('');
	let managingPeople = $state(false);
	let editingExpenseId = $state<string | null>(null);
	let description = $state('');
	let amount = $state('');
	let currency = $state('EUR');
	let occurredAt = $state(toDatetimeLocalValue(new Date()));
	let paidBy = $state('');
	let splitAmong = $state<string[]>([]);
	let expenseFormEl = $state<HTMLFormElement | null>(null);

	const balances = $derived(computeBalances(people, expenses));
	const settlements = $derived(computeSettlements(balances));
	const totalEur = $derived(
		expenses
			.filter((expense) => !isPersonToPersonPayment(expense))
			.reduce((sum, expense) => sum + (expense.amountEur || 0), 0)
	);
	const expensesByDate = $derived(groupExpensesByDate(expenses));

	/** A paid B only — settlement/transfer, not shared spending. */
	function isPersonToPersonPayment(expense: Expense): boolean {
		return expense.splitAmong.length === 1 && expense.splitAmong[0] !== expense.paidBy;
	}

	function toDatetimeLocalValue(date: Date): string {
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}

	function expenseDateKey(iso: string): string {
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return 'unknown';
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	}

	function formatExpenseDay(iso: string): string {
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return 'Unknown date';
		return new Intl.DateTimeFormat(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		}).format(date);
	}

	function groupExpensesByDate(
		list: Expense[]
	): { key: string; label: string; expenses: Expense[] }[] {
		const groups = new Map<string, { key: string; label: string; expenses: Expense[] }>();

		for (const expense of list) {
			const key = expenseDateKey(expense.createdAt);
			const existing = groups.get(key);
			if (existing) {
				existing.expenses.push(expense);
			} else {
				groups.set(key, {
					key,
					label: formatExpenseDay(expense.createdAt),
					expenses: [expense]
				});
			}
		}

		return [...groups.values()];
	}

	$effect(() => {
		people = data.people;
		expenses = data.expenses;
		persistence = data.persistence;
	});

	// Seed form defaults separately so paidBy/splitAmong updates after save
	// don't re-run the data sync and wipe locally added expenses.
	$effect(() => {
		if (!paidBy && people[0]) paidBy = people[0].id;
		if (!splitAmong.length && people.length) {
			splitAmong = people.map((person) => person.id);
		}
	});

	onMount(async () => {
		try {
			currencies = await fetchCurrencies();
			if (!currencies.some((c) => c.iso_code === currency)) {
				currency = currencies.some((c) => c.iso_code === 'EUR')
					? 'EUR'
					: (currencies[0]?.iso_code ?? 'EUR');
			}
		} catch (error) {
			console.error(error);
			currenciesError = 'Could not load currencies from Frankfurter. Using local EUR / JPY list.';
			currencies = [
				{ iso_code: 'EUR', name: 'Euro', symbol: '€' },
				{ iso_code: 'JPY', name: 'Japanese Yen', symbol: '¥' }
			];
		} finally {
			currenciesLoading = false;
		}
	});

	$effect(() => {
		if (!managingPeople) return;
		function onKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') managingPeople = false;
		}
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});

	async function readError(response: Response): Promise<string> {
		try {
			const payload = (await response.json()) as { message?: string };
			if (payload.message) return payload.message;
		} catch {
			// ignore parse errors
		}
		return `Request failed (${response.status})`;
	}

	async function addPerson(): Promise<void> {
		const name = newPersonName.trim();
		if (!name) return;

		saving = true;
		formError = '';
		try {
			const response = await fetch('/api/people', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name })
			});
			if (!response.ok) {
				formError = await readError(response);
				return;
			}

			const payload = (await response.json()) as { person: Person };
			people = [...people, payload.person];
			splitAmong = [...splitAmong, payload.person.id];
			if (!paidBy) paidBy = payload.person.id;
			newPersonName = '';
		} catch (error) {
			console.error(error);
			formError = 'Could not save person. Check the database connection.';
		} finally {
			saving = false;
		}
	}

	async function removePerson(id: string): Promise<void> {
		const person = people.find((p) => p.id === id);
		const name = person?.name ?? 'this person';
		if (
			!confirm(
				`Remove ${name} from the cost split? Their expenses will stay, but they will no longer be included.`
			)
		) {
			return;
		}

		saving = true;
		formError = '';
		try {
			const response = await fetch(`/api/people/${id}`, { method: 'DELETE' });
			if (!response.ok) {
				formError = await readError(response);
				return;
			}

			people = people.filter((p) => p.id !== id);
			splitAmong = splitAmong.filter((personId) => personId !== id);
			if (paidBy === id) paidBy = people[0]?.id ?? '';
		} catch (error) {
			console.error(error);
			formError = 'Could not remove person. Check the database connection.';
		} finally {
			saving = false;
		}
	}

	function toggleSplit(id: string): void {
		if (splitAmong.includes(id)) {
			splitAmong = splitAmong.filter((personId) => personId !== id);
		} else {
			splitAmong = [...splitAmong, id];
		}
	}

	function selectAllSplit(): void {
		splitAmong = people.map((person) => person.id);
	}

	function personName(id: string): string {
		return people.find((person) => person.id === id)?.name ?? 'Unknown';
	}

	function formatExpenseSplit(expense: Expense): string {
		const payer = personName(expense.paidBy);
		const splitIds = new Set(expense.splitAmong);
		const isEverybody =
			people.length > 0 &&
			people.every((person) => splitIds.has(person.id)) &&
			expense.splitAmong.length === people.length;

		if (isEverybody) return `${payer} → Everybody`;

		const recipients = expense.splitAmong.map(personName).join(', ');
		return `${payer} → ${recipients}`;
	}

	function resetExpenseForm(): void {
		editingExpenseId = null;
		description = '';
		amount = '';
		occurredAt = toDatetimeLocalValue(new Date());
		paidBy = people[0]?.id ?? '';
		splitAmong = people.map((person) => person.id);
	}

	function startEdit(expense: Expense): void {
		formError = '';
		editingExpenseId = expense.id;
		description = expense.description;
		amount = String(expense.amount);
		currency = expense.currency;
		occurredAt = toDatetimeLocalValue(new Date(expense.createdAt));
		paidBy = expense.paidBy;
		splitAmong = [...expense.splitAmong];
		expenseFormEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function cancelEdit(): void {
		formError = '';
		resetExpenseForm();
	}

	async function saveExpense(): Promise<void> {
		formError = '';
		const desc = description.trim();
		const parsedAmount = Number(amount);
		const when = new Date(occurredAt);

		converting = true;
		try {
			const amountEur = await convertToEur(parsedAmount, currency);
			const body = {
				description: desc,
				amount: parsedAmount,
				currency: currency.toUpperCase(),
				amountEur,
				paidBy,
				splitAmong,
				createdAt: when.toISOString()
			};

			const response = await fetch(
				editingExpenseId ? `/api/expenses/${editingExpenseId}` : '/api/expenses',
				{
					method: editingExpenseId ? 'PUT' : 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(body)
				}
			);

			if (!response.ok) {
				formError = await readError(response);
				return;
			}

			const payload = (await response.json()) as { expense: Expense };
			if (editingExpenseId) {
				expenses = expenses
					.map((expense) => (expense.id === payload.expense.id ? payload.expense : expense))
					.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
			} else {
				expenses = [payload.expense, ...expenses].sort((a, b) =>
					b.createdAt.localeCompare(a.createdAt)
				);
			}
			resetExpenseForm();
		} catch (error) {
			console.error(error);
			formError = `Could not save expense or convert ${currency} to EUR.`;
		} finally {
			converting = false;
		}
	}

	async function removeExpense(id: string): Promise<void> {
		saving = true;
		formError = '';
		try {
			const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
			if (!response.ok) {
				formError = await readError(response);
				return;
			}
			expenses = expenses.filter((expense) => expense.id !== id);
			if (editingExpenseId === id) resetExpenseForm();
		} catch (error) {
			console.error(error);
			formError = 'Could not remove expense. Check the database connection.';
		} finally {
			saving = false;
		}
	}

	async function clearAll(): Promise<void> {
		if (!confirm('Clear all people and expenses?')) return;

		saving = true;
		formError = '';
		try {
			const response = await fetch('/api/split', { method: 'DELETE' });
			if (!response.ok) {
				formError = await readError(response);
				return;
			}
			people = [];
			expenses = [];
			editingExpenseId = null;
			description = '';
			amount = '';
			occurredAt = toDatetimeLocalValue(new Date());
			paidBy = '';
			splitAmong = [];
		} catch (error) {
			console.error(error);
			formError = 'Could not clear data. Check the database connection.';
		} finally {
			saving = false;
		}
	}
</script>

<main class="mx-auto max-w-5xl px-3 py-6 sm:px-4">
	<header class="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-6">
		<div class="min-w-0">
			<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">Cost split</h1>
			<p class="mt-1 text-sm text-zinc-500">Track shared expenses and settle up in EUR.</p>
			{#if persistence === 'local'}
				<p class="mt-2 text-xs text-zinc-400">
					Local SQLite — set
					<code class="rounded bg-zinc-100 px-1 py-0.5">TURSO_DATABASE_URL</code>
					and
					<code class="rounded bg-zinc-100 px-1 py-0.5">TURSO_AUTH_TOKEN</code>
					for cloud sync.
				</p>
			{:else}
				<p class="mt-2 text-xs font-medium text-emerald-700">Connected to Turso</p>
			{/if}
		</div>
		{#if expenses.length}
			<div class="text-right">
				<p class="text-xs font-medium uppercase tracking-wide text-zinc-500">Total spent</p>
				<p class="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">
					{formatEur(totalEur)}
				</p>
			</div>
		{/if}
	</header>

	{#if formError}
		<p class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
			{formError}
		</p>
	{/if}
	{#if currenciesError}
		<p class="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
			{currenciesError}
		</p>
	{/if}

	<div class="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
		<div class="space-y-8">
			<div>
				<button
					type="button"
					class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
					onclick={() => (managingPeople = true)}
				>
					Manage people
				</button>
			</div>

			<section aria-labelledby="expense-heading">
				<div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
					<h2 id="expense-heading" class="text-lg font-semibold text-zinc-900">
						{editingExpenseId ? 'Edit expense' : 'Add expense'}
					</h2>
					{#if editingExpenseId}
						<button
							type="button"
							class="text-sm text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
							onclick={cancelEdit}
						>
							Cancel
						</button>
					{/if}
				</div>

				<form
					bind:this={expenseFormEl}
					class="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto]"
					onsubmit={(event) => {
						event.preventDefault();
						void saveExpense();
					}}
				>
					<input
						class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 sm:col-span-2"
						type="text"
						name="description"
						placeholder="Dinner, train tickets, hotel…"
						aria-label="Description"
						bind:value={description}
						required
						disabled={!people.length || converting}
					/>

					<input
						class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500"
						type="number"
						name="amount"
						inputmode="decimal"
						placeholder="Amount"
						aria-label="Amount"
						min="0.01"
						step="0.01"
						bind:value={amount}
						required
						disabled={!people.length || converting}
					/>

					<select
						class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500"
						name="currency"
						aria-label="Currency"
						bind:value={currency}
						required
						disabled={currenciesLoading || !people.length || converting}
					>
						{#if currenciesLoading}
							<option value={currency}>Loading…</option>
						{:else}
							{#each currencies as c (c.iso_code)}
								<option value={c.iso_code}>{currencyLabel(c)}</option>
							{/each}
						{/if}
					</select>

					<input
						class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 sm:col-span-2"
						type="datetime-local"
						name="occurredAt"
						aria-label="Date and time"
						bind:value={occurredAt}
						required
						disabled={!people.length || converting}
					/>

					<div class="flex flex-wrap items-center gap-2 sm:col-span-2">
						<select
							class="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 sm:flex-none"
							name="paidBy"
							aria-label="Paid by"
							bind:value={paidBy}
							required
							disabled={!people.length || converting}
						>
							{#if !people.length}
								<option value="">Paid by</option>
							{/if}
							{#each people as person (person.id)}
								<option value={person.id}>{person.name}</option>
							{/each}
						</select>

						<span class="text-zinc-400" aria-hidden="true">→</span>

						{#if people.length}
							<input
								class="sr-only"
								type="text"
								name="splitAmong"
								value={splitAmong.length ? 'ok' : ''}
								required
								tabindex="-1"
								aria-label="Select at least one person to split among"
							/>
							<div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
								{#each people as person (person.id)}
									<label
										class={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 text-sm transition ${
											splitAmong.includes(person.id)
												? 'border-sky-300 bg-sky-50 text-sky-900'
												: 'border-zinc-200 bg-zinc-50 text-zinc-700'
										}`}
									>
										<input
											class="accent-sky-600"
											type="checkbox"
											checked={splitAmong.includes(person.id)}
											onchange={() => toggleSplit(person.id)}
										/>
										{person.name}
									</label>
								{/each}
								{#if people.length > 1}
									<button
										type="button"
										class="px-1 text-xs text-zinc-400 underline-offset-2 hover:text-zinc-700 hover:underline"
										onclick={selectAllSplit}
									>
										All
									</button>
								{/if}
							</div>
						{:else}
							<p class="text-sm text-zinc-500">Add people first</p>
						{/if}
					</div>

					<div class="flex flex-wrap gap-2 sm:col-span-2">
						<button
							type="submit"
							class="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
							disabled={!people.length || converting}
						>
							{converting ? 'Saving…' : editingExpenseId ? 'Save changes' : 'Add expense'}
						</button>
						{#if editingExpenseId}
							<button
								type="button"
								class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 sm:w-auto"
								disabled={converting}
								onclick={cancelEdit}
							>
								Cancel
							</button>
						{/if}
					</div>
				</form>
			</section>
		</div>

		<aside class="space-y-6 lg:sticky lg:top-4">
			<section
				class="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
				aria-labelledby="settle-heading"
			>
				<h2 id="settle-heading" class="text-lg font-semibold text-zinc-900">Who owes whom</h2>
				<p class="mt-1 text-sm text-zinc-500">Suggested transfers to settle up.</p>

				{#if settlements.length === 0}
					<p
						class="mt-4 rounded-md border border-dashed border-zinc-200 bg-zinc-50 px-3 py-6 text-center text-sm text-zinc-500"
					>
						{expenses.length
							? 'Everyone is settled up.'
							: 'Settlements appear after expenses are added.'}
					</p>
				{:else}
					<ul class="mt-4 space-y-2">
						{#each settlements as settlement, index (`${settlement.fromId}-${settlement.toId}-${index}`)}
							<li
								class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-amber-950"
							>
								<p class="text-sm">
									<span class="font-semibold">{settlement.fromName}</span>
									<span class="text-amber-800/80"> → </span>
									<span class="font-semibold">{settlement.toName}</span>
								</p>
								<p class="text-base font-semibold tabular-nums">
									{formatEur(settlement.amountEur)}
								</p>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<section aria-labelledby="balances-heading">
				<div class="mb-2">
					<h2
						id="balances-heading"
						class="text-sm font-semibold uppercase tracking-wide text-zinc-500"
					>
						Balances
					</h2>
					<p class="mt-1 text-xs text-zinc-400">Positive = owed money · Negative = owes money</p>
				</div>

				{#if people.length === 0}
					<p class="text-sm text-zinc-500">Add people to see balances.</p>
				{:else}
					<ul
						class="divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 bg-white"
					>
						{#each balances as balance (balance.personId)}
							<li class="flex items-center justify-between px-3 py-2.5 text-sm">
								<span class="font-medium text-zinc-800">{balance.name}</span>
								<span
									class={`tabular-nums ${
										balance.netEur > 0.005
											? 'font-semibold text-emerald-700'
											: balance.netEur < -0.005
												? 'font-semibold text-red-700'
												: 'text-zinc-400'
									}`}
								>
									{formatEur(balance.netEur)}
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</aside>
	</div>

	<section class="mt-10 border-t border-zinc-200 pt-8" aria-labelledby="list-heading">
		<div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
			<div>
				<h2 id="list-heading" class="text-lg font-semibold text-zinc-900">Expenses</h2>
				<p class="mt-0.5 text-sm text-zinc-500">Newest first</p>
			</div>
			{#if expenses.length}
				<p class="text-sm text-zinc-500">
					{expenses.length}
					{expenses.length === 1 ? 'entry' : 'entries'}
				</p>
			{/if}
		</div>

		{#if expenses.length === 0}
			<p
				class="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500"
			>
				No expenses yet.
			</p>
		{:else}
			<div class="space-y-4">
				{#each expensesByDate as group (group.key)}
					<section aria-labelledby={`expense-day-${group.key}`}>
						<h3
							id={`expense-day-${group.key}`}
							class="mb-2 px-0.5 text-xs font-semibold uppercase tracking-wide text-zinc-500"
						>
							{group.label}
						</h3>
						<ul
							class="divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
						>
							{#each group.expenses as expense (expense.id)}
								<li
									class={`flex gap-3 px-4 py-3.5 ${
										editingExpenseId === expense.id ? 'bg-sky-50/60' : ''
									}`}
								>
									<div class="min-w-0 flex-1">
										<div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
											<p class="font-medium text-zinc-900">{expense.description}</p>
											<p class="shrink-0 text-sm font-semibold tabular-nums text-zinc-900">
												{formatMoney(expense.amount, expense.currency)}
												{#if expense.currency !== 'EUR'}
													<span class="font-normal text-zinc-400"
														>· {formatEur(expense.amountEur)}</span
													>
												{/if}
											</p>
										</div>
										<p class="mt-1 truncate text-sm text-zinc-500">
											{formatExpenseSplit(expense)}
										</p>
									</div>
									<div class="flex shrink-0 gap-3 self-start pt-0.5">
										<button
											type="button"
											class="text-sm text-zinc-500 hover:text-zinc-900 disabled:opacity-60"
											disabled={saving || converting}
											onclick={() => startEdit(expense)}
										>
											Edit
										</button>
										<button
											type="button"
											class="text-sm text-zinc-400 hover:text-red-600 disabled:opacity-60"
											disabled={saving}
											onclick={() => void removeExpense(expense.id)}
										>
											Remove
										</button>
									</div>
								</li>
							{/each}
						</ul>
					</section>
				{/each}
			</div>
		{/if}
	</section>
</main>

{#if managingPeople}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 p-4 sm:items-center"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) managingPeople = false;
		}}
	>
		<div
			class="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-lg"
			role="dialog"
			aria-modal="true"
			aria-labelledby="people-modal-heading"
			tabindex="-1"
		>
			<div class="mb-4 flex items-start justify-between gap-3">
				<div>
					<h2 id="people-modal-heading" class="text-lg font-semibold text-zinc-900">
						Manage people
					</h2>
					<p class="mt-1 text-sm text-zinc-500">Add or remove people from the cost split.</p>
				</div>
				<button
					type="button"
					class="rounded-md px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
					aria-label="Close"
					onclick={() => (managingPeople = false)}
				>
					×
				</button>
			</div>

			<form
				class="flex flex-col gap-2 sm:flex-row"
				onsubmit={(event) => {
					event.preventDefault();
					void addPerson();
				}}
			>
				<input
					class="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500"
					type="text"
					name="name"
					placeholder="Name"
					bind:value={newPersonName}
					autocomplete="off"
					required
					disabled={saving}
				/>
				<button
					type="submit"
					class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60"
					disabled={saving}
				>
					Add
				</button>
			</form>

			{#if people.length}
				<ul class="mt-4 flex flex-wrap gap-2">
					{#each people as person (person.id)}
						<li
							class="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-sm text-zinc-800"
						>
							{person.name}
							<button
								type="button"
								class="text-zinc-400 hover:text-red-600 disabled:opacity-60"
								aria-label={`Remove ${person.name}`}
								disabled={saving}
								onclick={() => void removePerson(person.id)}
							>
								×
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-4 text-sm text-zinc-500">Add at least two people to start splitting.</p>
			{/if}

			<div
				class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4"
			>
				{#if people.length || expenses.length}
					<button
						type="button"
						class="text-sm text-zinc-400 underline-offset-2 hover:text-red-600 hover:underline disabled:opacity-60"
						disabled={saving}
						onclick={() => void clearAll()}
					>
						Clear all
					</button>
				{:else}
					<span></span>
				{/if}
				<button
					type="button"
					class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
					onclick={() => (managingPeople = false)}
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}
