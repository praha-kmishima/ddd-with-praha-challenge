#!/bin/bash

# マイグレーションの実行
echo "マイグレーションを実行中..."
pnpm run migration:apply

# アプリケーションの起動
echo "アプリケーションを起動中..."
pnpm run dev
