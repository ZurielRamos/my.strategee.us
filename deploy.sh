#!/bin/bash
set -e

PROJECT_DIR="/www/wwwroot/my_strategee"

echo "==> Fixing permissions..."
sudo chown -R administrator:administrator "$PROJECT_DIR"
sudo chown -R 1000:1000 /www/server/nodejs/cache

echo "==> Pulling latest changes..."
cd "$PROJECT_DIR"
git pull

echo "==> Installing API dependencies..."
cd "$PROJECT_DIR/api"
rm -rf node_modules
npm install --legacy-peer-deps

echo "==> Building API..."
rm -f tsconfig.build.tsbuildinfo
npm run build

echo "==> Installing App dependencies..."
cd "$PROJECT_DIR/app"
rm -rf node_modules
npm install

echo "==> Building App..."
npm run build

echo "==> Starting server..."
cd "$PROJECT_DIR"
npm run start
