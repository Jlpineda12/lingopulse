# Publicar LingoPulse en App Store y Google Play

Lista de lo que ya está listo en el código y de lo que hay que hacer en las consolas de las tiendas.

## Ya resuelto en la app

| Requisito | Dónde |
| --- | --- |
| Pedir permiso antes de enviar voz/texto a IA de terceros (App Store 5.1.2(i)) | `src/components/AiConsentModal.tsx`, `src/services/aiConsent.ts` |
| Retirar ese permiso y seguir usando la app (corrector sin conexión) | Ajustes → *Retirar permiso de IA* |
| Eliminar cuenta y **todos** los datos desde la app (App Store 5.1.1(v), Play "Account deletion") | Ajustes → *Eliminar cuenta* (`deleteAccount` borra progreso, mascota y estadísticas) |
| Política de privacidad dentro de la app | Ajustes → *Política de privacidad* (`PrivacyScreen`) |
| Texto de permiso de micrófono claro | `app.json` → `NSMicrophoneUsageDescription` / plugin `expo-audio` |
| Sin `NSAllowsArbitraryLoads` ni red local en producción | `app.json` (solo `NSAllowsLocalNetworking`); el modo dev se activa con `APP_VARIANT=development` en `app.config.js` |
| Manifiesto de privacidad de iOS | `app.json` → `ios.privacyManifests` (audio y contenido del usuario, sin rastreo) |
| Sin anuncios, sin rastreo, sin login con terceros | No hay SDKs de publicidad ni analítica |
| Cifrado estándar | `ITSAppUsesNonExemptEncryption: false` |
| Versión y compilación | `version` 1.0.0, `ios.buildNumber` 1, `android.versionCode` 1 (EAS `autoIncrement` en producción) |
| Permisos de Android mínimos | solo `RECORD_AUDIO`; se bloquean almacenamiento externo y superposición |

## Antes de enviar

1. **Servidor en HTTPS.** Publica `apps/api` con un dominio y certificado. En `eas.json` → `production.env`
   pon `EXPO_PUBLIC_API_URL` (https) y `EXPO_PUBLIC_APP_KEY`. En el servidor: `APP_ACCESS_KEY` y `NODE_ENV=production`.
2. **Correo de soporte.** `EXPO_PUBLIC_SUPPORT_EMAIL` en `eas.json` (aparece en Ajustes y en la política).
3. **Política de privacidad pública.** Publica `docs/privacidad.md` (por ejemplo con GitHub Pages) y usa esa URL
   en App Store Connect y en Play Console.
4. **Iconos y capturas.** Icono 1024×1024 sin transparencia (iOS) e icono adaptable (Android, ya configurado).
   Capturas: iPhone 6.9" y 6.5", iPad 13" (si se mantiene `supportsTablet`), teléfono Android y tablet 7"/10".
   Sugerencia de capturas: creador de personaje, isla temática con la mascota, unidad (vocabulario/funciones),
   speaking con puntuación, mascota con su casa.
5. **Compilar y enviar:** `eas build -p ios --profile production`, `eas build -p android --profile production`,
   `eas submit -p ios`, `eas submit -p android`.

## Respuestas para los formularios

**Clasificación por edad:** 12+ en App Store (contenido generado por usuarios: no; IA conversacional limitada a
corrección de inglés). En Play: cuestionario IARC → "Educación", sin violencia, sin compras, sin chat entre usuarios.
Público objetivo: 13+ (no marcar "diseñada para niños").

**App Privacy (App Store):**
- *Audio Data* — recopilado, no vinculado a la identidad, no usado para rastreo, propósito: funcionalidad de la app.
- *Other User Content* (textos de writing) — igual que el audio.
- Todo lo demás (nombre de jugador, progreso, mascota) se queda en el dispositivo: **no se recopila**.

**Data safety (Google Play):**
- Datos recopilados: *Audio → Grabaciones de voz* y *Mensajes de la app → Otro contenido*; procesados de forma
  efímera, cifrados en tránsito, no compartidos con fines publicitarios; el usuario puede pedir que no se envíen
  (retirar permiso de IA).
- Eliminación de datos: dentro de la app (Ajustes → Eliminar cuenta).

**Revisión de Apple — notas para el revisor:** "No se requiere cuenta en un servidor: el jugador se crea en el
dispositivo. Para probar la corrección por voz, acepte el permiso de IA al grabar en cualquier actividad de speaking."

## Comprobaciones finales

- `cd packages/shared && npm test` y `cd apps/api && npm test` en verde.
- `cd apps/mobile && npx tsc --noEmit`.
- Prueba en dispositivo real: registro → tutorial → primera isla → grabar voz (aparece el permiso de IA) →
  quiz → eclosión del huevo → Ajustes → eliminar cuenta.
