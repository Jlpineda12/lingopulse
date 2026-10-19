# LingoPulse en tu celular (y el de tu hermano) con IA

Objetivo: que la app funcione **sin tu Mac encendido**, corrigiendo speaking, writing y pronunciación.

```
 Celular (app LingoPulse)  ──►  Tu servidor en la nube (Google Cloud Run)  ──►  Gemini (corrige textos)
        clave privada de la app             guarda las claves secretas           Azure Speech (pronunciación)
```

Las claves de IA **nunca** van dentro de la app: viven en el servidor. La app solo lleva una
"clave de la app" (`APP_ACCESS_KEY`) para que nadie más use tu servidor.

## Qué IA hace cada cosa

| Tarea | Servicio | Costo para uso personal |
|---|---|---|
| Corregir writing y speaking (gramática, vocabulario, versión mejorada) | **Gemini** (Google AI Studio) | Nivel gratuito con límites diarios; si lo superas, pago por uso y barato |
| Pronunciación **aproximada** (Gemini escucha el audio y señala palabras y sonidos) | **Gemini** — la misma clave de Google | Incluido en el nivel gratuito de Gemini |
| Pronunciación **precisa** (medición acústica por sonido) — opcional | **Azure AI Speech** (plan Free F0) | 5 h de audio al mes gratis; el plan F0 no cobra, se detiene al llegar al límite |
| Transcribir tu voz | Azure (o Gemini si no hay Azure) | Incluido en lo anterior |
| Servidor | **Google Cloud Run** | Nivel gratuito mensual; para 2 personas normalmente queda dentro |

> Revisa los límites y precios actuales en cada página antes de activar: cambian con el tiempo.
> Tu suscripción **Google AI Pro** es para la app de Gemini; **no** incluye la API. La API se activa
> aparte en AI Studio (tiene nivel gratuito). En el nivel gratuito Google puede usar lo que envías para
> mejorar sus productos; si te importa, activa la facturación para pasar al nivel pagado.

**Con las dos claves (recomendado)** la pronunciación funciona en dos fases: en ~1 s ves la medición
acústica de Azure (fluidez, entonación, sonidos) y en ~5-15 s Gemini la afina en segundo plano: agrega los
errores típicos que la medición acústica deja pasar ("tink" por "think", "bery" por "very") con consejos en
español, y en habla libre trae la transcripción literal con tus errores para corregirlos.

**Con solo la clave de Google ya funciona todo:** corrección de writing y speaking, transcripción y
pronunciación aproximada (la app la marca como "Estimación de IA · aproximada"). Si algún día agregas Azure,
la pronunciación pasa sola a la medición precisa.

Sin ninguna clave la app sigue funcionando con su corrector local (reglas), solo que menos preciso.

> Las claves nuevas de Google empiezan con `AQ.` (antes `AIza…`): es normal y funcionan con la app.
> En el nivel gratuito Gemini a veces responde "alta demanda": el servidor reintenta y, si hace falta,
> usa el modelo Flash-Lite automáticamente.

---

## Paso 1 · Conseguir las claves (≈10 min)

1. **Gemini:** entra a https://aistudio.google.com/apikey con tu cuenta de Google → *Create API key* → cópiala.
2. **Azure Speech (opcional, para pronunciación precisa):**
   1. Crea una cuenta en https://portal.azure.com (puede pedir tarjeta para verificar identidad).
   2. *Crear un recurso* → busca **"Speech"** (Servicios de Voz / Azure AI Speech) → *Crear*.
   3. Región: **East US** · Plan de tarifa: **Free F0** → *Revisar y crear*.
   4. En el recurso → *Claves y punto de conexión* → copia **Clave 1** y la **Ubicación/Región** (ej. `eastus`).
3. **Clave de la app:** invéntala larga. En la Terminal del Mac:
   ```bash
   openssl rand -hex 24
   ```

## Paso 2 · Probar en casa con el Mac (opcional pero recomendado)

1. En `~/Projects/EnglishApp`, copia `.env.example` como `.env` y llena:
   `APP_ACCESS_KEY`, `LLM_PROVIDER=gemini`, `GEMINI_API_KEY`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`.
2. Crea `apps/mobile/.env` con la misma clave de la app:
   ```
   EXPO_PUBLIC_APP_KEY=la-misma-que-APP_ACCESS_KEY
   ```
3. Arranca el servidor (necesita ffmpeg: `brew install ffmpeg`, ya lo tienes):
   ```bash
   npm run dev:api
   ```
4. Abre la app en Expo Go (misma Wi-Fi). En **Speaking → Pronunciación** graba una frase: deben aparecer las
   palabras en colores y, al tocarlas, los sonidos con su consejo.

## Paso 3 · Subir el servidor a la nube (Google Cloud Run)

1. Instala la herramienta de Google y entra con tu cuenta:
   ```bash
   brew install --cask google-cloud-sdk
   gcloud init
   ```
   Crea un proyecto nuevo cuando te lo pida (ej. `lingopulse`) y activa la **facturación** en
   https://console.cloud.google.com/billing (Cloud Run la exige aunque te quedes en el nivel gratuito).
2. Desde la carpeta del proyecto **en el Mac** (`~/Projects/EnglishApp`, no la USB):
   ```bash
   gcloud run deploy lingopulse-api --source . --region us-central1 --allow-unauthenticated --set-env-vars APP_ACCESS_KEY=TU_CLAVE_APP,LLM_PROVIDER=gemini,GEMINI_API_KEY=TU_CLAVE_GEMINI
   ```
   Si después agregas Azure, añade `,AZURE_SPEECH_KEY=…,AZURE_SPEECH_REGION=eastus` al final.
   Usa el `Dockerfile` del proyecto (incluye ffmpeg). Al final muestra una URL tipo
   `https://lingopulse-api-xxxx.us-central1.run.app`.
3. Comprueba en el navegador: `https://TU-URL/api/health` → debe decir `"status":"ok"`.
4. (Recomendado) En la consola de Google Cloud → *Facturación → Presupuestos*, crea un presupuesto de
   5 USD con alertas por correo, para estar tranquilo.

## Paso 4 · Instalar la app en los celulares

Primero pon la URL y la clave en `apps/mobile/eas.json` (perfil `preview`):
```json
"env": {
  "EXPO_PUBLIC_API_URL": "https://lingopulse-api-xxxx.us-central1.run.app",
  "EXPO_PUBLIC_APP_KEY": "TU_CLAVE_APP"
}
```
y crea una cuenta gratis en https://expo.dev. Luego, en `~/Projects/EnglishApp/apps/mobile`:

```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Android (gratis)
```bash
eas build -p android --profile preview
```
Al terminar te da un enlace/QR: ábrelo en el celular, descarga el `.apk` e instálalo
(Android pedirá permitir "instalar apps de origen desconocido").

### iPhone
Apple no deja instalar apps fuera de la App Store sin su permiso. Dos caminos:

| Opción | Costo | Cómo | Limitación |
|---|---|---|---|
| **Xcode + tu Apple ID gratis** | Gratis | Conecta el iPhone por cable y en `apps/mobile`: `npx expo run:ios --device --configuration Release` | La app caduca a los **7 días** y hay que volver a instalarla desde el Mac |
| **Apple Developer Program** | 99 USD/año | `eas device:create` (registra el iPhone de cada uno) y luego `eas build -p ios --profile preview` | Dura un año; sirve para tu iPhone y el de tu hermano |

Para `expo run:ios` en modo local, la URL y la clave se leen de `apps/mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://lingopulse-api-xxxx.us-central1.run.app
EXPO_PUBLIC_APP_KEY=TU_CLAVE_APP
```

> Si EAS dice que el identificador `com.lingopulse.app` ya está en uso, cámbialo en `app.json`
> (por ejemplo `com.tunombre.lingopulse`).

## Cómo saber que la IA está activa

- En la corrección de Writing/Speaking aparece la etiqueta **"IA Gemini"** (en vez de "Motor local").
- En Speaking → Pronunciación y en Cofre Diario → "3 · Dilo" aparecen las palabras en colores con puntaje.
- `https://TU-URL/api/coach/status` (con la cabecera `X-App-Key`) responde `"provider":"gemini"`.
