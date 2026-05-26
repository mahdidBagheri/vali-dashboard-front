# ------------------------------------------------------------
# Stage 1: Build Vite app
# ------------------------------------------------------------
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV VITE_RLLD_DISABLE=1

RUN npm run build


# ------------------------------------------------------------
# Stage 2: Nginx server
# ------------------------------------------------------------
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
