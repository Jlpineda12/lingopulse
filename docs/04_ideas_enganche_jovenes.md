# Ideas para que LingoPulse enganche a jóvenes (y enseñe inglés de verdad)

Principio rector: **el juego es la excusa, la práctica es el producto.** Cada mecánica debe obligar a *usar* inglés (hablar, escribir, escuchar, leer) y no solo a tocar botones. La mascota y la casa son la razón para volver; el aprendizaje es lo que hace que valga la pena volver.

## 1. Un bucle diario de 5 minutos que se siente como juego

| Momento | Qué pasa | Por qué engancha |
|---|---|---|
| Abrir la app | La mascota te recibe con una reacción distinta según cómo la dejaste (dormida, con hambre, aburrida). | Curiosidad tipo Tamagotchi: "¿cómo estará hoy?" |
| Daily Drop | 6 palabras/expresiones del día con quiz de 10 s cada una. | Ritual corto, sensación de progreso inmediato. |
| 1 misión | Una actividad de speaking, listening, reading o writing. | El núcleo de aprendizaje real. |
| Recompensa | Monedas, estrellas, XP y una reacción grande de la mascota. | Cierre satisfactorio, ganas de repetir. |
| Casa | Comprar/colocar un mueble o ahorrar para la siguiente casa. | Meta a mediano plazo visible. |

**Regla:** que la racha se cuente con *una* misión al día. Si es difícil mantenerla, la gente abandona.

## 2. Mecánicas de retención (las que funcionan con jóvenes)

1. **Racha con "escudo"**: 1 escudo gratis por semana que protege la racha si fallas un día. Reduce el abandono por culpa.
2. **Eventos semanales temáticos**: "Semana Pirata" (vocabulario de viajes y mar, muebles del barco), "Semana Gamer" (slang de videojuegos), "Semana K-pop / Anime" (expresiones de fans). Contenido nuevo cada lunes = razón para volver.
3. **Colecciones**: completar sets (Tripulación del Mar, Montañeros, Academia Real) da un objeto exclusivo animado. A los jóvenes les encanta "completar el álbum".
4. **Cofres sorpresa por racha** (ya existe): añadir rarezas (común, raro, épico) con animación de apertura.
5. **Visitas de amigos**: tu mascota "visita" la casa de un amigo y vuelve con un regalo. Tomodachi Life puro.
6. **Notificaciones con personalidad**: escritas por la mascota y en inglés fácil ("I'm hungry… and I learned a new slang word!"), no "¡Practica hoy!".
7. **Modo historia por islas**: cada isla tiene un mini-capítulo (ej. "Rescatar al loro del capitán") que se desbloquea completando misiones.

## 3. Social sin toxicidad

- **Duo de racha** con un amigo (ya está en el roadmap): ambos practican para mantener una llama compartida.
- **Liga semanal de 20 personas** por nivel, sin chat abierto (evita moderación compleja). Suben/bajan de liga por XP.
- **Compartir tarjetas**: "Mi mascota aprendió *spill the tea* hoy" con la imagen 3D, lista para Instagram/TikTok. Marketing gratis.
- **Retos de voz entre amigos**: misma frase, gana quien tenga mejor pronunciación (puntuación del modo "Pronunciación").

## 4. Contenido que les importa

- Slang real y actual por regiones (US/UK), memes en inglés, letras de canciones explicadas (con licencia o fragmentos cortos).
- Temas de speaking sobre su vida: videojuegos, series, redes sociales, viajes, trabajo de verano, entrevistas para su primer empleo.
- **"Explícale a tu mascota"**: el usuario explica en inglés algo de su día; la mascota responde con una pregunta. Practica speaking sin presión de un humano.
- Minijuegos rápidos y variados (ya hay 3): añadir **"Spelling Bee"** (dictado de letras), **"Encuentra el error"** (frases con errores típicos de hispanohablantes) y **"Karaoke"** (shadowing con ritmo).

## 5. Que el aprendizaje sea real (para que los padres/escuelas también la recomienden)

- **Repaso espaciado** de las palabras guardadas: vuelven en minijuegos días después (ya existe FSRS en la base).
- **Informe semanal** para el usuario: palabras nuevas usadas al hablar, errores corregidos, minutos de voz. "Esta semana dijiste *figure out* 4 veces".
- **Feedback de IA en speaking y writing** (ya integrado con Claude en el backend) con correcciones claras y una "versión mejorada".
- **Nivel estimado** visible y honesto (no es certificación), con metas: "Te faltan 3 misiones B1 para desbloquear B2".

## 6. Monetización ética (si se monetiza)

- Suscripción "Plus": feedback ilimitado de IA, más temas, eventos exclusivos y escudos extra de racha.
- Cosméticos (ropa, muebles, casas especiales) comprables, **nunca** ventaja de aprendizaje pagada.
- Sin cajas de botín pagadas (problemas legales y de confianza con menores).
- Respeta tiempos: recordatorio de descanso tras 30 min y modo "solo práctica" sin distracciones.

## 7. Qué medir

- Retención D1, D7, D30 y % de usuarios con racha ≥ 7 días.
- Minutos de **voz válida** por usuario y semana (la métrica que más predice fluidez).
- % de palabras del Daily Drop que el usuario **usa luego** al hablar o escribir.
- Conversión a compartir tarjetas y a duos de racha.

## 8. Prioridad sugerida (próximas 6 semanas)

1. Escudo de racha + notificaciones con personalidad de la mascota.
2. Evento semanal "Semana Pirata" con 10 palabras, 2 muebles y un minijuego.
3. Tarjetas para compartir en redes con la mascota 3D.
4. Liga semanal y duo de racha (requiere backend con cuentas reales: Supabase).
5. Minijuego "Encuentra el error" usando el motor de corrección existente.

## Nota sobre propiedad intelectual

Las colecciones están **inspiradas** en estilos populares (Tomodachi Life, aventuras piratas, juegos de escalada como Cairn), pero los diseños son propios. Para publicar la app, evita nombres, logos o personajes reconocibles de terceros (por ejemplo, Kirby, Luffy, Mr. Meeseeks o Pokémon): por eso los nombres sugeridos y la colección pirata usan diseños genéricos y originales.

## Estado de implementación (17 oct 2026)

- Hecho: escudos e hitos de racha con celebración animada, evento semanal con premio exclusivo, liga semanal (rivales simulados), minijuegos Encuentra el Error y Carrera del Evento, tarjetas para compartir, recordatorios locales de la mascota y casa mejorable.
- Pendiente (requiere backend con cuentas reales, p. ej. Supabase): dúo de racha con un amigo y liga contra jugadores reales.
