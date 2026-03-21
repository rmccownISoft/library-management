<script>
	import { page } from '$app/state'
	import '../app.css'

	let { children, data } = $props()

	let menuOpen = $state(false)

	// Close menu on navigation
	$effect(() => {
		page.url.pathname
		menuOpen = false
	})
</script>

<div class="layout">
	<nav>
		<div class="nav-top">
			<div class="nav-brand">
				<a href="/">Near South Lincoln Tool Library</a>
			</div>

			{#if data?.user}
				<button
					class="hamburger"
					onclick={() => menuOpen = !menuOpen}
					aria-label="Toggle menu"
					aria-expanded={menuOpen}
				>
					<span class="bar"></span>
					<span class="bar"></span>
					<span class="bar"></span>
				</button>
			{:else}
				<a href="/login" class="logout-button">Login</a>
			{/if}
		</div>

		{#if data?.user}
			<!-- Desktop layout -->
			<div class="nav-desktop">
				<div class="nav-links">
					<a href="/" class:active={page.url.pathname === '/'}> Home </a>
					<a href="/patrons" class:active={page.url.pathname.startsWith('/patrons')}> Patrons </a>
					<a href="/tools" class:active={page.url.pathname.startsWith('/tools')}> Tools </a>
					<a href="/checkout" class:active={page.url.pathname.startsWith('/checkout')}> Checkout </a>
					{#if data.user?.role === 'ADMIN'}
						<a href="/admin/categories" class:active={page.url.pathname.startsWith('/admin')}> Admin </a>
					{/if}
				</div>
				<div class="nav-user">
					<span class="user-name">{data.user.name}</span>
					<form method="POST" action="/logout" style="display: inline;">
						<button type="submit" class="logout-button">Logout</button>
					</form>
				</div>
			</div>

			<!-- Mobile dropdown -->
			{#if menuOpen}
				<div class="nav-mobile-menu">
					<a href="/" class:active={page.url.pathname === '/'}> Home </a>
					<a href="/patrons" class:active={page.url.pathname.startsWith('/patrons')}> Patrons </a>
					<a href="/tools" class:active={page.url.pathname.startsWith('/tools')}> Tools </a>
					<a href="/checkout" class:active={page.url.pathname.startsWith('/checkout')}> Checkout </a>
					{#if data.user?.role === 'ADMIN'}
						<a href="/admin/categories" class:active={page.url.pathname.startsWith('/admin')}> Admin </a>
					{/if}
					<div class="mobile-menu-footer">
						<span class="user-name">{data.user.name}</span>
						<form method="POST" action="/logout" style="display: inline;">
							<button type="submit" class="logout-button">Logout</button>
						</form>
					</div>
				</div>
			{/if}
		{/if}
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
		background: #912924;
		color: white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		position: relative;
	}

	.nav-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 2rem;
	}

	.nav-brand a {
		color: white;
		text-decoration: none;
		font-size: 1.25rem;
		font-weight: 700;
	}

	/* Desktop: show links inline, hide hamburger */
	.nav-desktop {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 2rem 0.75rem;
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

	.nav-user {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-name {
		font-weight: 600;
	}

	.logout-button {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: background 0.2s;
		text-decoration: none;
	}

	.logout-button:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	/* Hamburger button — hidden on desktop */
	.hamburger {
		display: none;
		flex-direction: column;
		justify-content: center;
		gap: 5px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
	}

	.bar {
		display: block;
		width: 24px;
		height: 2px;
		background: white;
		border-radius: 2px;
	}

	/* Mobile menu panel — hidden by default, shown via {#if} */
	.nav-mobile-menu {
		display: none;
	}

	@media (max-width: 768px) {
		.nav-top {
			padding: 0.75rem 1rem;
		}

		.nav-desktop {
			display: none;
		}

		.hamburger {
			display: flex;
		}

		.nav-mobile-menu {
			display: flex;
			flex-direction: column;
			border-top: 1px solid rgba(255, 255, 255, 0.15);
		}

		.nav-mobile-menu a {
			color: rgba(255, 255, 255, 0.9);
			text-decoration: none;
			font-weight: 500;
			padding: 0.85rem 1.25rem;
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);
			transition: background 0.15s;
		}

		.nav-mobile-menu a:hover,
		.nav-mobile-menu a.active {
			background: rgba(255, 255, 255, 0.12);
			color: white;
		}

		.mobile-menu-footer {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0.85rem 1.25rem;
		}
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
