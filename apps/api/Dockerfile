FROM node:22-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN cd apps/api && npx prisma generate
RUN pnpm --filter api build

ENV NODE_ENV=production
EXPOSE 3001
WORKDIR /app/apps/api
CMD ["node", "dist/src/main.js"]
