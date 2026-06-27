FROM --platform=linux/amd64 node:20

WORKDIR /app

COPY package*.json ./
RUN ["npm", "ci"]

COPY . .
RUN ["node", "--max-old-space-size=4096", "node_modules/vite/bin/vite.js", "build"]
RUN ["node", "build-server.mjs"]

EXPOSE 5000
CMD ["node", "dist/index.cjs"]
