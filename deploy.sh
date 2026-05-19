#!/bin/bash
set -e

PROJECT_DIR="/www/wwwroot/my_strategee"

echo "==> Fixing permissions..."
sudo chown -R administrator:administrator "$PROJECT_DIR"
sudo chown -R 1000:1000 /www/server/nodejs/cache

echo "==> Installing pnpm if not present..."
which pnpm || sudo npm install -g pnpm

echo "==> Pulling latest changes..."
cd "$PROJECT_DIR"
git pull

echo "==> Installing and building API..."
cd "$PROJECT_DIR/api"
rm -rf node_modules
rm -f tsconfig.build.tsbuildinfo
pnpm install
pnpm run build

echo "==> Installing and building App..."
cd "$PROJECT_DIR/app"
rm -rf node_modules
npm install
npm run build

echo "==> Starting server..."
cd "$PROJECT_DIR"
npm run start
