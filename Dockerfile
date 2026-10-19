# Servidor de IA de LingoPulse (apps/api) listo para la nube
# (Google Cloud Run, Railway, Fly.io…). Solo instala el backend y el paquete compartido:
# la app móvil no entra en la imagen.
#
#   Cloud Run:  gcloud run deploy lingopulse-api --source . --region us-central1 --allow-unauthenticated
#
# Variables de entorno (se configuran en la plataforma, NUNCA dentro de la imagen):
#   APP_ACCESS_KEY, LLM_PROVIDER=gemini, GEMINI_API_KEY, AZURE_SPEECH_KEY, AZURE_SPEECH_REGION

FROM node:22-slim

# ffmpeg convierte el audio del celular (m4a/3gp/webm) a WAV 16 kHz para Azure y Gemini.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Manifiestos primero para aprovechar la caché de capas.
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/mobile/package.json apps/mobile/
RUN npm ci --workspace @lingopulse/api --workspace @lingopulse/shared --include-workspace-root=false --no-audit --no-fund

COPY packages/shared packages/shared
COPY apps/api apps/api

# Cloud Run inyecta PORT (8080); localmente se usa 4000. En producción no se guardan grabaciones.
ENV PORT=8080 NODE_ENV=production
EXPOSE 8080
CMD ["npm", "run", "start", "--workspace", "@lingopulse/api"]
