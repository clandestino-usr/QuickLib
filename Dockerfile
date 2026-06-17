# node:sqlite is built-in since Node 24 — no native compilation needed
FROM node:24-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src/    ./src/
COPY public/ ./public/

ENV PORT=9095
ENV NODE_ENV=production
ENV NODE_NO_WARNINGS=1

EXPOSE 9095

USER node
CMD ["node", "src/app.js"]
