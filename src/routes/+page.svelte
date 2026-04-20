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


<!-- How It Works Section -->
<section class="py-16 px-6 bg-white">
	<div class="max-w-5xl mx-auto">
	 	<h2 class="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>

	 	<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
	 		<div class="text-center">
	 			<div class="text-5xl mb-4">📋</div>
	 			<h3 class="text-xl font-semibold text-gray-900 mb-2">1. Become a Member</h3>
	 			<p class="text-gray-600">Sign a liability waiver and user agreement. Borrowing is free for Lincoln residents.</p>
	 		</div>
		  
	 		<div class="text-center">
	 			<div class="text-5xl mb-4">🔧</div>
	 			<h3 class="text-xl font-semibold text-gray-900 mb-2">2. Browse &amp; Borrow</h3>
	 			<p class="text-gray-600">Browse our catalog online or visit during open hours to check out tools for up to two weeks.</p>
	 		</div>
		  
	 		<div class="text-center">
	 		 	<div class="text-5xl mb-4">🏠</div>
	 		 	<h3 class="text-xl font-semibold text-gray-900 mb-2">3. Return &amp; Repeat</h3>
	 		 	<p class="text-gray-600">Return tools on time and in good condition so everyone in the community can use them.</p>
	 		</div>
	 	</div>
	</div>
</section>

<!-- Hours & Location Section -->
<section class="py-16 px-6 bg-gray-50">
	<div class="max-w-5xl mx-auto">
		<h2 class="text-3xl font-bold text-center text-gray-900 mb-12">Visit Us</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
			<div class="bg-white rounded-xl p-8 shadow-sm">
				<h3 class="text-xl font-semibold text-gray-900 mb-4">Hours</h3>
				<div class="grid grid-cols-2 gap-y-2 text-gray-700">
					<span class="font-medium">Tuesdays</span><span>8:00 AM – 10:00 AM</span>
					<span class="font-medium">Fridays</span><span>5:30 PM – 7:00 PM</span>
					<span class="font-medium">Saturdays</span><span>10:00 AM – 2:00 PM</span>
				</div>
			</div>
		  
			<div class="bg-white rounded-xl p-8 shadow-sm">
				<h3 class="text-xl font-semibold text-gray-900 mb-4">Location</h3>
				<p class="text-gray-700 font-medium">2045 E Street</p>
				<p class="text-gray-600">Basement of the <a href="https://www.firstplymouth.org/hopehouse" class="underline hover:text-gray-900 transition-colors" target="_blank" rel="noopener noreferrer">Hope House – First Plymouth</a></p>
				<p class="text-gray-500 text-sm mt-2">Lincoln, Nebraska</p>
			</div>
		</div>
	</div>
</section>

<!-- Featured Tools Section -->
<section class="py-16 px-6 bg-white">
	<div class="max-w-6xl mx-auto">
		<div class="text-center mb-12">
			<h2 class="text-3xl font-bold text-gray-900">Popular Tools</h2>
			<a href="/browse" class="text-[#912924] font-semibold hover:underline text-sm mt-2 inline-block">
				See all tools →
			</a>
		</div>
	  
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
			{#each data.featuredTools as tool (tool.id)}
				<div class="bg-gray-50 rounded-lg overflow-hidden">
					{#if tool.files.length > 0}
						<img
							src="/api/files/{tool.files[0].id}"
							alt={tool.name}
							class="w-full h-32 object-contain bg-white"
						/>
					{:else}
						<div class="w-full h-32 bg-gray-200 flex items-center justify-center text-3xl">
						  🔧
						</div>
					{/if}
					<p class="p-2 text-sm font-medium text-gray-800 text-center leading-snug">
						{tool.name}
					</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Contact & Support Section -->
<section>
	<p>Contact goes here</p>
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

