<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="login-container">
	<div class="login-card">
		<h1>Lincoln Tool Library</h1>
		<h2>Login</h2>

		{#if form?.success}
			<p class="success">Login successful! Redirecting...</p>
		{/if}

		<form method="POST" action="?/login">
			{#if form?.missing}
				<p class="error">All fields are required</p>
			{/if}
			{#if form?.invalid}
				<p class="error">Invalid username or password</p>
			{/if}

			<div class="form-group">
				<label for="userName">Username</label>
				<input
					id="userName"
					name="userName"
					type="text"
					required
					value={form?.userName ?? ''}
					autocomplete="username"
				/>
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					autocomplete="current-password"
				/>
			</div>

			<button type="submit" class="login-button">Log In</button>
		</form>

	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 1rem;
	}

	.login-card {
		background: white;
		padding: 2.5rem;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		width: 100%;
		max-width: 400px;
	}

	h1 {
		color: #2196f3;
		font-size: 1.75rem;
		margin: 0 0 0.5rem 0;
		text-align: center;
	}

	h2 {
		color: #333;
		font-size: 1.5rem;
		margin: 0 0 2rem 0;
		text-align: center;
		font-weight: 400;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #555;
		font-weight: 500;
		font-size: 0.95rem;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e0e0e0;
		border-radius: 6px;
		font-size: 1rem;
		transition: border-color 0.2s;
		box-sizing: border-box;
	}

	input:focus {
		outline: none;
		border-color: #2196f3;
	}

	.login-button {
		width: 100%;
		padding: 0.875rem;
		background: #2196f3;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.login-button:hover {
		background: #1976d2;
	}

	.login-button:active {
		transform: translateY(1px);
	}

	.error {
		background: #ffebee;
		color: #c62828;
		padding: 0.75rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		border-left: 4px solid #c62828;
	}

	.success {
		background: #e8f5e9;
		color: #2e7d32;
		padding: 0.75rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		border-left: 4px solid #2e7d32;
	}

	.help-text {
		margin-top: 1.5rem;
		text-align: center;
		font-size: 0.85rem;
		color: #666;
	}

	.help-text strong {
		color: #2196f3;
	}
</style>
