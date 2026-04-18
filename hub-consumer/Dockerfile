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
COPY hub-consumer ./hub-consumer
COPY shared-types ./shared-types

# Build
RUN npm run build --workspace=shared-types || true
RUN npm run build --workspace=hub-consumer

# PRODUCTION STAGE
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built files and production node_modules from base
COPY --from=base /app/package*.json ./
COPY --from=base /app/hub-consumer/package*.json ./hub-consumer/
COPY --from=base /app/shared-types/package*.json ./shared-types/
COPY --from=base /app/hub-consumer/dist ./hub-consumer/dist
COPY --from=base /app/shared-types/dist ./shared-types/

# Install only production dependencies
RUN npm install --omit=dev --workspace=hub-consumer

CMD ["npm", "start", "--workspace=hub-consumer"]
