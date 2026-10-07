module.exports = {
  apps: [
    {
      name: "reservation-API",      
      cwd: "/var/www/reservation-system/backend",
      script: "php",
      args: "artisan serve --host=0.0.0.0 --port=8000",
      interpreter: "none",
      autorestart: true,
      watch: false,
    },

    {
      name: "reservation-frontend",
      cwd: "/var/www/reservation-system/frontend",
      script: "npm",
      args: "start -- -H 0.0.0.0 -p 3000",
      interpreter: "none",
      autorestart: true,
      watch: false,
    }
  ]
};
