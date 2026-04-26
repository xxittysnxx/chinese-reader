# Step 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Step 2: Serve the application with Nginx
FROM nginx:alpine
# Copy the custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output to Nginx's html directory
# Copy the build output to Nginx's html directory under /library
COPY --from=build /app/dist /usr/share/nginx/html/library

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
