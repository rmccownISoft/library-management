<script lang="ts">
	import type { PageData } from './$types'
	let { data }: { data: PageData } = $props()
</script>

<!-- Hero Section -->
<section class="relative min-h-[70vh] overflow-hidden flex items-center justify-center">
	<div
		class="absolute inset-0 bg-cover bg-center"
		style="background-image: url('/banner.jpg')"
	>
	</div>
	<!-- Dark overlay so text is readable-->
	<div class="absolute inset-0 bg-black/60"></div>
	<!-- Content sits above the overlay via z-10-->
	<div class="relative z-10 flex flex-col items-center justify-center text-center px-6 py-16">
		<img src="library_logo.jpg" alt="Near South Tool Library logo" class="w-24 h-24 object-contain mb-6"/>
		<h1 class="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
			Near South Lincoln <br /> Tool Library
		</h1>
		<p class="text-lg md:text-xl text-white/90 mb-8 max-w-xl">
			A community-run tool library organized by neighbors for neighbors.  Brought to you with the support of <b class="whitespace-nowrap">NeighborWorks Lincoln</b> and <b class="whitespace-nowrap">First-Plymouth Church</b>
		</p>
		<a
			href="/browse"
			class="px-8 py-4 bg-[#912924] text-white text-log font-semibold rounded-lg hover:bg-[#7a1f1b] transition-colors"
		>Browse Our Tools</a>
	</div>

</section>

<!-- Supporters Section -->
<section class="bg-gray-50 py-10 border-t border-gray-200">
	<div class="flex flex-col items-center gap-6">
		<p class="text-sm font-semibold uppercase tracking-widest text-gray-400">Supported by</p>
		<div class="flex items-center gap-10">
			<img src="hope_logo.png" alt="Hope House logo" class="h-16 w-auto object-contain"/>
			<img src="nwl_logo.png" alt="NeighborWorks Lincoln logo" class="h-16 w-auto object-contain"/>
		</div>
	</div>
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


