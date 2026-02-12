<script>
	import { page } from '$app/state'
	import '../app.css'

	let { children } = $props()
</script>

<div class="layout">
	<nav>
		<div class="nav-brand">
			<a href="/">Lincoln Tool Library</a>
		</div>
		<div class="nav-links">
			<a href="/" class:active={page.url.pathname === '/'}> Home </a>
			<a href="/patrons" class:active={page.url.pathname.startsWith('/patrons')}> Patrons </a>
			<a href="/tools" class:active={page.url.pathname.startsWith('/tools')}> Tools </a>
			<a href="/checkout" class:active={page.url.pathname.startsWith('/checkout')}> Checkout </a>
		</div>
	</nav>

	<div class="content">
		{@render children()}
	</div>
</div>


<style>
	.layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	nav {
		background: #2196f3;
		color: white;
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.nav-brand a {
		color: white;
		text-decoration: none;
		font-size: 1.25rem;
		font-weight: 700;
	}

	.nav-links {
		display: flex;
		gap: 2rem;
	}

	.nav-links a {
		color: rgba(255, 255, 255, 0.9);
		text-decoration: none;
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.nav-links a:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.nav-links a.active {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}

	.content {
		flex: 1;
		background: #fafafa;
	}

	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			sans-serif;
	}
</style>
