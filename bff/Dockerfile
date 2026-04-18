# BASE STAGE
FROM node:22-alpine AS base
WORKDIR /app

# Copy root configs
COPY package*.json ./
COPY tsconfig.json ./

# Copy workspaces configs
COPY hub-consumer/package*.json ./hub-consumer/
COPY hub-core/package*.json ./hub-core/
COPY bff/package*.json ./bff/
COPY shared-types/package*.json ./shared-types/

# Install dependencies
RUN npm install

# Copy source code
COPY bff ./bff
COPY shared-types ./shared-types

# Build shared types first, then bff
RUN npm run build --workspace=shared-types || true
RUN npm run build --workspace=bff

# PRODUCTION STAGE
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built files and production node_modules from base
COPY --from=base /app/package*.json ./
COPY --from=base /app/bff/package*.json ./bff/
COPY --from=base /app/shared-types/package*.json ./shared-types/
COPY --from=base /app/bff/dist ./bff/dist
COPY --from=base /app/shared-types/dist ./shared-types/dist

# Install only production dependencies
RUN npm install --omit=dev --workspace=bff

EXPOSE 4000

CMD ["npm", "start", "--workspace=bff"]
