# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY templates ./templates

# Build
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files and templates from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/templates ./templates

# Create output directory
RUN mkdir -p /app/output

# Set environment
ENV NODE_ENV=production

# Default command
ENTRYPOINT ["node", "dist/cli.js"]
CMD ["--help"]
