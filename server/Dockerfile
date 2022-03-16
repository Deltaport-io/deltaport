FROM node:16-alpine

RUN apk --no-cache --virtual build-dependencies add make gcc g++ python3

WORKDIR /backend

COPY . .

RUN npm install --production

RUN npm run build