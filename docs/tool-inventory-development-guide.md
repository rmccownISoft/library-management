# Tool Inventory Management - Development Guide

## Project Overview

This guide provides a step-by-step approach to building the Tool Inventory Management page for the library management system using SvelteKit 2.0 and Svelte 5.

---

## Current Project Status

- ✅ Database schema complete (Tool, Category, File, DamageReport models)
- ✅ SvelteKit 2.0 with TypeScript
- ✅ Prisma with SQLite configured
- 📍 Ready to build Tool Inventory page

---

## Development Plan

### **Phase 1: Basic Tool List & Display** (Start Here)

#### Step 1.1: Create the basic route structure
- Set up `/tools` route with `+page.svelte` and `+page.server.ts`
- Create a simple server `load` function to fetch tools from the database
- Display tools in a basic list format

#### Step 1.2: Add basic filtering UI
- Add filter controls (category dropdown, availability toggle)
- Implement the filtering logic in the load function using URL search params
- Use Svelte 5's `$state` rune for any client-side filter state

#### Step 1.3: Add search functionality
- Add a search input field
- Implement search by tool name in the database query

---

### **Phase 2: Tool Details & CRUD Operations**

#### Step 2.1: Create tool detail view
- Create `/tools/[id]` route
- Display full tool information
- Show associated images (if any)
- Detail view (read-only)
- Edit/Delete buttons for admin only (save for later)

#### Step 2.2: Add "Create Tool" form
- Create `/tools/new` route
- Build form with validation
- Implement the form action to save to database
- Handle basic fields first (name, description, category, quantity, donor)
- File uploads handled in phase 3


#### Step 2.3: Add "Edit Tool" functionality
- Create `/tools/[id]/edit` route
- Pre-populate form with existing data
- Implement update form action

#### Step 2.4: Add delete functionality (admin only)
- Add delete button with confirmation
- Implement delete form action with permission check

#### Step 2.5: Update main tools page
- Add "View Details" links to each tool card (or allow card click)
- Add "Add New Tool" button (admin only)
---

### **Phase 3: Image Management**

#### Step 3.1: Set up file upload infrastructure
- Configure file storage directory
- Create upload utilities for handling multipart form data
- Implement image upload in create/edit forms

#### Step 3.2: Display tool images
- Create image gallery component
- Display multiple images per tool
- Add image viewing functionality

---

### **Phase 4: Condition & Damage Tracking**

#### Step 4.1: Add condition status
- Add condition status dropdown to tool forms
- Display condition status in tool list and details
- Prevent checkout of damaged/lost tools

#### Step 4.2: Implement damage reporting
- Create damage report form
- Allow adding damage notes and photos
- Display damage history on tool detail page

#### Step 4.3: Handle "lost" tools
- Add "mark as lost" functionality with required note
- Associate lost tools with last patron

---

### **Phase 5: Polish & Enhancement**

#### Step 5.1: Improve UI/UX
- Add sorting options
- Improve mobile responsiveness
- Add loading states and better error handling

#### Step 5.2: Add audit logging
- Track who created/edited tools
- Log all changes for accountability

---

## Svelte 5 Quick Reference

### Runes (New in Svelte 5)

Runes are special symbols that control the Svelte compiler. They have a `$` prefix and look like functions.

#### `$state` - Reactive State

Creates reactive state that triggers UI updates when changed.

```svelte
<script>
	let count = $state(0);
	let user = $state({ name: 'John', age: 30 });
</script>

<button onclick={() => count++}>
	Clicks: {count}
</button>

<button onclick={() => user.age++}>
	Age: {user.age}
</button>
```

**Key Points:**
- No need to import - it's built into the language
- Deep reactivity - nested object/array changes are tracked
- Use `$state.raw()` for non-reactive state (performance optimization)
- Use `$state.snapshot()` to get a non-reactive copy

**Class Usage:**
```javascript
class Todo {
	done = $state(false);
	text = $state('');
	
	constructor(text) {
		this.text = text;
	}
	
	toggle = () => {
		this.done = !this.done;
	}
}
```

#### `$derived` - Computed Values

Creates values that automatically update when dependencies change.

```svelte
<script>
	let count = $state(0);
	let doubled = $derived(count * 2);
	let message = $derived(count > 10 ? 'High' : 'Low');
</script>

<p>{count} × 2 = {doubled}</p>
<p>Status: {message}</p>
```

#### `$effect` - Side Effects

Runs code when dependencies change (replaces `$:` reactive statements).

```svelte
<script>
	let count = $state(0);
	
	$effect(() => {
		console.log('Count changed:', count);
		document.title = `Count: ${count}`;
	});
</script>
```

#### `$props` - Component Props

Declares component props (replaces `export let`).

```svelte
<!-- Parent.svelte -->
<Child name="John" age={30} />

<!-- Child.svelte -->
<script>
	let { name, age } = $props();
	// OR with defaults
	let { name = 'Anonymous', age = 0 } = $props();
</script>

<p>{name} is {age} years old</p>
```

**With TypeScript:**
```svelte
<script lang="ts">
	interface Props {
		name: string;
		age?: number;
	}
	
	let { name, age = 0 }: Props = $props();
</script>
```

### Template Syntax

#### Each Blocks

```svelte
<!-- Basic -->
{#each items as item}
	<div>{item.name}</div>
{/each}

<!-- With index -->
{#each items as item, i}
	<div>{i}: {item.name}</div>
{/each}

<!-- With key (recommended for dynamic lists) -->
{#each items as item (item.id)}
	<div>{item.name}</div>
{/each}

<!-- With destructuring -->
{#each items as { id, name, price }}
	<div>{name}: ${price}</div>
{/each}

<!-- With else block -->
{#each items as item}
	<div>{item.name}</div>
{:else}
	<p>No items found</p>
{/each}
```

#### If Blocks

```svelte
{#if condition}
	<p>True</p>
{:else if otherCondition}
	<p>Other</p>
{:else}
	<p>False</p>
{/if}
```

#### Await Blocks

```svelte
{#await promise}
	<p>Loading...</p>
{:then value}
	<p>Result: {value}</p>
{:catch error}
	<p>Error: {error.message}</p>
{/await}
```

---

## SvelteKit 2.0 Quick Reference

### File-Based Routing

```
src/routes/
├── +page.svelte              # /
├── +page.server.ts           # Server-side logic for /
├── +layout.svelte            # Layout for all pages
├── +error.svelte             # Error boundary
├── tools/
│   ├── +page.svelte          # /tools
│   ├── +page.server.ts       # Server logic for /tools
│   ├── [id]/
│   │   ├── +page.svelte      # /tools/123
│   │   ├── +page.server.ts   # Server logic for /tools/123
│   │   └── edit/
│   │       ├── +page.svelte  # /tools/123/edit
│   │       └── +page.server.ts
│   └── new/
│       ├── +page.svelte      # /tools/new
│       └── +page.server.ts
```

### Loading Data

#### Server Load Functions (`+page.server.ts`)

**Basic Load:**
```typescript
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/prisma';

export const load: PageServerLoad = async () => {
	const tools = await prisma.tool.findMany({
		include: { category: true }
	});
	
	return { tools };
};
```

**With URL Params:**
```typescript
export const load: PageServerLoad = async ({ params }) => {
	const tool = await prisma.tool.findUnique({
		where: { id: parseInt(params.id) },
		include: { 
			category: true,
			files: true,
			damageReports: true
		}
	});
	
	if (!tool) {
		throw error(404, 'Tool not found');
	}
	
	return { tool };
};
```

**With URL Search Params (Filtering):**
```typescript
export const load: PageServerLoad = async ({ url }) => {
	const categoryId = url.searchParams.get('category');
	const search = url.searchParams.get('search');
	const status = url.searchParams.get('status');
	
	const tools = await prisma.tool.findMany({
		where: {
			...(categoryId && { categoryId: parseInt(categoryId) }),
			...(search && { 
				name: { contains: search, mode: 'insensitive' }
			}),
			...(status && { conditionStatus: status })
		},
		include: { category: true }
	});
	
	const categories = await prisma.category.findMany();
	
	return { tools, categories };
};
```

#### Using Loaded Data in Component

```svelte
<!-- +page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
</script>

<h1>Tools</h1>
{#each data.tools as tool (tool.id)}
	<div>{tool.name}</div>
{/each}
```

**Legacy (Svelte 4 style):**
```svelte
<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>
```

### Form Actions

#### Basic Action

```typescript
// +page.server.ts
import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		
		if (!name) {
			return fail(400, { name, missing: true });
		}
		
		await prisma.tool.create({
			data: { name, /* ... */ }
		});
		
		throw redirect(303, '/tools');
	}
};
```

#### Named Actions

```typescript
export const actions: Actions = {
	create: async ({ request }) => {
		// Handle create
	},
	
	update: async ({ request, params }) => {
		// Handle update
	},
	
	delete: async ({ params }) => {
		await prisma.tool.delete({
			where: { id: parseInt(params.id) }
		});
		
		throw redirect(303, '/tools');
	}
};
```

#### Using Actions in Forms

```svelte
<!-- Default action -->
<form method="POST">
	<input name="name" required />
	<button>Submit</button>
</form>

<!-- Named action -->
<form method="POST" action="?/create">
	<input name="name" required />
	<button>Create</button>
</form>

<!-- Multiple actions with formaction -->
<form method="POST" action="?/update">
	<input name="name" value={data.tool.name} />
	<button>Update</button>
	<button formaction="?/delete">Delete</button>
</form>
```

#### Progressive Enhancement

```svelte
<script>
	import { enhance } from '$app/forms';
	
	let loading = $state(false);
</script>

<form 
	method="POST" 
	use:enhance={() => {
		loading = true;
		
		return async ({ update }) => {
			await update();
			loading = false;
		};
	}}
>
	<input name="name" />
	<button disabled={loading}>
		{loading ? 'Saving...' : 'Submit'}
	</button>
</form>
```

#### Handling Form Results

```svelte
<script lang="ts">
	import type { PageData, ActionData } from './$types';
	
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

{#if form?.missing}
	<p class="error">Name is required</p>
{/if}

{#if form?.success}
	<p class="success">Tool created!</p>
{/if}

<form method="POST">
	<input name="name" value={form?.name ?? ''} />
	<button>Submit</button>
</form>
```

### Error Handling

#### Throwing Errors

```typescript
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const tool = await prisma.tool.findUnique({
		where: { id: parseInt(params.id) }
	});
	
	if (!tool) {
		throw error(404, 'Tool not found');
	}
	
	return { tool };
};
```

#### Custom Error Page (`+error.svelte`)

```svelte
<script>
	import { page } from '$app/state';
</script>

<div class="error-page">
	<h1>{page.status}</h1>
	<p>{page.error.message}</p>
	<a href="/tools">Back to tools</a>
</div>
```

### Navigation

```typescript
import { goto } from '$app/navigation';

// Programmatic navigation
goto('/tools');
goto('/tools/123');
goto('/tools', { replaceState: true });

// Invalidate and reload data
import { invalidate, invalidateAll } from '$app/navigation';
invalidate('/api/tools'); // Rerun load functions that fetched from this URL
invalidateAll(); // Rerun all load functions
```

### $app/state (New in 2.12)

```svelte
<script>
	import { page } from '$app/state';
</script>

<!-- Access current page data -->
<p>Current path: {page.url.pathname}</p>
<p>Status: {page.status}</p>
<p>Error: {page.error?.message}</p>

<!-- Access params -->
<p>Tool ID: {page.params.id}</p>

<!-- Access search params -->
<p>Search: {page.url.searchParams.get('q')}</p>
```

---

## Common Patterns for Tool Inventory

### 1. List Page with Filtering

```typescript
// +page.server.ts
export const load: PageServerLoad = async ({ url }) => {
	const categoryId = url.searchParams.get('category');
	const search = url.searchParams.get('q');
	
	const [tools, categories] = await Promise.all([
		prisma.tool.findMany({
			where: {
				...(categoryId && { categoryId: parseInt(categoryId) }),
				...(search && { 
					name: { contains: search, mode: 'insensitive' }
				})
			},
			include: { category: true }
		}),
		prisma.category.findMany()
	]);
	
	return { tools, categories };
};
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	
	let { data } = $props<{ data: PageData }>();
	
	let searchQuery = $state('');
	let selectedCategory = $state('');
</script>

<form method="GET">
	<input 
		name="q" 
		placeholder="Search tools..."
		bind:value={searchQuery}
	/>
	
	<select name="category" bind:value={selectedCategory}>
		<option value="">All Categories</option>
		{#each data.categories as category}
			<option value={category.id}>{category.name}</option>
		{/each}
	</select>
	
	<button>Search</button>
</form>

<div class="tool-grid">
	{#each data.tools as tool (tool.id)}
		<div class="tool-card">
			<h3>{tool.name}</h3>
			<p>{tool.category.name}</p>
			<p>Quantity: {tool.quantity}</p>
			<span class="status">{tool.conditionStatus}</span>
			<a href="/tools/{tool.id}">View Details</a>
		</div>
	{:else}
		<p>No tools found</p>
	{/each}
</div>
```

### 2. Create/Edit Form

```typescript
// +page.server.ts
export const load: PageServerLoad = async ({ params }) => {
	const categories = await prisma.category.findMany();
	
	// For edit page
	let tool = null;
	if (params.id) {
		tool = await prisma.tool.findUnique({
			where: { id: parseInt(params.id) }
		});
	}
	
	return { tool, categories };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();
		
		const data = {
			name: formData.get('name') as string,
			description: formData.get('description') as string,
			categoryId: parseInt(formData.get('categoryId') as string),
			quantity: parseInt(formData.get('quantity') as string),
			donor: formData.get('donor') as string || null,
			conditionStatus: formData.get('conditionStatus') as string
		};
		
		// Validation
		if (!data.name) {
			return fail(400, { ...data, missing: true });
		}
		
		// Create or update
		if (params.id) {
			await prisma.tool.update({
				where: { id: parseInt(params.id) },
				data
			});
		} else {
			await prisma.tool.create({ data });
		}
		
		throw redirect(303, '/tools');
	}
};
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	
	let { data, form } = $props<{ data: PageData; form: any }>();
	
	let isEdit = !!data.tool;
</script>

<h1>{isEdit ? 'Edit' : 'Create'} Tool</h1>

{#if form?.missing}
	<p class="error">Please fill all required fields</p>
{/if}

<form method="POST" use:enhance>
	<label>
		Name *
		<input 
			name="name" 
			required
			value={form?.name ?? data.tool?.name ?? ''}
		/>
	</label>
	
	<label>
		Description
		<textarea 
			name="description"
		>{form?.description ?? data.tool?.description ?? ''}</textarea>
	</label>
	
	<label>
		Category *
		<select 
			name="categoryId" 
			required
			value={form?.categoryId ?? data.tool?.categoryId ?? ''}
		>
			<option value="">Select category</option>
			{#each data.categories as category}
				<option value={category.id}>{category.name}</option>
			{/each}
		</select>
	</label>
	
	<label>
		Quantity
		<input 
			type="number" 
			name="quantity" 
			min="1"
			value={form?.quantity ?? data.tool?.quantity ?? 1}
		/>
	</label>
	
	<label>
		Donor
		<input 
			name="donor"
			value={form?.donor ?? data.tool?.donor ?? ''}
		/>
	</label>
	
	<label>
		Condition
		<select 
			name="conditionStatus"
			value={form?.conditionStatus ?? data.tool?.conditionStatus ?? 'GOOD'}
		>
			<option value="GOOD">Good</option>
			<option value="NEEDS_REPAIR">Needs Repair</option>
			<option value="DAMAGED">Damaged</option>
			<option value="LOST">Lost</option>
		</select>
	</label>
	
	<button type="submit">
		{isEdit ? 'Update' : 'Create'} Tool
	</button>
	<a href="/tools">Cancel</a>
</form>
```

### 3. Detail Page with Actions

```typescript
// +page.server.ts
export const load: PageServerLoad = async ({ params }) => {
	const tool = await prisma.tool.findUnique({
		where: { id: parseInt(params.id) },
		include: {
			category: true,
			files: true,
			damageReports: {
				include: { reporter: true },
				orderBy: { reportedAt: 'desc' }
			}
		}
	});
	
	if (!tool) {
		throw error(404, 'Tool not found');
	}
	
	return { tool };
};

export const actions: Actions = {
	delete: async ({ params }) => {
		await prisma.tool.delete({
			where: { id: parseInt(params.id) }
		});
		
		throw redirect(303, '/tools');
	}
};
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	
	let { data } = $props<{ data: PageData }>();
	
	let showDeleteConfirm = $state(false);
</script>

<div class="tool-detail">
	<h1>{data.tool.name}</h1>
	
	<div class="info">
		<p><strong>Category:</strong> {data.tool.category.name}</p>
		<p><strong>Quantity:</strong> {data.tool.quantity}</p>
		<p><strong>Status:</strong> {data.tool.conditionStatus}</p>
		{#if data.tool.donor}
			<p><strong>Donor:</strong> {data.tool.donor}</p>
		{/if}
		<p><strong>Description:</strong> {data.tool.description}</p>
	</div>
	
	{#if data.tool.files.length > 0}
		<div class="images">
			<h2>Images</h2>
			{#each data.tool.files as file}
				<img src="/uploads/{file.filePath}" alt={file.fileName} />
			{/each}
		</div>
	{/if}
	
	{#if data.tool.damageReports.length > 0}
		<div class="damage-reports">
			<h2>Damage History</h2>
			{#each data.tool.damageReports as report}
				<div class="report">
					<p>{report.notes}</p>
					<p><small>Reported by {report.reporter.name} on {new Date(report.reportedAt).toLocaleDateString()}</small></p>
				</div>
			{/each}
		</div>
	{/if}
	
	<div class="actions">
		<a href="/tools/{data.tool.id}/edit">Edit</a>
		
		<button onclick={() => showDeleteConfirm = true}>
			Delete
		</button>
		
		{#if showDeleteConfirm}
			<div class="confirm-dialog">
				<p>Are you sure you want to delete this tool?</p>
				<form method="POST" action="?/delete">
					<button type="submit">Yes, Delete</button>
					<button type="button" onclick={() => showDeleteConfirm = false}>
						Cancel
					</button>
				</form>
			</div>
		{/if}
	</div>
</div>
```

---

## TypeScript Tips

### Typing Props
```typescript
interface Props {
	tools: Tool[];
	onSelect?: (tool: Tool) => void;
}

let { tools, onSelect }: Props = $props();
```

### Typing Form Data
```typescript
const formData = await request.formData();
const name = formData.get('name') as string;
const categoryId = parseInt(formData.get('categoryId') as string);
```

### Prisma Types
```typescript
import type { Tool, Category } from '@prisma/client';

// With relations
type ToolWithCategory = Tool & { category: Category };
```

---

## Next Steps

1. **Review this guide** and identify any questions
2. **Choose a starting point** (recommend Step 1.1)
3. **Set up the basic route structure**
4. **Implement incrementally**, testing each step

## Decision Points

Before starting:
1. Do you want Tailwind CSS classes included?
2. Should we implement permissions from the start?
3. Do you need sample seed data for testing?

---

## Additional Resources

- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Svelte 5 Docs](https://svelte.dev/docs/svelte/overview)
- [Prisma Docs](https://www.prisma.io/docs)
