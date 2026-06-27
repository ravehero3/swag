FROM node:20-slim

ENV PATH=/usr/local/bin:$PATH

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
        openssl \
        python3 \
        make \
        g++ \
        && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["node", "dist/index.cjs"]
