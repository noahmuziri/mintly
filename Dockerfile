# Runs Mintly with no dependencies. Mount a volume at /data so accounts survive redeploys.
FROM node:20-alpine
WORKDIR /app
COPY . .
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8000 DATA_DIR=/data
VOLUME /data
EXPOSE 8000
USER node
CMD ["node", "server.js"]
