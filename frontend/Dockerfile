# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# nginx serves the SPA and proxies /api to the API service, so the browser sees one origin
# and the refresh-token cookie stays first-party.
FROM nginx:1.27-alpine
ENV PORT=8080
ENV API_UPSTREAM=http://localhost:5080
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
