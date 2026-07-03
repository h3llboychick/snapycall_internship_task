FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY src/client/package.json ./src/client/package.json
COPY src/server/package.json ./src/server/package.json
RUN npm ci --omit=dev --workspace @consultation-booking/server

COPY src/server ./src/server

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace", "@consultation-booking/server"]
