module.exports = {
	apps: [
		{
			name: 'library-management',
			script: 'build/index.js',
			cwd: '/root/library-management',
			instances: 1,
			exec_mode: 'fork',
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			env: {
				NODE_ENV: 'production',
				PORT: 3000,
				BODY_SIZE_LIMIT: 26214400  // 25MB for multiple pictures?  
			},
			error_file: 'logs/error.log',
			out_file: 'logs/out.log',
			log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
			merge_logs: true,
			// Crash recovery settings
			min_uptime: '10s', // Consider app crashed if it runs less than 10s
			max_restarts: 10, // Max restarts within 1 minute before stopping
			restart_delay: 4000, // Wait 4 seconds before restart
			// Graceful shutdown
			kill_timeout: 5000,
			listen_timeout: 5000,
			// Health check (optional - requires custom implementation)
			// exp_backoff_restart_delay: 100
		}
	]
};
