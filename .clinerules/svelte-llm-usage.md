# Svelte MCP Server Usage Guide

**IMPORTANT: This project uses Svelte 5.41.0 - Always write Svelte 5 runes mode syntax!**

When connected to the svelte-llm MCP server, you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections
Use this FIRST to discover all available documentation sections. Returns a structured list with titles and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

**When to use:**
- At the start of ANY Svelte-related task
- Before writing any Svelte component
- When implementing reactive features
- When unsure about syntax

### 2. get-documentation
Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

**Key sections to fetch for common tasks:**
- Interactive features → `$state`, `$derived`, `$effect`
- Forms → `$bindable`, `bind:`
- Component composition → `{@render ...}`, `{#snippet ...}`, `$props`
- Collections/Maps → `svelte/reactivity` (for SvelteMap, SvelteSet)
