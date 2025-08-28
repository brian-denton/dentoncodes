/**
 * PM2 ecosystem config for hosting the Next.js app in production.
 *
 * Usage:
 *  1) Build:      pnpm build
 *  2) Start PM2:  pm2 start ecosystem.config.js --env production
 *  3) Inspect:    pm2 status
 *  4) Logs:       pm2 logs dentoncodes
 *  5) Persist:    pm2 save && pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'dentoncodes',
      script: 'node_modules/next/dist/bin/next',
      args: 'start', // uses PORT env below
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      // process management
      instances: 1, // change to 'max' for multi-core
      exec_mode: 'fork', // change to 'cluster' if desired
      watch: false,
      autorestart: true,
      max_restarts: 10,
      // logging
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}

