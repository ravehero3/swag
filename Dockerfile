FROM node:20

WORKDIR /app

COPY package*.json ./
RUN ["npm", "ci"]

COPY . .
RUN ["node_modules/.bin/vite", "build"]
RUN ["node", "build-server.mjs"]

EXPOSE 5000
CMD ["node", "dist/index.cjs"]
