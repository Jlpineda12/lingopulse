# Revisión de islas generadas con IA (Gemini)

Generadas: **8** · aprobadas: **0**. Este contenido NO aparece en la app hasta que se aprueba. Para aprobar, dile a Claude qué islas aprobar (o "todas"), o ejecuta `node packages/shared/scripts/review-islands.mjs approve --all`.

Qué revisar: que el inglés sea natural y correcto, que las respuestas del listening sean las correctas, que los errores de Spanglish sean reales y que el vocabulario corresponda al nivel.

| Nivel | ID | Isla | Estado | Avisos |
|---|---|---|---|---|
| A1 | A1-ISL-01 | Arrival & Border Control | ⏳ pendiente | — |
| A1 | A1-ISL-03 | Roommates & Living Spaces | ⏳ pendiente | — |
| A1 | A1-ISL-04 | Daily Rhythms & Commute | ⏳ pendiente | — |
| A2 | A2-ISL-01 | Baggage Claim & Hotels | ⏳ pendiente | — |
| A2 | A2-ISL-02 | Workplace Collaboration | ⏳ pendiente | — |
| B1 | B1-ISL-01 | Personality Types & Friendships | ⏳ pendiente | — |
| B1 | B1-ISL-02 | Urban Legends & Unexplained Mysteries | ⏳ pendiente | — |
| B2 | B2-ISL-01 | The Psychology of Ambition | ⏳ pendiente | — |

## Nivel A1

### A1-ISL-01 · Arrival & Border Control ⏳

*Interacciones básicas en el control de pasaportes y aduanas al llegar a un país extranjero: declarar el propósito de la visita, la duración de la estadía y mostrar documentos.*

**Speaking**

- **Explicar el motivo del viaje y la duración de la visita en el control migratorio.** — Estás frente al oficial de migración en el aeropuerto. Preséntate cordialmente, indica que viajas por vacaciones y que te quedarás por diez días.
  - Frases: `I am here on vacation.`, `I am staying for...`, `Here is my passport.`
  - Modelo: _Good afternoon. Here is my passport. I am here on vacation and I am staying for ten days._
- **Indicar dónde te vas a hospedar y mostrar la confirmación.** — El oficial te pregunta por tu alojamiento. Responde que te quedarás en un hotel en el centro de la ciudad y muestra tu confirmación impresa.
  - Frases: `I am staying at...`, `In the city center.`, `Here is my reservation.`
  - Modelo: _I am staying at a hotel in the city center. Here is my reservation._

**Listening**

```
Officer: Good afternoon. May I see your passport?
Traveler: Good afternoon. Yes, here you go.
Officer: What is the purpose of your visit?
Traveler: I am here on vacation with my family.
Officer: How long are you staying in the country?
Traveler: We are staying for ten days.
Officer: Great. Welcome and enjoy your trip!
```

- ¿Cuál es el propósito del viaje del pasajero?
  - A) Viaje de negocios
  - **B) Vacaciones con su familia** ✔
  - C) Estudios universitarios
  - _El viajero responde con claridad a la pregunta del oficial: 'I am here on vacation with my family'._
- ¿Por cuánto tiempo se quedará el viajero en el país?
  - **A) Diez días** ✔
  - B) Dos semanas
  - C) Tres meses
  - _El viajero especifica la duración de su estancia diciendo: 'We are staying for ten days'._

**Writing** · Mensaje de texto / Notificación de llegada

Escribe un mensaje corto (20-35 palabras) a un amigo o familiar para avisarle que ya pasaste el control de migración y vas a buscar tus maletas.

Estructuras: `I just passed border control.` · `I am waiting for my luggage now.` · `See you outside very soon!`

**Spanglish**

- ❌ I arrived to the airport on time. → ✅ I arrived at the airport on time.  
  _En español decimos 'llegar a', pero en inglés no se usa la preposición 'to' con el verbo 'arrive'. Para aeropuertos o estaciones específicas, la preposición correcta es 'at'._
- ❌ I will stay in an hotel. → ✅ I will stay in a hotel.  
  _En español la letra 'h' es muda, lo que lleva al error de usar 'an'. En inglés la palabra 'hotel' empieza con un sonido consonántico aspirado (/h/), por lo que requiere el artículo 'a'._

**Vocabulario**

| Término | Tipo | IPA | Explicación | Ejemplo |
|---|---|---|---|---|
| **Fill out** | Phrasal Verb | /fɪl aʊt/ | Completar o rellenar un formulario con información escrita requerida por las autoridades. | You must fill out this card before border control. |
| **Red-eye** | Slang / Colloquial | /ˈrɛd.aɪ/ | Vuelo comercial que viaja durante la noche y aterriza a primera hora de la mañana. | I am very tired after my red-eye from Chicago. |
| **Declare** | Verb | /dɪˈklɛr/ | Informar oficialmente a las autoridades de aduana sobre bienes, dinero o alimentos que ingresas al país. | Do you have any food to declare at customs? |
| **Valid** | Adjective | /ˈvæl.ɪd/ | Vigente y legalmente aceptado; que no está caducado o vencido. | You need a valid passport to enter the country. |
| **Smooth sailing** | Idiom | /smuːð ˈseɪ.lɪŋ/ | Un proceso sencillo, continuo y sin ningún obstáculo o complicación inesperada. | Immigration was smooth sailing today. |
| **Luggage** | Useful Vocabulary | /ˈlʌɡ.ɪdʒ/ | Equipaje; el conjunto de valijas, maletas y bultos de un viajero. | I need to collect my luggage at carousel four. |

### A1-ISL-03 · Roommates & Living Spaces ⏳

*Convivencia básica en un departamento compartido: acordar tareas del hogar, describir habitaciones y establecer reglas sencillas.*

**Speaking**

- **Preguntar sobre el turno de limpieza en el departamento.** — Habla con tu nuevo compañero de cuarto sobre las tareas de la casa. Pregúntale a quién le toca lavar los platos hoy.
  - Frases: `Whose turn is it?`, `I can wash...`, `Do you want to...?`
  - Modelo: _Hi! Whose turn is it to wash the dishes today? I can do it if you want._
- **Pedir permiso de manera cortés para usar un electrodoméstico.** — Quieres usar la lavadora de ropa este fin de semana. Pregúntale a tu compañero si está libre el espacio.
  - Frases: `Can I use...?`, `Are you using...`, `No problem.`
  - Modelo: _Excuse me, can I use the washing machine now? Or are you using it?_

**Listening**

```
Leo: Hey Mia, do you have a minute?
Mia: Yes, what is up?
Leo: Can we clean the kitchen together tonight?
Mia: I am busy tonight, but I can do it tomorrow morning.
Leo: Okay, that works. I will take out the trash now.
Mia: Thanks, Leo! I can buy dish soap tomorrow too.
```

- ¿Cuándo puede limpiar la cocina Mia?
  - A) Esta noche
  - **B) Mañana por la mañana** ✔
  - C) El fin de semana
  - _Mia responde: 'I am busy tonight, but I can do it tomorrow morning'._
- ¿Qué tarea del hogar hará Leo de inmediato?
  - **A) Sacar la basura** ✔
  - B) Comprar jabón para platos
  - C) Lavar la ropa
  - _Leo dice: 'I will take out the trash now'._

**Writing** · Nota breve para un compañero de cuarto

Escribe una nota corta (20-35 palabras) para tu compañero de cuarto avisándole que compraste leche y pidiéndole que saque la basura.

Estructuras: `Hi! I bought some...` · `Could you please take out...` · `See you later!`

**Spanglish**

- ❌ Please close the light when you leave the room. → ✅ Please turn off the light when you leave the room.  
  _En español decimos comúnmente 'cerrar la luz'. En inglés, las luces y aparatos eléctricos no se cierran, sino que se apagan con el phrasal verb 'turn off'._
- ❌ We need to clean the kitchen in the weekend. → ✅ We need to clean the kitchen on the weekend.  
  _Por influencia del español 'en el fin de semana', se suele usar erróneamente la preposición 'in'. En inglés estadounidense se utiliza la preposición 'on'._

**Vocabulario**

| Término | Tipo | IPA | Explicación | Ejemplo |
|---|---|---|---|---|
| **Clean up** | Phrasal Verb | /kliːn ʌp/ | Limpiar u ordenar a fondo un espacio que está sucio o desordenado. | We need to clean up the living room before the guests arrive. |
| **Crash** | Slang / Colloquial | /kræʃ/ | Dormir o quedarse a pasar la noche en casa de alguien de forma improvisada o informal. | My friend will crash on our sofa tonight. |
| **Share** | Verb | /ʃer/ | Compartir un espacio, habitación o gastos con otra persona. | I share a two-bedroom apartment with my best friend. |
| **Cozy** | Adjective | /ˈkoʊ.zi/ | Acogedor, cálido y cómodo; describe un espacio pequeño pero agradable. | Our small apartment is very cozy in the winter. |
| **Make yourself at home** | Idiom | /meɪk jərˈsɛlf æt hoʊm/ | Siéntete como en tu casa; expresión de bienvenida y hospitalidad. | Come in and make yourself at home while I make tea. |
| **Roommate** | Useful Vocabulary | /ˈruːm.meɪt/ | Compañero de cuarto o de departamento con quien compartes vivienda. | My new roommate is very quiet and friendly. |

### A1-ISL-04 · Daily Rhythms & Commute ⏳

*Rutinas diarias y traslados matutinos: horarios cotidianos, tomar el transporte público, comprar pasajes y llegar a tiempo al trabajo o la escuela.*

**Speaking**

- **Preguntar sobre la ruta y el horario de un autobús.** — Estás en una parada de autobús. Pregúntale a otra persona si ese autobús va al centro de la ciudad y a qué hora llega.
  - Frases: `Excuse me`, `Does this bus go to...?`, `What time does it arrive?`
  - Modelo: _Excuse me, does this bus go to downtown? What time does it arrive?_
- **Comprar un boleto de metro para el día.** — Estás en la taquilla del metro. Pide un pase de un día y pregunta si puedes pagar en efectivo.
  - Frases: `Can I have a...?`, `One-day pass`, `Can I pay with cash?`
  - Modelo: _Hello! Can I have a one-day pass, please? Can I pay with cash?_

**Listening**

```
Mark: Good morning, Sara! Are you ready for work?
Sara: Good morning, Mark! Yes, but the train is late today.
Mark: Oh no. What time does your train usually leave?
Sara: It leaves at eight fifteen, but now it is eight twenty-five.
Mark: Do not worry. The next train arrives in three minutes.
Sara: That is great. I can still arrive on time!
```

- ¿A qué hora sale normalmente el tren de Sara?
  - **A) A las 8:15** ✔
  - B) A las 8:25
  - C) A las 8:30
  - _Sara menciona claramente que su tren sale normalmente a las 8:15 ('It leaves at eight fifteen')._
- ¿En cuántos minutos llega el siguiente tren?
  - A) En diez minutos
  - **B) En tres minutos** ✔
  - C) En quince minutos
  - _Mark le dice a Sara: 'The next train arrives in three minutes'._

**Writing** · Mensaje corto sobre tu traslado diario

Escribe un mensaje corto (20-35 palabras) a un amigo contándole cómo vas al trabajo hoy y a qué hora llegas.

Estructuras: `I take the bus at...` · `The commute is...` · `I arrive at work at...`

**Spanglish**

- ❌ I wake up late and lose the bus. → ✅ I wake up late and miss the bus.  
  _En español decimos 'perder el autobús'. En inglés no se usa el verbo 'lose' para transporte público no alcanzado; se utiliza estrictamente el verbo 'miss'._
- ❌ I read a book in the bus every morning. → ✅ I read a book on the bus every morning.  
  _En español usamos 'en' para cualquier vehículo. En inglés, para medios de transporte colectivos grandes donde puedes caminar o pararte (bus, tren, metro), se usa la preposición 'on'._

**Vocabulario**

| Término | Tipo | IPA | Explicación | Ejemplo |
|---|---|---|---|---|
| **Get off** | Phrasal Verb | /ɡɛt ɔːf/ | Bajarse o descender de un transporte público como un autobús, tren o tranvía. | I get off the bus near my office. |
| **Packed** | Slang / Colloquial | /pækt/ | Expresión coloquial para indicar que un vagón, autobús o lugar está completamente lleno de personas. | The morning train is always packed. |
| **Commute** | Verb | /kəˈmjuːt/ | Viajar regularmente entre el hogar y el lugar de trabajo o escuela. | I commute by subway every weekday. |
| **Crowded** | Adjective | /ˈkraʊ.dɪd/ | Lleno de gente; abarrotado de pasajeros o personas. | The platform is crowded at eight in the morning. |
| **In a rush** | Idiom | /ɪn ə rʌʃ/ | Estar apurado o tener prisa por llegar o terminar algo. | She is in a rush because her alarm did not ring. |
| **Fare** | Useful Vocabulary | /fɛr/ | La tarifa o el precio del boleto para usar un medio de transporte. | The bus fare is two dollars. |


## Nivel A2

### A2-ISL-01 · Baggage Claim & Hotels ⏳

*Procedimientos en el aeropuerto y el hotel: cómo reportar equipaje extraviado en la zona de reclamo, registrarse en recepción y resolver dudas sobre servicios.*

**Speaking**

- **Reportar una maleta extraviada en el reclamo de equipaje.** — Tu vuelo aterrizó, pero tu maleta no apareció en la cinta transportadora. Acércate al mostrador de reclamo de equipaje, describe tu maleta y entrega tu comprobante.
  - Frases: `My luggage did not arrive`, `It is a black suitcase`, `Here is my claim ticket`
  - Modelo: _Excuse me, my luggage did not arrive on the carousel. It is a large black suitcase with wheels. Here is my claim ticket._
- **Registrarse en el hotel y solicitar una habitación silenciosa.** — Llegas a la recepción de tu hotel para hacer el check-in. Da tu nombre, entrega tu documento de identidad y pide con amabilidad una habitación alejada del ruido de la calle.
  - Frases: `I have a reservation under`, `Here is my passport`, `Could I have a quiet room?`
  - Modelo: _Good afternoon. I have a reservation under the name Maria Silva. Here is my passport. Could I have a quiet room, please?_

**Listening**

```
Receptionist: Good evening! Welcome to the Central Hotel. How can I help you?
Guest: Hi, good evening. I have a reservation under the name Carlos Gomez.
Receptionist: Thank you, Mr. Gomez. May I see your passport and a credit card, please?
Guest: Sure, here they are. Also, what time is breakfast served in the morning?
Receptionist: Breakfast is served from 7:00 to 10:00 a.m. in the main dining hall.
Guest: Wonderful. Is there free Wi-Fi in the bedroom?
Receptionist: Yes, the Wi-Fi code is on your keycard holder. Here is room 402!
```

- ¿En qué horario se sirve el desayuno en el hotel?
  - A) De 6:00 a 9:00 a.m.
  - **B) De 7:00 a 10:00 a.m.** ✔
  - C) De 8:00 a 11:00 a.m.
  - _El recepcionista indica claramente: 'Breakfast is served from 7:00 to 10:00 a.m. in the main dining hall'._
- ¿Dónde puede consultar el huésped la clave de la red Wi-Fi?
  - **A) En el sobre de su tarjeta llave** ✔
  - B) En la pared del comedor principal
  - C) En un mensaje de texto en su teléfono
  - _El recepcionista explica que la clave se encuentra en el portatarjetas: 'the Wi-Fi code is on your keycard holder'._

**Writing** · Mensaje breve de confirmación a un hotel

Escribe un mensaje breve al hotel antes de tu viaje (50-70 palabras) confirmando tu hora de llegada, consultando por el servicio de transporte al aeropuerto y preguntando si el desayuno está incluido.

Estructuras: `Dear Hotel Reservations,` · `I am writing to confirm my arrival on...` · `Could you please let me know if...`

**Spanglish**

- ❌ We arrived to the hotel after midnight. → ✅ We arrived at the hotel after midnight.  
  _Traducción literal de 'llegar a'. En inglés, el verbo 'arrive' nunca se combina con la preposición 'to'. Se utiliza 'arrive at' para edificios, lugares específicos o eventos, y 'arrive in' para ciudades o países._
- ❌ We stayed during two days at the hotel. → ✅ We stayed for two days at the hotel.  
  _Uso erróneo de 'during' para indicar la extensión temporal de una acción. En inglés, para indicar cuánto tiempo duró una estancia o actividad se emplea la preposición 'for', reservando 'during' solo para señalar el momento en que ocurre algo ('during the night')._

**Vocabulario**

| Término | Tipo | IPA | Explicación | Ejemplo |
|---|---|---|---|---|
| **Check in** | Phrasal Verb | /ˈtʃek ɪn/ | Registrarse formalmente a la llegada en un hotel o en el mostrador de una aerolínea. | We need to check in at the front desk before four o'clock. |
| **Red-eye** | Slang / Colloquial | /ˈred.aɪ/ | Vuelo comercial nocturno que sale muy tarde y aterriza temprano a la mañana siguiente, dejando a los pasajeros fatigados. | I felt exhausted after taking a red-eye from Los Angeles. |
| **Claim** | Verb | /kleɪm/ | Reclamar o recoger algo que te pertenece formalmente, como el equipaje facturado tras un vuelo. | Passengers must claim their luggage on the ground floor. |
| **Missing** | Adjective | /ˈmɪs.ɪŋ/ | Extraviado o no encontrado en el lugar donde debería estar. | One of my heavy suitcases is missing from the carousel. |
| **Travel light** | Idiom | /ˈtræv.əl laɪt/ | Viajar con muy poco equipaje o solamente con lo estrictamente indispensable. | I always prefer to travel light when I go on weekend trips. |
| **Luggage tag** | Useful Vocabulary | /ˈlʌɡ.ɪdʒ tæɡ/ | Etiqueta identificatoria plástica o de papel que se adhiere a una maleta con el nombre y datos de contacto del pasajero. | Please write your phone number clearly on the luggage tag. |

### A2-ISL-02 · Workplace Collaboration ⏳

*Colaboración en el trabajo: coordinar reuniones diarias, dividir tareas con compañeros de equipo, solicitar ayuda y comunicar avances de proyectos.*

**Speaking**

- **Pedir ayuda a un compañero para revisar una presentación compartida.** — Estás trabajando en una presentación importante y necesitas apoyo con los gráficos. Pídele unos minutos a tu compañero antes de la reunión de la tarde.
  - Frases: `Do you have a few minutes?`, `Could you help me with...?`, `I need to finish this by...`
  - Modelo: _Hi Carlos, do you have a few minutes? Could you help me with this presentation? I need to finish this by three o'clock._
- **Proponer un horario para coordinar una reunión de equipo.** — Necesitas acordar una hora con tu colega para revisar los avances del proyecto semanal. Pregúntale si está disponible mañana en la mañana.
  - Frases: `Are you free on...?`, `Let's discuss the project`, `How about meeting at...?`
  - Modelo: _Hello Sarah. Let's discuss the project tomorrow. Are you free on Tuesday morning? How about meeting at ten?_

**Listening**

```
Mark: Hi Elena, do you have the sales report for our team meeting?
Elena: Yes, Mark. I finished the summary this morning, but I still need the final numbers from accounting.
Mark: No problem. I can email David in accounting right now to ask for them.
Elena: Thanks! That helps a lot. Can we practice our presentation at two o'clock?
Mark: I have another call at two. How about two thirty in conference room B?
Elena: Two thirty is perfect. I will bring the printed copies.
Mark: Great, see you there!
```

- ¿Qué información le falta a Elena para completar el informe?
  - A) El resumen del proyecto
  - **B) Los números finales de contabilidad** ✔
  - C) Las copias impresas
  - _Elena menciona textualmente: 'I still need the final numbers from accounting'._
- ¿A qué hora acuerdan reunirse Mark y Elena para practicar la presentación?
  - A) A las dos en punto
  - **B) A las dos y media** ✔
  - C) A las tres en punto
  - _Mark propone 'two thirty' porque tiene otra llamada a las dos, y Elena acepta diciendo que esa hora es perfecta._

**Writing** · Mensaje breve de actualización laboral

Escribe un correo electrónico breve (50-70 palabras) a tu equipo de trabajo compartiendo el estado de una tarea asignada y proponiendo una videollamada corta para resolver dudas.

Estructuras: `I am writing to give you an update on...` · `I already finished the first draft, but...` · `Can we have a short meeting tomorrow to...?`

**Spanglish**

- ❌ I cannot assist the team meeting tomorrow morning. → ✅ I cannot attend the team meeting tomorrow morning.  
  _Falso amigo común: en español se dice 'asistir a una reunión', pero en inglés 'assist' significa ayudar. Para indicar asistencia presencial se debe usar 'attend'._
- ❌ I am agree with your idea for the new schedule. → ✅ I agree with your idea for the new schedule.  
  _Traducción literal de 'estoy de acuerdo'. En inglés, 'agree' es un verbo y no un adjetivo, por lo que no se combina con el verbo auxiliar 'to be'._

**Vocabulario**

| Término | Tipo | IPA | Explicación | Ejemplo |
|---|---|---|---|---|
| **Catch up** | Phrasal Verb | /ˈkætʃ ʌp/ | Ponerse al día con un compañero respecto a novedades del trabajo o tareas pendientes. | Let's catch up after lunch to discuss the plan. |
| **No-brainer** | Slang / Colloquial | /ˈnoʊˌbreɪ.nər/ | Una decisión o elección obvia que no requiere pensarlo mucho. | Accepting this project is a no-brainer because it helps our career. |
| **Assign** | Verb | /əˈsaɪn/ | Asignar o delegar una tarea o responsabilidad a una persona. | The manager will assign the new tasks tomorrow morning. |
| **Overwhelmed** | Adjective | /ˌoʊ.vərˈwelmd/ | Sentirse sobrecargado o agobiado por el exceso de trabajo o responsabilidades. | Maria feels overwhelmed with all the emails this week. |
| **On the same page** | Idiom | /ɑːn ðə seɪm peɪdʒ/ | Estar en sintonía o tener el mismo entendimiento sobre una meta o proyecto. | We need a short call to make sure we are on the same page. |
| **Deadline** | Useful Vocabulary | /ˈded.laɪn/ | Fecha o plazo límite establecido para entregar una tarea o finalizar un proyecto. | We have a tight deadline for the marketing presentation. |


## Nivel B1

### B1-ISL-01 · Personality Types & Friendships ⏳

*Exploring introversion versus extroversion, navigating interpersonal boundaries, dealing with social friction, and maintaining long-lasting adult friendships.*

**Speaking**

- **Describe your best friend's personality and explain how your characters complement each other.** — Talk about a close friend. Describe their main personality traits, whether they are an introvert or an extrovert, and how your differing or similar personalities help your friendship work smoothly.
  - Frases: `We get along well because...`, `In contrast to me, they tend to...`, `Whenever we have a disagreement...`
  - Modelo: _My best friend Camila is extremely outgoing, whereas I am quite reserved. We get along well because our differences create a natural balance in our daily lives. In contrast to me, they tend to strike up conversations with strangers easily, which pushes me out of my comfort zone. Whenever we have a disagreement, we talk openly and resolve our issues quickly._
- **Give advice on resolving a personality clash between two close friends.** — Imagine two of your friends have stopped talking because one feels neglected by the other's introverted habits. Explain how you would mediate the situation and encourage them to understand each other.
  - Frases: `It is crucial to consider...`, `From my perspective...`, `A sensible compromise would be...`
  - Modelo: _From my perspective, both friends simply have different social boundaries that need to be respected. It is crucial to consider that introverted people need alone time to recharge, which is never a personal rejection. A sensible compromise would be planning shorter, one-on-one activities rather than loud weekend parties so both people feel comfortable._

**Listening**

```
Leo: Hey Maya, have you noticed that Daniel has been avoiding our group lately?
Maya: Yes, actually. He mentioned last week that big social gatherings make him feel exhausted, not energized.
Leo: Really? I always assumed he was just acting distant or uninterested in hanging out with us.
Maya: Not at all. He is quite introverted, so spending hours in crowded places quickly drains his battery.
Leo: That makes sense. I am an extrovert, so I usually recharge by being around lots of people.
Maya: Exactly! We should invite him to do something quieter instead, like cooking dinner at your apartment.
Leo: That is a wonderful suggestion. I will send him a text message right now to plan a relaxed evening.
```

- Why has Daniel been avoiding large social gatherings recently?
  - **A) He feels tired and drained around big groups of people.** ✔
  - B) He had an argument with Leo about their weekend plans.
  - C) He prefers to travel abroad alone rather than stay home.
  - _Maya explains that Daniel is introverted and that crowded social gatherings leave him feeling exhausted and drain his battery._
- What alternative activity does Maya suggest to accommodate Daniel?
  - A) Attending an outdoor music festival together
  - **B) Having a quiet dinner at Leo's apartment** ✔
  - C) Going to a busy downtown restaurant after work
  - _Maya suggests inviting Daniel to do something quieter, specifically proposing that they cook dinner at Leo's apartment._

**Writing** · Reflective Essay

Write an essay (120-160 words) for a community blog about what makes adult friendships survive over time. Discuss how differing personality styles can coexist and suggest two habits that keep long-term friendships healthy.

Estructuras: `In my experience, a true friend is someone who...` · `While introverts and extroverts perceive socializing differently, they can...` · `Whenever personal misunderstandings arise, a good habit is to...`

**Spanglish**

- ❌ Close friendships usually depend of mutual trust and regular communication. → ✅ Close friendships usually depend on mutual trust and regular communication.  
  _Spanish speakers often say 'depend of' because the Spanish equivalent is 'depender de'. In English, the verb 'depend' always collocates with the preposition 'on'._
- ❌ I enjoy talking to Sarah because she is a very comprehensive person. → ✅ I enjoy talking to Sarah because she is a very understanding person.  
  _In Spanish, 'comprensivo/a' describes someone who is understanding and supportive. In English, 'comprehensive' is a false friend meaning thorough or complete. Use 'understanding' instead._

**Vocabulario**

| Término | Tipo | IPA | Explicación | Ejemplo |
|---|---|---|---|---|
| **Drift apart** | Phrasal Verb | /drɪft əˈpɑːrt/ | To gradually become less close or friendly with someone over a period of time, often due to changing life circumstances. | Over time, high school classmates often drift apart when they attend different universities. |
| **Flaky** | Slang / Colloquial | /ˈfleɪ.ki/ | Informal term describing an unreliable person who frequently cancels plans or fails to do what they promised. | Jack is completely flaky, so do not count on him to show up on time. |
| **Confide** | Verb | /kənˈfaɪd/ | To share personal secrets or private thoughts with someone whom you trust completely. | She decided to confide in her closest friend about her personal struggles. |
| **Introverted** | Adjective | /ˈɪn.trə.vɜːr.t̬ɪd/ | Tending to be quiet, reserved, and more interested in one's own thoughts than in spending time with large groups. | As an introverted person, David recharges his energy by reading alone in the evening. |
| **See eye to eye** | Idiom | /siː aɪ tuː aɪ/ | To agree fully with someone on a topic or to share the same viewpoint. | Although they are brothers, they rarely see eye to eye on politics. |
| **Mutual friend** | Useful Vocabulary | /ˈmjuː.tʃu.əl frend/ | A person who is a friend of two individuals who may or may not know each other well. | I met my current business partner through a mutual friend at a casual dinner. |

### B1-ISL-02 · Urban Legends & Unexplained Mysteries ⏳

*Examining widespread urban legends, modern myths, folkloric storytelling, and the psychological appeal of unexplained phenomena.*

**Speaking**

- **Recount a mysterious event or local legend and evaluate its credibility.** — Tell a partner about an urban legend or ghost story from your hometown or country. Explain what supposedly happens, who usually shares the story, and whether you believe it could be true.
  - Frases: `According to local legend...`, `Supposedly, there is...`, `To be completely honest, I doubt...`
  - Modelo: _According to local legend, an old mansion on the outskirts of my town is haunted by a former doctor. Supposedly, there is a strange light flickering in the attic every November. To be completely honest, I doubt it is supernatural, but it definitely keeps curious teenagers away at night._
- **Discuss why people are fascinated by unexplained phenomena and conspiracy theories.** — Share your perspective on why mysterious stories and urban legends spread so quickly on social media. What emotional needs do these tales satisfy for people?
  - Frases: `In my opinion, people are drawn to...`, `It spreads quickly because...`, `From a psychological perspective...`
  - Modelo: _In my opinion, people are drawn to unexplained mysteries because they add excitement to routine lives. A story spreads quickly because shocking details trigger curiosity and emotional reactions. From a psychological perspective, humans just love sharing narratives that challenge everyday logic._

**Listening**

```
Leo: Have you ever heard about the vanishing hitchhiker near the old highway bridge?
Maya: Yes, of course! My uncle actually claimed he saw her twenty years ago while driving home from work.
Leo: Seriously? Do you think there is any truth to it, or is it just a classic neighborhood tale?
Maya: Well, I think people love mysteries because they explain strange feelings or dangerous roads, but I don't believe in real phantoms.
Leo: That makes sense. The local police even investigated the area once because so many drivers reported seeing a figure in white.
Maya: Exactly, and they found out that the curve has terrible lighting and thick fog, which creates optical illusions at night.
Leo: So it turns out the legend was just born from bad road safety and an active imagination!
Maya: Definitely, though I still get nervous whenever I have to drive across that bridge in the dark.
```

- Why did Maya's uncle mention the vanishing hitchhiker legend?
  - A) He read about it in a local newspaper investigation
  - **B) He claimed he saw her twenty years ago while driving home from work** ✔
  - C) He warned drivers about bad road lighting near the bridge
  - _Maya states that her uncle claimed he saw the mysterious figure twenty years ago while driving home from work._
- According to the dialogue, what actually caused drivers to see a figure on the road?
  - **A) Terrible lighting and thick fog, which creates optical illusions at night** ✔
  - B) A local prankster dressed in white standing near the dangerous curve
  - C) Reflective safety signs installed by the local highway department
  - _Maya explains that the police discovered the curve suffered from poor lighting and thick fog, leading to visual illusions._

**Writing** · Forum Contribution

Write a post (120-160 words) for an online discussion forum titled: 'Do You Believe in the Supernatural?'. Describe a famous unexplained mystery or legend, explain whether you think it is real or fabricated, and give reasons for your point of view.

Estructuras: `One of the most famous legends is...` · `While some people claim that...` · `Taking all the evidence into account, I believe...`

**Spanglish**

- ❌ He told me a terrifying history about a haunted hotel in the mountains. → ✅ He told me a terrifying story about a haunted hotel in the mountains.  
  _Spanish speakers frequently confuse 'history' and 'story' because both translate as 'historia'. 'History' refers to real academic or documented past events, whereas a fictional, folkloric, or personal narrative is a 'story'._
- ❌ Whether you believe this myth depends of your personal beliefs. → ✅ Whether you believe this myth depends on your personal beliefs.  
  _Spanish uses the preposition 'de' following the verb 'depender' ('depende de'). In English, the verb 'depend' requires the preposition 'on'._

**Vocabulario**

| Término | Tipo | IPA | Explicación | Ejemplo |
|---|---|---|---|---|
| **Crop up** | Phrasal Verb | /krɑːp ʌp/ | To appear, occur, or be mentioned suddenly and unexpectedly. | Strange rumors always crop up whenever an old house is abandoned. |
| **Creepy** | Slang / Colloquial | /ˈkriː.pi/ | Causing an unpleasant feeling of fear, unease, or nervousness. | We heard a creepy noise coming from the basement late at night. |
| **Debunk** | Verb | /dɪˈbʌŋk/ | To show that an idea, belief, or myth is false or exaggerated by providing real evidence. | Scientists worked hard to debunk the myth about the monster in the lake. |
| **Eerie** | Adjective | /ˈɪr.i/ | Strange and frightening in a mysterious, supernatural, or unsettling way. | There was an eerie silence in the forest before the storm hit. |
| **Take with a grain of salt** | Idiom | /teɪk wɪð ə ɡreɪn əv sɔːlt/ | To view or accept a statement or story with skepticism, recognizing that it may not be entirely accurate. | You should take with a grain of salt any story you read on social media without proof. |
| **Folklore** | Useful Vocabulary | /ˈfoʊk.lɔːr/ | The traditional beliefs, customs, stories, and legends of a community passed down by word of mouth. | Local folklore claims that a phantom carriage travels along the riverbank at midnight. |


## Nivel B2

### B2-ISL-01 · The Psychology of Ambition ⏳

*The internal drivers of high achievement, toxic productivity culture, the pursuit of status, and the psychological toll of relentless career striving.*

**Speaking**

- **Critically analyze the distinction between healthy intrinsic aspiration and pathological overachievement.** — Discuss whether modern corporate culture elevates ambition to an unhealthy obsession. Contrast the pursuit of personal mastery with the perpetual anxiety of status competition. Adopt a balanced analytical stance.
  - Frases: `While drive is frequently celebrated as a virtue...`, `The tipping point occurs when...`, `Striking a sustainable equilibrium demands...`
  - Modelo: _While drive is frequently celebrated as a virtue in contemporary professional environments, it can easily devolve into chronic distress. The tipping point occurs when self-worth becomes entirely contingent upon external accolades and social prestige. Striking a sustainable equilibrium demands cultivating intrinsic goals that nurture genuine fulfillment rather than merely chasing competitive status._
- **Deliver an argument on whether hustle culture exploits individual ambition at the expense of well-being.** — Imagine speaking at a workplace wellness forum. Address management on why glorifying non-stop work harms productivity in the long run and propose an alternative framework for sustained motivation.
  - Frases: `We must dismantle the assumption that...`, `Unchecked ambition invariably yields...`, `A far more resilient model involves...`
  - Modelo: _We must dismantle the assumption that ceaseless overwork equates to dedication. Unchecked ambition invariably yields cognitive fatigue and acute burnout, which ultimately undermines organizational performance. A far more resilient model involves prioritizing restorative downtime, measuring genuine impact rather than superficial hours logged at a desk._

**Listening**

```
Dr. Vance: Welcome, everyone. Today we are examining the darker dimensions of career drive. Historically, ambition was cataloged as a moral vice, yet late-capitalist society rebrands it as the ultimate personal virtue.
Elena: But isn't intrinsic motivation fundamentally distinct from what you call careerism, Dr. Vance? If someone is striving to solve an epidemiological puzzle, their drive is intellectually generative, not predatory.
Dr. Vance: Absolutely, Elena. Psychologists differentiate between mastery goals and performance goals. When individuals chase mastery, setbacks are processed as informative feedback. Conversely, status-driven strivers perceive any plateau as an existential failure.
Elena: And that distinction explains why high achievers often suffer from acute imposter feelings. They measure self-worth strictly against an ever-escalating standard of external validation.
Dr. Vance: Exactly. The hedonic treadmill ensures that every milestone—whether a tenure-track chair or a partnership—provides only ephemeral satisfaction before the baseline of anxiety resets.
Elena: So the corporate apparatus capitalizes on that neurosis, incentivizing self-exploitation under the noble guise of 'passion' and 'grit.'
Dr. Vance: Precisely. Until organizations decouple productivity metrics from sacrificial labor, we will witness record attrition rates among our most promising talent.
```

- According to Dr. Vance, what characterizes high achievers who pursue mastery goals?
  - A) They derive self-worth entirely from public recognition and promotions.
  - **B) They interpret professional setbacks as informative feedback.** ✔
  - C) They maintain lower baseline anxiety on the hedonic treadmill.
  - _Dr. Vance explicitly explains that when individuals pursue mastery goals, professional setbacks are perceived as informative feedback rather than existential failures._
- What is identified by both speakers as the consequence of relying on external validation for ambition?
  - A) Diminished cognitive ability during high-stress corporate negotiations.
  - **B) Temporary satisfaction followed by a rapid return to baseline anxiety.** ✔
  - C) Rapid disengagement from intellectual curiosity and team collaboration.
  - _Dr. Vance points out that the hedonic treadmill ensures each professional milestone yields only fleeting satisfaction before anxiety resets to its original baseline._

**Writing** · Evaluative Essay

Write an evaluative essay (200-240 words) addressing the following statement: 'Modern society places excessive value on career ambition, creating a crisis of mental well-being.' Synthesize opposing viewpoints and present your reasoned conclusion.

Estructuras: `Advocates of relentless ambition maintain that competitive drive fosters...` · `Nevertheless, sociological studies increasingly demonstrate that the psychological toll manifests in...` · `A nuanced appraisal suggests that ambition remains beneficial only when disentangled from...`

**Spanglish**

- ❌ Many professionals pretend to reach the executive suite without assessing the personal sacrifices involved. → ✅ Many professionals intend to reach the executive suite without assessing the personal sacrifices involved.  
  _False friend confusion. In Spanish, 'pretender' means to intend, aspire, or aim to do something. In English, 'pretend' means to feign, make believe, or simulate something untruthful. The correct verb for aspiring to an objective is 'intend' or 'aspire'._
- ❌ Relentless corporate pressure can make ambitious workers to lose perspective on their physical health. → ✅ Relentless corporate pressure can make ambitious workers lose perspective on their physical health.  
  _Syntactic transfer error. In Spanish, the causative construction 'hacer que alguien haga algo' or 'hacer a alguien hacer algo' often leads speakers to use the infinitive with 'to' after the causative verb 'make'. In English, 'make' takes a bare infinitive without 'to'._

**Vocabulario**

| Término | Tipo | IPA | Explicación | Ejemplo |
|---|---|---|---|---|
| **Burn out** | Phrasal Verb | /bɜːrn aʊt/ | To become utterly exhausted physically, mentally, or emotionally as a consequence of sustained overwork or unresolved chronic stress. | If you continue pulling seventy-hour workweeks, you will inevitably burn out before the end of the fiscal year. |
| **Climber** | Slang / Colloquial | /ˈklaɪ.mɚ/ | An informal, mildly pejorative label for an excessively ambitious individual obsessively focused on ascending the professional hierarchy or social ladder. | Colleagues grew wary of the ambitious climber who routinely took credit for collaborative research projects. |
| **Overextend** | Verb | /ˌoʊ.vɚ.ɪkˈstend/ | To commit oneself to more tasks, obligations, or financial liabilities than one can realistically manage or sustain. | Young entrepreneurs routinely overextend themselves by launching multiple speculative ventures simultaneously. |
| **Tenacious** | Adjective | /təˈneɪ.ʃəs/ | Tending to keep a firm hold of something; characterized by persistent determination, grit, and refusal to surrender despite obstacles. | Her tenacious pursuit of the scholarship convinced the selection committee of her academic promise. |
| **Rat race** | Idiom | /ˈræt ˌreɪs/ | An unending, self-defeating, or fiercely competitive lifestyle or career path wherein participants struggle relentlessly for wealth or status. | After two decades in investment banking, she abandoned the rat race to cultivate an organic vineyard. |
| **Imposter syndrome** | Useful Vocabulary | /ɪmˈpɑː.stɚ ˌsɪn.droʊm/ | The persistent psychological pattern in which high-achieving individuals doubt their accomplishments and harbor an internalized fear of being exposed as a fraud. | Despite publishing groundbreaking research, the junior professor struggled with paralyzing imposter syndrome. |

