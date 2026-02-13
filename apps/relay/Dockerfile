FROM node:20-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY src/ ./src/
RUN npx tsc

FROM node:20-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src/db/schema.ts ./src/db/schema.ts
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY package.json ./
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["./entrypoint.sh"]
