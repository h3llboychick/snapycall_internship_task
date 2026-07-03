FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY src/client/package.json ./src/client/package.json
COPY src/server/package.json ./src/server/package.json
RUN npm ci --workspace @consultation-booking/client

COPY src/client ./src/client

RUN npm run build --workspace @consultation-booking/client

FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/src/client/dist /usr/share/nginx/html

EXPOSE 80
