FROM node:20-alpine

# create a non-root user to run the app
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# copy lockfiles first so this layer is cached when only source code changes
COPY --chown=nodejs:nodejs package*.json ./
# npm ci means clean install
RUN npm ci --omit=dev

# copy source after deps
COPY --chown=nodejs:nodejs . .

# switch to non-root user
USER nodejs

# set environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]