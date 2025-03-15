FROM node:20.18.3-slim

WORKDIR /app

# pnpmのインストール
RUN npm install -g pnpm@9.15.6

# パッケージファイルのコピー
COPY package.json pnpm-lock.yaml ./

# 依存関係のインストール
RUN pnpm install

# ソースコードのコピー
COPY . .

# ビルド
RUN pnpm run build

EXPOSE 3000

# アプリケーション起動
CMD ["pnpm", "run", "start"]
