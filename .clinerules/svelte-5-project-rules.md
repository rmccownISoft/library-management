# Svelte 5 Project Rules

## Project Configuration

This project uses **Svelte 5.48.2** and **SvelteKit 2.50.1**. All components MUST use Svelte 5 runes mode syntax.

## Core Principles

1. **Always use runes mode** - This project is exclusively Svelte 5, no legacy syntax
2. **Consult the svelte-llm MCP server** - Use `list-sections` first, then `get-documentation` for relevant sections
3. **Prefer built-in reactivity** - Svelte 5's reactivity is more powerful and simpler than Svelte 4

## Reactivity Patterns

### State Management

**✅ DO:**
```svelte
<script lang="ts">
  // Simple reactive state
  let count = $state(0);
  
  // Deep reactive object/array
  let user = $state({ name: 'John', age: 30 });
  let items = $state([1, 2, 3]);
  
  // Reactive Map/Set - use reactive versions
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  let selections = $state(new SvelteMap<number, number>());
  let tags = $state(new SvelteSet<string>());
</script>
```

**❌ DON'T:**
```svelte
<script>
  // Don't use plain let for reactive state
  let count = 0;
  
  // Don't use non-reactive Map/Set
  let selections = $state(new Map()); // Wrong!
  
  // Don't use Svelte 4 pattern
  selections = selections; // Not needed in Svelte 5!
</script>
```

### Derived Values

**✅ DO:**
```svelte
<script>
  let count = $state(0);
  
  // Simple derived
  let doubled = $derived(count * 2);
  
  // Complex derived with $derived.by
  let filtered = $derived.by(() => {
    return items.filter(i => i > 10);
  });
</script>
```

**❌ DON'T:**
```svelte
<script>
  // Don't use $: for derivations
  $: doubled = count * 2; // Legacy Svelte 4 syntax
</script>
```

### Side Effects

**✅ DO:**
```svelte
<script>
  import { tick } from 'svelte';
  
  let count = $state(0);
  
  // Side effects
  $effect(() => {
    console.log('Count changed:', count);
  });
  
  // Pre-render effects (like beforeUpdate)
  $effect.pre(() => {
    // Runs before DOM updates
  });
  
  // One-time initialization
  $effect(() => {
    const cleanup = setupSomething();
    return () => cleanup();
  });
</script>
```

**❌ DON'T:**
```svelte
<script>
  // Don't use $: for effects
  $: {
    console.log('Count changed:', count); // Legacy
  }
  
  // Don't use lifecycle hooks in runes mode
  import { onMount } from 'svelte'; // Use $effect instead
  onMount(() => { }); // Avoid in runes mode
</script>
```

### Props

**✅ DO:**
```svelte
<script lang="ts">
  // Destructure props
  let { name, age = 25, onUpdate }: {
    name: string;
    age?: number;
    onUpdate: (value: string) => void;
  } = $props();
  
  // Bindable props
  let { value = $bindable('') }: { value: string } = $props();
  
  // Rest props
  let { class: className, ...rest } = $props();
</script>

<div class={className} {...rest}>
  {name} is {age}
</div>
```

**❌ DON'T:**
```svelte
<script>
  // Don't use export let
  export let name; // Legacy Svelte 4 syntax
  export let age = 25; // Legacy
</script>
```

## Event Handling

**✅ DO:**
```svelte
<script>
  let count = $state(0);
  
  function handleClick() {
    count++;
  }
  
  // Callback props (not events)
  let { onClick }: { onClick: () => void } = $props();
</script>

<!-- Event attributes (no colon) -->
<button onclick={handleClick}>Click me</button>
<button onclick={() => count++}>Click me</button>

<!-- Pass callbacks as props -->
<ChildComponent onClick={handleClick} />
```

**❌ DON'T:**
```svelte
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher(); // Legacy
</script>

<!-- Don't use on: directive -->
<button on:click={handleClick}>Click me</button> <!-- Legacy -->
```

## Content Projection

**✅ DO:**
```svelte
<script lang="ts">
  // Accept snippets as props
  let { 
    children,
    header,
    footer
  }: {
    children?: Snippet;
    header?: Snippet;
    footer?: Snippet;
  } = $props();
</script>

<!-- Render snippets -->
{@render header?.()}
{@render children?.()}
{@render footer?.()}
```

**❌ DON'T:**
```svelte
<!-- Don't use slots -->
<slot /> <!-- Legacy Svelte 4 syntax -->
<slot name="header" /> <!-- Legacy -->
```

## Component Instantiation

**✅ DO:**
```ts
import { mount, unmount } from 'svelte';
import App from './App.svelte';

const app = mount(App, { 
  target: document.getElementById('app'),
  props: { name: 'world' }
});

// Later...
unmount(app);
```

**❌ DON'T:**
```ts
// Don't use new Component()
const app = new App({ // Legacy
  target: document.getElementById('app'),
  props: { name: 'world' }
});
```

## Imports from svelte/reactivity

When working with collections that need reactivity:

```svelte
<script>
  import { 
    SvelteMap,      // Reactive Map
    SvelteSet,      // Reactive Set
    SvelteURL,      // Reactive URL
    SvelteDate,     // Reactive Date
    MediaQuery      // Reactive media queries
  } from 'svelte/reactivity';
  
  let map = $state(new SvelteMap());
  let set = $state(new SvelteSet());
</script>
```

## TypeScript

Always use TypeScript with proper typing:

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  
  let { 
    items,
    onSelect 
  }: {
    items: Array<{ id: number; name: string }>;
    onSelect: (id: number) => void;
  } = $props();
</script>
```

## Common Migration Patterns

| Svelte 4 | Svelte 5 |
|----------|----------|
| `let x = 0` | `let x = $state(0)` |
| `$: double = x * 2` | `let double = $derived(x * 2)` |
| `$: { console.log(x) }` | `$effect(() => { console.log(x) })` |
| `export let prop` | `let { prop } = $props()` |
| `on:click={fn}` | `onclick={fn}` |
| `createEventDispatcher()` | Callback props |
| `<slot />` | `{@render children?.()}` |
| `new Component({...})` | `mount(Component, {...})` |

## When to Consult Documentation

Before writing Svelte code, especially for:
- Interactive features → fetch `$state`, `$derived`, `$effect` docs
- Forms → fetch `$bindable`, `bind:` docs
- Component composition → fetch `{@render ...}`, `{#snippet ...}` docs
- Animations → fetch `transition:`, `animate:` docs
- Advanced patterns → use MCP `list-sections` to find relevant docs

## Testing Your Code

Use the `svelte-autofixer` MCP tool to validate Svelte components before presenting them to the user. This ensures:
- Proper runes syntax
- No legacy Svelte 4 patterns
- TypeScript compatibility
- Best practices compliance
