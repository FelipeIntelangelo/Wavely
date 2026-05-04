# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código y el archivo .env si existe
COPY . .

# Construir la aplicación Angular
RUN npm run build

# Serve stage
FROM nginx:alpine

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos generados por Angular
# Asegurate de que la ruta coincida con el nombre de tu proyecto en angular.json
COPY --from=build /app/dist/tpf/browser /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
