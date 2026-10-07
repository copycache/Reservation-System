#!/bin/bash

set -e

export COMPOSER_ALLOW_SUPERUSER=1

PROJECT="/var/www/reservation-system"

echo "===== Starting deployment ====="

cd "$PROJECT"

echo "===== Pulling latest code ====="
git pull origin main

echo "===== Updating Laravel ====="
cd "$PROJECT/backend"

composer install --no-dev --optimize-autoloader

php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "===== Building Next.js ====="
cd "$PROJECT/frontend"

npm install
npm run build

echo "===== Restarting applications ====="

pm2 restart ecosystem.config.cjs

echo "===== Deployment completed ====="
