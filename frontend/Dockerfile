# Étape 1 : compilation de React
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build    # produit le dossier dist/

# Étape 2 : image finale = Nginx + fichiers compilés (ni Node ni node_modules)
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# La configuration Nginx est fournie par docker-compose.prod.yml (gabarits du dossier nginx/).
