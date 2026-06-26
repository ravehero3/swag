FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY package*.json ./
# ARG CACHEBUST forces npm install to re-run on every build (prevents stale cache)
ARG CACHEBUST=1
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "run", "start"]
