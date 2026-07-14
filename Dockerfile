# Imagen de desarrollo local (Docker Compose). No apta para producción: no es
# multi-stage y usa `npm run start:dev` en watch mode a propósito.
#
# Sin `RUN npx prisma generate` en build time a propósito: prisma.config.ts
# exige DATABASE_URL para cargarse, y esa variable no existe en build time
# (no se copia .env al build context). El entrypoint ya corre `prisma
# generate` en cada arranque, con la DATABASE_URL real que inyecta compose,
# antes de exec'ar el CMD — no hace falta duplicarlo aquí.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]
