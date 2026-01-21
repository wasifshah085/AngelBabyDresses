module.exports = {
  apps: [
    {
      name: 'angel-backend',
      script: './server/server.js',
      cwd: '/root/AngelBabyDresses',

      // Cluster mode for better performance (use all CPU cores)
      instances: 'max', // Will use 2 instances on your 2-core VPS
      exec_mode: 'cluster',

      // Memory management - CRITICAL for preventing OOM crashes
      max_memory_restart: '500M', // Restart if memory exceeds 500MB per instance

      // Auto-restart configuration
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000, // Wait 4 seconds between restarts

      // Graceful shutdown
      kill_timeout: 5000, // 5 seconds to gracefully shutdown
      wait_ready: true,
      listen_timeout: 10000,

      // Environment
      node_args: '--max-old-space-size=512', // Limit Node.js heap to 512MB
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },

      // Logging
      error_file: '/root/.pm2/logs/angel-backend-error.log',
      out_file: '/root/.pm2/logs/angel-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Log rotation (keep logs manageable)
      log_type: 'json',

      // Exponential backoff restart delay
      exp_backoff_restart_delay: 100
    }
  ]
};
