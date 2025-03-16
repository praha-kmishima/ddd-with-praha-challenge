# ベースイメージとしてNode.jsを使用
FROM node:20.18.3-slim

# 作業ディレクトリを設定
WORKDIR /app

# パッケージファイルをコピー
COPY package.json pnpm-lock.yaml ./

# pnpmのインストール
RUN npm install -g pnpm@9.15.6

# 依存関係をインストール
RUN pnpm install

# 開発用サーバの起動
CMD ["pnpm", "run", "dev"]
