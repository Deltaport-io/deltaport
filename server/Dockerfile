FROM node:16-alpine

RUN apk --no-cache --virtual build-dependencies add make gcc g++ python3

RUN ln -s /usr/bin/python3 /usr/bin/python & \
    ln -s /usr/bin/pip3 /usr/bin/pip

WORKDIR /backend

COPY . .

RUN npm install

RUN npm run build