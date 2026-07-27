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
	import {
		computeBalances,
		computeSettlements,
		createId,
		loadState,
		saveState,
		type Expense,
		type Person
	} from '$lib/expenses';

	let people = $state<Person[]>([]);
	let expenses = $state<Expense[]>([]);
	let currencies = $state<Currency[]>([]);
	let currenciesError = $state('');
	let currenciesLoading = $state(true);
	let formError = $state('');
	let converting = $state(false);
	let hydrated = $state(false);

	let newPersonName = $state('');
	let description = $state('');
	let amount = $state('');
	let currency = $state('EUR');
	let paidBy = $state('');
	let splitAmong = $state<string[]>([]);

	const balances = $derived(computeBalances(people, expenses));
	const settlements = $derived(computeSettlements(balances));
	const totalEur = $derived(expenses.reduce((sum, expense) => sum + (expense.amountEur || 0), 0));

	onMount(async () => {
		const stored = loadState();
		people = stored.people;
		expenses = stored.expenses;
		hydrated = true;

		try {
			currencies = await fetchCurrencies();
			if (!currencies.some((c) => c.iso_code === currency)) {
				currency = currencies.some((c) => c.iso_code === 'EUR')
					? 'EUR'
					: (currencies[0]?.iso_code ?? 'EUR');
			}
		} catch (error) {
			console.error(error);
			currenciesError = 'Could not load currencies from Frankfurter. You can still use EUR.';
			currencies = [{ iso_code: 'EUR', name: 'Euro', symbol: '€' }];
		} finally {
			currenciesLoading = false;
		}
	});

	$effect(() => {
		if (!hydrated) return;
		saveState(people, expenses);
	});

	function addPerson(): void {
		const name = newPersonName.trim();
		if (!name) return;
		if (people.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
			formError = 'That person is already in the list.';
			return;
		}

		const person: Person = { id: createId(), name };
		people = [...people, person];
		splitAmong = [...splitAmong, person.id];
		if (!paidBy) paidBy = person.id;
		newPersonName = '';
		formError = '';
	}

	function removePerson(id: string): void {
		if (expenses.some((e) => e.paidBy === id || e.splitAmong.includes(id))) {
			formError = 'Remove expenses involving this person first.';
			return;
		}
		people = people.filter((p) => p.id !== id);
		splitAmong = splitAmong.filter((pid) => pid !== id);
		if (paidBy === id) paidBy = people[0]?.id ?? '';
		formError = '';
	}

	function toggleSplit(id: string): void {
		if (splitAmong.includes(id)) {
			splitAmong = splitAmong.filter((pid) => pid !== id);
		} else {
			splitAmong = [...splitAmong, id];
		}
	}

	function selectAllSplit(): void {
		splitAmong = people.map((p) => p.id);
	}

	function personName(id: string): string {
		return people.find((p) => p.id === id)?.name ?? 'Unknown';
	}

	async function addExpense(): Promise<void> {
		formError = '';
		const desc = description.trim();
		const parsedAmount = Number.parseFloat(amount.replace(',', '.'));

		if (!desc) {
			formError = 'Add a short description for the expense.';
			return;
		}
		if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
			formError = 'Enter a valid amount greater than zero.';
			return;
		}
		if (!paidBy) {
			formError = 'Choose who paid.';
			return;
		}
		if (!splitAmong.length) {
			formError = 'Select at least one person to split among.';
			return;
		}
		if (!currency) {
			formError = 'Choose a currency.';
			return;
		}

		converting = true;
		try {
			const amountEur = await convertToEur(parsedAmount, currency);
			const expense: Expense = {
				id: createId(),
				description: desc,
				amount: parsedAmount,
				currency: currency.toUpperCase(),
				amountEur,
				paidBy,
				splitAmong: [...splitAmong],
				createdAt: new Date().toISOString()
			};
			expenses = [expense, ...expenses];
			description = '';
			amount = '';
		} catch (error) {
			console.error(error);
			formError = `Could not convert ${currency} to EUR. Check the currency and try again.`;
		} finally {
			converting = false;
		}
	}

	function removeExpense(id: string): void {
		expenses = expenses.filter((e) => e.id !== id);
	}

	function clearAll(): void {
		if (!confirm('Clear all people and expenses?')) return;
		people = [];
		expenses = [];
		paidBy = '';
		splitAmong = [];
		formError = '';
	}
</script>

<main class="mx-auto max-w-4xl px-3 py-6 sm:px-4">
	<header class="mb-6">
		<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">Cost split</h1>
		<p class="mt-1 text-sm text-zinc-500">
			Add shared expenses in any currency. Amounts convert to euro via
			<a
				class="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-700"
				href="https://frankfurter.dev/"
				target="_blank"
				rel="noreferrer">Frankfurter</a
			>, then balances show who owes whom.
		</p>
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

	<section class="mb-8" aria-labelledby="people-heading">
		<div class="mb-3 flex items-end justify-between gap-3">
			<div>
				<h2 id="people-heading" class="text-lg font-semibold text-zinc-900">People</h2>
				<p class="text-sm text-zinc-500">Who is splitting costs on this trip.</p>
			</div>
			{#if people.length || expenses.length}
				<button
					type="button"
					class="text-sm text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
					onclick={clearAll}
				>
					Clear all
				</button>
			{/if}
		</div>

		<form
			class="flex flex-col gap-2 sm:flex-row"
			onsubmit={(event) => {
				event.preventDefault();
				addPerson();
			}}
		>
			<input
				class="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500"
				type="text"
				placeholder="Name"
				bind:value={newPersonName}
				autocomplete="off"
			/>
			<button
				type="submit"
				class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
			>
				Add person
			</button>
		</form>

		{#if people.length}
			<ul class="mt-3 flex flex-wrap gap-2">
				{#each people as person (person.id)}
					<li
						class="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-sm text-zinc-800"
					>
						{person.name}
						<button
							type="button"
							class="text-zinc-400 hover:text-red-600"
							aria-label={`Remove ${person.name}`}
							onclick={() => removePerson(person.id)}
						>
							×
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-3 text-sm text-zinc-500">Add at least two people to start splitting.</p>
		{/if}
	</section>

	<section class="mb-8" aria-labelledby="expense-heading">
		<h2 id="expense-heading" class="text-lg font-semibold text-zinc-900">Add expense</h2>
		<p class="mb-3 text-sm text-zinc-500">
			Record what was paid, in which currency, and who should share it.
		</p>

		<form
			class="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-2"
			onsubmit={(event) => {
				event.preventDefault();
				void addExpense();
			}}
		>
			<label class="block sm:col-span-2">
				<span class="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
					>Description</span
				>
				<input
					class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500"
					type="text"
					placeholder="Dinner, train tickets, hotel…"
					bind:value={description}
					disabled={!people.length}
				/>
			</label>

			<label class="block">
				<span class="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
					>Amount</span
				>
				<input
					class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500"
					type="text"
					inputmode="decimal"
					placeholder="0.00"
					bind:value={amount}
					disabled={!people.length}
				/>
			</label>

			<label class="block">
				<span class="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
					>Currency</span
				>
				<select
					class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500"
					bind:value={currency}
					disabled={currenciesLoading || !people.length}
				>
					{#if currenciesLoading}
						<option value={currency}>Loading…</option>
					{:else}
						{#each currencies as c (c.iso_code)}
							<option value={c.iso_code}>{currencyLabel(c)}</option>
						{/each}
					{/if}
				</select>
			</label>

			<label class="block sm:col-span-2">
				<span class="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
					>Paid by</span
				>
				<select
					class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500"
					bind:value={paidBy}
					disabled={!people.length}
				>
					{#each people as person (person.id)}
						<option value={person.id}>{person.name}</option>
					{/each}
				</select>
			</label>

			<fieldset class="sm:col-span-2">
				<div class="mb-2 flex items-center justify-between gap-2">
					<legend class="text-xs font-medium uppercase tracking-wide text-zinc-500">
						Split among
					</legend>
					{#if people.length}
						<button
							type="button"
							class="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
							onclick={selectAllSplit}
						>
							Select all
						</button>
					{/if}
				</div>
				{#if people.length}
					<div class="flex flex-wrap gap-2">
						{#each people as person (person.id)}
							<label
								class={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition ${
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
					</div>
				{:else}
					<p class="text-sm text-zinc-500">Add people first.</p>
				{/if}
			</fieldset>

			<div class="sm:col-span-2">
				<button
					type="submit"
					class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
					disabled={!people.length || converting}
				>
					{converting ? 'Converting…' : 'Add expense'}
				</button>
			</div>
		</form>
	</section>

	<section class="mb-8" aria-labelledby="list-heading">
		<div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
			<div>
				<h2 id="list-heading" class="text-lg font-semibold text-zinc-900">Expenses</h2>
				<p class="text-sm text-zinc-500">Original currency kept; euro used for settling up.</p>
			</div>
			{#if expenses.length}
				<p class="text-sm font-medium text-zinc-700">Total {formatEur(totalEur)}</p>
			{/if}
		</div>

		{#if expenses.length === 0}
			<p
				class="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500"
			>
				No expenses yet.
			</p>
		{:else}
			<ul
				class="divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
			>
				{#each expenses as expense (expense.id)}
					<li class="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
						<div class="min-w-0">
							<p class="font-medium text-zinc-900">{expense.description}</p>
							<p class="mt-0.5 text-sm text-zinc-500">
								{personName(expense.paidBy)} paid
								{formatMoney(expense.amount, expense.currency)}
								{#if expense.currency !== 'EUR'}
									<span class="text-zinc-400">→ {formatEur(expense.amountEur)}</span>
								{/if}
							</p>
							<p class="mt-0.5 text-sm text-zinc-500">
								Split:
								{expense.splitAmong.map(personName).join(', ')}
							</p>
						</div>
						<button
							type="button"
							class="shrink-0 self-start text-sm text-zinc-400 hover:text-red-600"
							onclick={() => removeExpense(expense.id)}
						>
							Remove
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="mb-8" aria-labelledby="balances-heading">
		<h2 id="balances-heading" class="text-lg font-semibold text-zinc-900">Balances (EUR)</h2>
		<p class="mb-3 text-sm text-zinc-500">
			Positive means others owe them; negative means they owe.
		</p>

		{#if people.length === 0}
			<p class="text-sm text-zinc-500">Add people to see balances.</p>
		{:else}
			<ul class="grid gap-2 sm:grid-cols-2">
				{#each balances as balance (balance.personId)}
					<li
						class="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
					>
						<span class="font-medium text-zinc-800">{balance.name}</span>
						<span
							class={balance.netEur > 0.005
								? 'font-medium text-emerald-700'
								: balance.netEur < -0.005
									? 'font-medium text-red-700'
									: 'text-zinc-500'}
						>
							{formatEur(balance.netEur)}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section aria-labelledby="settle-heading">
		<h2 id="settle-heading" class="text-lg font-semibold text-zinc-900">Who owes whom</h2>
		<p class="mb-3 text-sm text-zinc-500">Minimal transfers to settle everything in euro.</p>

		{#if settlements.length === 0}
			<p
				class="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500"
			>
				{expenses.length
					? 'Everyone is settled up.'
					: 'Settlements will appear after expenses are added.'}
			</p>
		{:else}
			<ul class="space-y-2">
				{#each settlements as settlement, index (`${settlement.fromId}-${settlement.toId}-${index}`)}
					<li
						class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
					>
						<span class="font-semibold">{settlement.fromName}</span>
						owes
						<span class="font-semibold">{settlement.toName}</span>
						<span class="font-semibold">{formatEur(settlement.amountEur)}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
