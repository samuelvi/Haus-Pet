# Stage 1: Use the official Node.js image as a base.
# Using slim for better compatibility with native dependencies like Prisma.
FROM node:22-slim

# Install OpenSSL and other dependencies needed by Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Pin the npm version to ensure consistency.
RUN npm install -g npm@11.6.2

# Set the working directory inside the container.
WORKDIR /app

# The image is now just a base environment.
# The source code will be mounted via docker-compose, and dependencies will be installed on startup.
