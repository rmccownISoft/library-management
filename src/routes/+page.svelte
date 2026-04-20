<script lang="ts">
	import type { PageData } from './$types'
	let { data }: { data: PageData } = $props()
</script>

<!-- Hero Section -->
<section>
	<p>Hero goes here</p>
</section>

<!-- How It Works Section -->
<section>
	<p>How it works goes here</p>
</section>

<!-- Hours & Location Section -->
<section>
	<p>Hours and location goes here</p>
</section>

<!-- Featured Tools Section -->
<section>
	<p>Featured tools go here</p>
	{#each data.featuredTools as tool (tool.id)}
		<p>{tool.name}</p>
	{/each}
</section>

<!-- Contact & Support Section -->
<section>
	<p>Contact goes here</p>
</section>


