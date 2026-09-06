# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# API base URL baked into the bundle at build time.
# On Railway, set VITE_API_URL (e.g. https://api.chengxing.org/api) as a
# build variable on the frontend service. Defaults to the nginx /api proxy.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# BACKEND_URL: upstream for the /api proxy.
# - docker-compose: http://backend:8080 (default)
# - Railway: set to the backend service public URL, or set VITE_API_URL at
#   build time and skip the proxy entirely.
ENV BACKEND_URL=http://backend:8080
EXPOSE 80
# Railway injects $PORT and routes traffic to it; default to 80 locally.
CMD ["/bin/sh", "-c", ": ${PORT:=80} && export PORT && envsubst '${BACKEND_URL} ${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
