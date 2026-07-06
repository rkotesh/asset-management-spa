# Build stage
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
# Set client-side variables needed for build time
ENV VITE_API_URL=/api
ENV VITE_SITE_URL=https://secure-vault.com
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist/client /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
