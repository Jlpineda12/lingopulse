# LingoPulse — English Simulator (prototipo funcional v1.1)

App móvil (Expo + React Native, también corre en web) para practicar inglés todos los días con un compañero 3D tipo Tamagotchi. Implementa las especificaciones de [`docs/01_mvp_y_modelo.md`](./docs/01_mvp_y_modelo.md), el prompt de Voice Arena [`docs/02_voice_arena_system_prompt.md`](./docs/02_voice_arena_system_prompt.md) y el esquema de Supabase [`supabase/migrations/202610130001_core.sql`](./supabase/migrations/202610130001_core.sql).

## Qué incluye

| Pestaña / pantalla | Qué hace |
|---|---|
| **Inicio** | Mascota 3D con estado de ánimo y necesidades, meta diaria (3 actividades), nivel/XP, racha, Daily Drop destacado y la práctica sugerida del día. |
| **Daily ✨** | Cada día: 1 phrasal verb, 1 verb, 1 slang, 1 adjective, 1 idiom y 1 vocabulario útil (incluye falsos amigos). Definición y uso **en inglés**, IPA, audio normal/lento, ejemplos, traducción oculta, aviso para hispanohablantes, quiz, “dilo en voz alta” con puntaje de pronunciación y vocabulario guardado. |
| **Practicar 🎯** | Catálogo filtrable por nivel (A2–C1) de las 4 habilidades. |
| Speaking | Tema con preguntas guía, frases útiles y palabras objetivo. Graba el micrófono, transcribe en vivo, permite reescuchar y corregir la transcripción. Analiza **ritmo (WPM), pausas largas, muletillas, tiempo de voz y claridad**, más gramática, vocabulario y coherencia. Modo **Pronunciación**: lees frases y se marca palabra por palabra lo que se entendió. |
| Listening | Diálogos con 2 voces, velocidad 0.75x/1x/1.15x, transcripción opcional, preguntas y **dictado corregido palabra por palabra**. |
| Reading | Lecturas con glosario en inglés al tocar palabras, velocidad de lectura, preguntas y respuesta escrita conectada a Writing. |
| Writing | Consigna, checklist, contador, palabras objetivo; corrección con explicación en inglés y español, texto corregido, mejoras de vocabulario, versión mejorada y reescritura. |
| **Mascota 🐾** | Tamagotchi 3D en web **y en el teléfono** (expo-gl). Diseño propio inspirado en Kirby: bola suave, ojos ovalados con iris y brillo, mejillas, pies grandes y una **antena con “orbe de voz”** que brilla con su energía y pulsa cuando habla. Arrastra para girarla, tócala para que salte y gire. Necesidades en anillos tipo Apple Fitness (comida, energía —sube cuando hablas inglés— y felicidad), tienda con monedas, jugar, saludar. Personalización: nombre, especie (Puff, osito, gato, conejo), color, pies, ojos y accesorios desbloqueables por nivel. Nunca muere. |
| Ruta guiada B1 | El flujo original de 4 fases (*put off*) + Voice Arena, ahora con **micrófono real** y conectado a XP/racha. |

El progreso (XP, monedas, racha, mascota, palabras guardadas) se guarda en el dispositivo (AsyncStorage / localStorage).

**Diseño:** minimalista estilo Apple con acentos dorados: títulos grandes, tarjetas sin bordes con sombras suaves, íconos Ionicons en baldosas con degradado, barra de pestañas flotante de cristal, anillos y barras animados, transiciones entre pantallas, entradas escalonadas, botones con rebote y vibración háptica en el teléfono.

### Corrección: motor local + Claude (opcional)

- **Sin configurar nada** la app funciona offline con un motor local (`packages/shared/src/practice/text-coach.ts`): ~50 reglas de errores típicos de hispanohablantes (*I am agree, people is, I have 25 years, depend of, explain me, assist to, look forward to see…*), ortografía, mayúsculas, conectores, diversidad léxica, palabras genéricas y métricas de fluidez del audio.
- **Con IA:** el backend expone `POST /api/coach/feedback`, que usa Claude (`claude-opus-5-5`, salida estructurada validada con Zod y *fallback* de servidor ante rechazos). Si Claude falla o no está activo, responde con el motor local. Fluidez y claridad siempre salen del audio medido, no del modelo.

## Cómo ejecutarlo (Mac)

El proyecto vive en la USB, pero npm/Expo funcionan mejor desde el disco interno (exFAT no soporta bien symlinks). Sincroniza y corre desde `~/Projects/EnglishApp`:

```bash
rsync -a --exclude node_modules --exclude '._*' "/Volumes/JOSE /EnglishApp/" ~/Projects/EnglishApp/ && cd ~/Projects/EnglishApp && npm install
```

App (web en el navegador, ideal en Chrome para el micrófono y la transcripción):

```bash
cd ~/Projects/EnglishApp && npm run dev:web
```

Backend opcional (puerto 4000). Para activar Claude crea `~/Projects/EnglishApp/.env` con `LLM_PROVIDER=anthropic` y `ANTHROPIC_API_KEY=...`:

```bash
cd ~/Projects/EnglishApp && npm run dev:api
```

Pruebas y tipos:

```bash
cd ~/Projects/EnglishApp && npm test && npm run typecheck
```

## Probar en el teléfono (Expo Go)

1. Instala **Expo Go** en el teléfono y conéctalo a la misma Wi‑Fi que el Mac.
2. Arranca la app y escanea el QR con la cámara (iPhone) o con Expo Go (Android):

```bash
cd ~/Projects/EnglishApp && npm run dev:mobile
```

3. La mascota 3D y la grabación funcionan directamente en Expo Go (acepta el permiso de micrófono).
4. **Transcripción en el teléfono:** Expo Go no trae reconocimiento de voz, así que el audio se envía al backend. Pon en `~/Projects/EnglishApp/.env` `STT_PROVIDER=deepgram` y `DEEPGRAM_API_KEY=...` y arranca `npm run dev:api` (la app detecta sola la IP del Mac; si macOS pregunta por el firewall, permite conexiones entrantes). Sin clave, la grabación igual se mide (duración, tiempo con voz, pausas) y puedes reescucharte y escribir lo que dijiste para el análisis de gramática y vocabulario.
5. Alternativa sin claves: abre la versión web en Chrome/Safari del teléfono. Ojo: el navegador solo permite el micrófono en `https://` o `localhost`, así que por `http://IP-del-Mac:8090` la app ofrecerá el modo texto.

## Limitaciones conocidas del prototipo

- **Micrófono:** en web usa MediaRecorder + Web Speech (Chrome/Edge/Safari; Firefox sin transcripción). En Expo Go graba con expo-av y transcribe en el backend con Deepgram (requiere clave). Para transcripción en el propio dispositivo haría falta un *development build* con `expo-speech-recognition` (necesita Xcode/EAS).
- **3D en el teléfono** usa expo-gl + Three.js. Compila para iOS y Android, pero no se pudo probar en un dispositivo real desde este Mac (no tiene Xcode/simulador): si algo se ve mal en tu teléfono, avísame con una captura.
- La “claridad” de pronunciación es la confianza del reconocedor o la coincidencia palabra a palabra en lectura en voz alta; no es una evaluación fonética certificada.
- El nivel estimado (A1–C2) es orientativo y no equivale a una certificación MCER.
- Supabase (cuentas, sincronización entre dispositivos) aún no está conectado; todo se guarda localmente.

## Estructura

```text
packages/shared/src/practice/   Contenido diario, temas, audios, lecturas, consignas y motor de corrección (+ pruebas)
apps/api/src/services/aiCoach.ts  Coach con Claude (opcional) para /api/coach/feedback
apps/mobile/App.tsx              Navegación por pestañas y onboarding
apps/mobile/src/context/GameContext.tsx  XP, monedas, racha, mascota y navegación
apps/mobile/src/hooks/useSpeechCapture.ts  Grabación, transcripción y análisis de audio
apps/mobile/src/components/Pet3D.tsx       Mascota 3D personalizable
apps/mobile/src/screens/         Inicio, Daily, Practicar, Speaking, Listening, Reading, Writing, Mascota, Lección
```

## Banco de Aprendizaje Experiencial (contenido A1–C2)

`BancodeVocabulario.txt` (raíz del proyecto) es la fuente del banco de islas temáticas. Hoy trae una isla
completa por nivel y el mapa de 90 islas (15 por nivel). Se integra solo en la app:

| Del banco | Aparece en |
|---|---|
| Speaking (2 por isla, con frases objetivo y respuesta modelo) | Islas → Isla Voz, según tu nivel |
| Listening (diálogo + preguntas) | Islas → Isla Oído, con dictado |
| Writing (tarea + estructuras sugeridas) | Islas → Isla Pluma |
| Laboratorio de Spanglish | Mini-reto Spanglish (Ruta) y minijuego Encuentra el Error |
| Caja de léxico (con IPA, uso y ejemplos) | Cofre Diario (rotación diaria y Mi vocabulario) |

**Para actualizarlo o agregar islas:** reemplaza `BancodeVocabulario.txt` (mismo formato) y ejecuta:

```bash
node packages/shared/scripts/import-experience-bank.mjs
```

El script regenera `packages/shared/src/practice/experience-bank.data.ts`; la conversión está en
`experience-bank.ts` y los tests (`npm test`) validan que respuestas, quizzes y errores sean coherentes.

## IA: corrección (Gemini) y pronunciación (Azure)

La app funciona sin IA (corrector local con ~50 reglas). Con el servidor configurado:

- **Gemini** corrige Writing y Speaking (`LLM_PROVIDER=gemini`, barato y con nivel gratuito). Claude sigue disponible con `LLM_PROVIDER=anthropic`.
- **Pronunciación con solo Google:** Gemini escucha la grabación y estima palabra por palabra y sonido por sonido (marcado como *aproximado*), con consejos en español.
- **Azure AI Speech** (opcional, plan Free F0) da la medición acústica precisa; si está configurado, tiene prioridad.
- El servidor convierte el audio con **ffmpeg** y solo responde a tu app gracias a `APP_ACCESS_KEY`.

Guía completa, desde las claves hasta instalar la app en tu celular y el de tu hermano (servidor en Google Cloud Run, APK de Android, iPhone): [`docs/05_ia_y_celulares.md`](./docs/05_ia_y_celulares.md).

## Novedades: racha, eventos, liga, islas "Grand Line" y orden

- **Racha mejorada:** escudos de racha (1 gratis por semana, máx. 2) que protegen días perdidos, hitos con monedas (3, 7, 14, 30, 60, 100, 365 días), llama que cambia de color por nivel (brasa → hoguera → infierno → azul → cósmica), celebración animada al encenderla y tarjeta para compartir. Lógica en `packages/shared/src/practice/streak.ts` (con tests).
- **Evento semanal temático** (piratas, gamers, fans, viajeros): 6 palabras con mini-quiz, carrera de 60 s, misión de speaking y un mueble exclusivo. `screens/EventScreen.tsx`, `game/events.ts`.
- **Liga semanal** de 20 jugadores (los 5 primeros suben, los 5 últimos bajan) de Bronce a Diamante. Por ahora los rivales son simulados; con un backend serían jugadores reales. `screens/LeagueScreen.tsx`, `game/league.ts`.
- **Minijuego Encuentra el Error**, tarjetas para compartir (racha, palabra, liga, casa) y recordatorios locales escritos por la mascota (solo en el teléfono).
- **Islas estilo "Grand Line":** cada isla flota en su propio mar con playa, palmeras, olas, gaviotas y un monumento distinto por mundo (Caracola Parlante, Monte Campana, Árbol del Saber, Desierto de Tinta, Arco del Tesoro, Coliseo Estelar, Cabo Faro e Isla del Cielo). La ruta es un camino punteado de mapa del tesoro con un barquito. `components/GameIslands.tsx`.
- **Más orden:** la pestaña Nami ahora tiene 4 secciones (Cuidar · Casa · Estilo · Premios), una a la vez, con un punto rojo cuando algo necesita atención. Inicio va directo a evento/liga y la ruta.

## Novedades: casa de la mascota, minijuegos y diseño propio

- **Casa de la mascota (3D):** la pestaña Mascota ahora es su hogar. 5 niveles que se desbloquean con monedas + estrellas: Campamento del Explorador → Cabaña de Madera → Casita del Valle → **Barco Pirata** → Castillo en las Nubes. 18 muebles 3D animados en 6 espacios (cama, piso, luz, pared, rincón, especial) y colecciones (Tripulación del Mar, Montañeros de Cairn, Academia Real). Código: `apps/mobile/src/pet3d/petHouse.ts`, `components/HouseSection.tsx`.
- **Minijuegos de idioma** que dan estrellas: Palabra Veloz (significados contra reloj), Oído Fino (escuchar y elegir) y Arma la Frase (ordenar palabras). Las estrellas solo cuentan la mejora del día para evitar farmeo. Código: `screens/MinigameScreen.tsx`.
- **Más modelos y personalización:** especies Zorro Explorador y Tiburón Grumete; accesorios piratas (sombrero de paja, pañuelo, parche, gorro de capitán); ropa 3D (chaleco pirata, marinero, abrigo de capitán, sudadera, bufanda); comida nueva (onigiri, banquete pirata). Diseños originales, inspirados pero sin copiar personajes de terceros.
- **Íconos propios en lugar de emojis:** `components/Glyph.tsx` dibuja en SVG (estilo sticker Nintendo/Duolingo con contorno de tinta) comida, muebles, casas, monedas, accesorios y caritas paramétricas que muestran exactamente cada ceja, boca, mejilla, ojos, especie y emoción.
- **Ideas de producto para enganchar a jóvenes:** [`docs/04_ideas_enganche_jovenes.md`](./docs/04_ideas_enganche_jovenes.md).

## Novedades: unidades diarias, mascota que nace de un huevo y publicación

**Islas = unidades (72, 12 por nivel A1–C2).** Cada isla es una unidad completa al estilo de los libros por
unidades: vocabulario → gramática → *situaciones* (4 funciones comunicativas con frases, diálogo y práctica)
→ reading → listening → speaking → writing → quiz final (10 preguntas que cambian en cada intento; se aprueba
con 70 %). Una isla nueva por día: la siguiente se abre al día siguiente y solo si la anterior está conquistada.
Contenido en `packages/shared/src/units` (`content/*.ts` y `content/lessons-*.ts`); el listening cambia de
velocidad, número de escuchas y transcripción según el nivel (`LISTENING_PROFILES`).

**Isla temática en 3D.** La isla actual del mapa y la cabecera de cada unidad muestran a la mascota actuando el
tema (saludar a un amigo, pedir un café, leer, celebrar…) con su decorado (`src/game/unitScenes.ts`,
`src/pet3d/unitSceneProps.ts`).

**Mascota.** Nace de un huevo y crece por etapas con la XP (huevo → bebé → niño → joven → adulto). El creador
estilo Mii (`src/components/MiiCreator.tsx`) permite crear personas, el chibi o animales: forma de cara, piel,
orejas, pelo y mechas, cejas, ojos, nariz, boca, barba, gafas, ropa, gorros, voz y pintura facial libre, con
ajustes de tamaño, forma, inclinación, separación y altura. La cara de las personas se dibuja en una textura
(`src/pet3d/faceTexture.ts`).

**Tutorial** interactivo para jugadores nuevos (`src/components/TutorialOverlay.tsx`), repetible desde Ajustes.

**Publicación en tiendas:** permiso previo para enviar voz/texto a IA, Ajustes con política de privacidad y
eliminación de cuenta, manifiesto de privacidad de iOS y configuración de producción. Pasos y respuestas para
los formularios en `docs/07_publicacion_tiendas.md`; política pública en `docs/privacidad.md`.

### Variables nuevas

| Variable | Dónde | Para qué |
| --- | --- | --- |
| `RATE_LIMIT_AI_PER_MIN`, `RATE_LIMIT_PER_MIN` | API | Límite de peticiones por IP (IA / general) |
| `ALLOW_OPEN_API=1` | API | Permite producción sin `APP_ACCESS_KEY` (no recomendado) |
| `AZURE_CONCURRENCY` | API | Tramos de audio evaluados en paralelo |
| `GEMINI_FAST_TRANSCRIPT=0`, `GEMINI_STT_MODEL` | API | Transcripción rápida con Gemini Flash-Lite |
| `FFMPEG_TIMEOUT_MS` | API | Tiempo máximo de conversión de audio |
| `EXPO_PUBLIC_SUPPORT_EMAIL` | App | Correo de soporte en Ajustes y en la política |
| `APP_VARIANT=development` | App (EAS) | Compilación de desarrollo con acceso a la red local |
