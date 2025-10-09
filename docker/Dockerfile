# Stage 1: Use the official Node.js image as a base.
# Using alpine for a smaller image size.
FROM node:22-alpine

# Pin the npm version to ensure consistency.
RUN npm install -g npm@11.6.1

# Set the working directory inside the container.
WORKDIR /app

# The image is now just a base environment.
# The source code will be mounted via docker-compose, and dependencies will be installed on startup.
