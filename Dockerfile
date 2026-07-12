# ============================================
# Stage 1: Dependencies (Yarn 4 / Berry)
# ============================================
FROM node:20-alpine AS deps

# Yarn Berry (4.x) 사용을 위해 corepack 활성화
RUN corepack enable

WORKDIR /app

# 의존성 정의 파일만 먼저 복사 (Docker 레이어 캐시 극대화)
# 소스코드 변경 시에도 lockfile이 안 바뀌면 이 스테이지는 캐시 재사용
COPY package.json yarn.lock .yarnrc.yml ./

# --immutable: lockfile 변경 방지 (프로덕션 빌드 안전장치)
# yarn 4 는 corepack 이 제공하므로 .yarn/ 를 repo 에 두지 않는다(gitignore).
RUN yarn install --immutable

# ============================================
# Stage 2: Builder (Next.js standalone build)
# ============================================
FROM node:20-alpine AS builder

RUN corepack enable

WORKDIR /app

# deps 스테이지에서 설치된 node_modules 재사용
COPY --from=deps /app/node_modules ./node_modules

# 소스코드 전체 복사
COPY . .

# Next.js standalone 빌드 (next.config.ts의 output: 'standalone' 활용)
# 결과: .next/standalone/server.js (최소 서버) + .next/static (정적 자산)
RUN yarn build

# ============================================
# Stage 3: Runner (production runtime)
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 보안: root 아닌 전용 유저로 실행
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# standalone 서버: Node 최소 서버 + tree-shake된 의존성만 포함
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# 정적 파일 (public/)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Next.js 빌드 산출물 (JS/CSS chunks, 이미지 최적화 결과 등)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# standalone 빌드가 만들어준 진입점
CMD ["node", "server.js"]
