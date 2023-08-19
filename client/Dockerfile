FROM node:18-alpine as builder 

RUN apk --no-cache --virtual build-dependencies add make gcc g++ python3

WORKDIR /client

COPY . .

RUN npm install

ARG REACT_APP_API_URI
RUN REACT_APP_API_URI=$REACT_APP_API_URI npm run build

FROM nginx:1.21.4-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d

COPY --from=builder /client/build /usr/share/nginx/html