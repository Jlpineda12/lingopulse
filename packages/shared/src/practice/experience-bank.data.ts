/**
 * GENERADO por packages/shared/scripts/import-experience-bank.mjs — no editar a mano.
 * Fuente: BancodeVocabulario.txt (6 niveles).
 */
/* eslint-disable */
export const EXPERIENCE_BANK_RAW = {
  "levels": [
    {
      "level_code": "A1",
      "target_audience": "Principiantes Absolutos y Falsos Principiantes",
      "instructional_language": "Spanish",
      "sample_island": {
        "island_id": "A1-ISL-02",
        "title": "The Coffee Shop Exchange",
        "topic_context": "Interacciones transaccionales en cafeterías: pedir productos, especificar tamaños, pagar y solicitar cambios.",
        "speaking_module": {
          "prompts": [
            {
              "id": "A1-SPK-01",
              "goal": "Pedir un café caliente y especificar leche vegetal y tamaño.",
              "instructions": "Imagina que estás en una cafetería en Londres. Pide un café con leche de avena, mediano, para llevar. Pregunta también el precio.",
              "target_phrases": [
                "Can I get a...?",
                "To go, please.",
                "How much is it?"
              ],
              "model_response": "Hello! Can I get a medium latte with oat milk to go, please? How much is that?"
            },
            {
              "id": "A1-SPK-02",
              "goal": "Aclarar una confusión con el pedido de forma educada.",
              "instructions": "El barista te dio un muffin de manzana pero pediste uno de chocolate. Explícale el error amablemente.",
              "target_phrases": [
                "Excuse me",
                "I think this is...",
                "I ordered a..."
              ],
              "model_response": "Excuse me, I think there is a mistake. I ordered a chocolate muffin, not apple."
            }
          ]
        },
        "listening_module": {
          "id": "A1-LIS-01",
          "audio_script": "Barista: Good morning! What can I get started for you today?\nCustomer: Hi! Could I have an iced Americano, large, with sugar?\nBarista: Sure thing. That'll be four dollars and fifty cents. Cash or card?\nCustomer: Card, please. And could you tell me the Wi-Fi password?\nBarista: It is printed right at the bottom of your receipt!",
          "comprehension_questions": [
            {
              "question": "¿Cómo pagará el cliente su café?",
              "options": [
                "A) En efectivo",
                "B) Con tarjeta",
                "C) Con un cupón digital"
              ],
              "correct_answer": "B) Con tarjeta",
              "explanation": "El cliente responde 'Card, please' cuando el barista le da la opción de pagar con 'Cash or card'."
            },
            {
              "question": "¿Dónde puede ver el cliente la clave de Wi-Fi?",
              "options": [
                "A) En una pizarra en la pared",
                "B) En la servilleta",
                "C) Al pie del recibo de compra"
              ],
              "correct_answer": "C) Al pie del recibo de compra",
              "explanation": "El barista aclara: 'It is printed right at the bottom of your receipt!'."
            }
          ]
        },
        "writing_module": {
          "id": "A1-WRT-01",
          "task_type": "Mensaje corto / Nota de pedido",
          "instructions": "Escribe un mensaje de texto corto (20-35 palabras) a tu compañero de trabajo para saber qué café quiere que le compres camino a la oficina.",
          "scaffolding_structures": [
            "Hey! I am at the coffee shop.",
            "Do you want anything?",
            "Let me know!"
          ]
        },
        "spanglish_error_lab": [
          {
            "error_id": "A1-SPA-01",
            "incorrect_sentence": "I want a coffee and have 25 years old.",
            "spanish_interference": "En español decimos 'tengo X años' usando el verbo tener. En inglés la edad es un estado de existencia, por lo que se utiliza estrictamente el verbo 'to be'.",
            "native_correction": "I want a coffee and I am 25 years old."
          },
          {
            "error_id": "A1-SPA-02",
            "incorrect_sentence": "Give me the ticket for my purchase, please.",
            "spanish_interference": "Falso amigo común. En inglés un 'ticket' es un boleto de cine, avión o una multa de tránsito. El comprobante de pago de una tienda o cafetería se llama 'receipt'.",
            "native_correction": "Could I have the receipt for my purchase, please?"
          }
        ],
        "lexical_toolbox": [
          {
            "term": "Pick up",
            "type": "Phrasal Verb",
            "ipa": "/pɪk ʌp/",
            "explanation": "Recoger algo que compraste previamente o que te entregan en un mostrador.",
            "how_to_use": "Verbo separable. Se dice 'pick up my coffee' o 'pick my coffee up'. Se usa frecuentemente para pedidos en línea o comida para llevar.",
            "example_1": "I will pick up the donuts on my way home.",
            "example_2": "You can pick up your iced latte at the counter on the left."
          },
          {
            "term": "Grab",
            "type": "Slang / Coloquialismo",
            "ipa": "/ɡræb/",
            "explanation": "Tomar o comprar algo de comer o beber de manera rápida e informal.",
            "how_to_use": "Se usa como sustituto coloquial de 'buy' o 'eat/drink' cuando no dispones de mucho tiempo. Va seguido directamente del sustantivo.",
            "example_1": "Let's grab a coffee before the movie starts.",
            "example_2": "I usually grab a quick sandwich for lunch."
          },
          {
            "term": "Order",
            "type": "Verb",
            "ipa": "/ˈɔːr.dər/",
            "explanation": "Pedir formalmente comida, bebida o productos en un establecimiento comercial.",
            "how_to_use": "Verbo regular. No coloques preposiciones innecesarias; se dice 'order food', nunca 'order about food'.",
            "example_1": "Are you ready to order your breakfast?",
            "example_2": "We ordered two cappuccinos and a slice of cake."
          },
          {
            "term": "Piping hot",
            "type": "Adjective",
            "ipa": "/ˌpaɪ.pɪŋ ˈhɑːt/",
            "explanation": "Extremadamente caliente (utilizado exclusivamente para comidas y bebidas recién preparadas).",
            "how_to_use": "Funciona como adjetivo que califica alimentos líquidos, horneados o cafés recién servidos. Evita quemaduras.",
            "example_1": "Be careful with your soup; it is piping hot!",
            "example_2": "I love my morning coffee piping hot, even during summer."
          },
          {
            "term": "On the go",
            "type": "Idiom",
            "ipa": "/ɑːn ðə ɡoʊ/",
            "explanation": "Estar muy activo, ocupado o haciendo cosas mientras te desplazas de un lugar a otro.",
            "how_to_use": "Suele ubicarse al final de la oración para describir cómo se consume un alimento o el estilo de vida acelerado.",
            "example_1": "I rarely sit down for breakfast; I usually drink my coffee on the go.",
            "example_2": "Salespeople spend the entire afternoon on the go."
          },
          {
            "term": "Decaf",
            "type": "Useful Vocabulary",
            "ipa": "/ˈdiː.kæf/",
            "explanation": "Abreviatura estándar para café descafeinado (sin cafeína).",
            "how_to_use": "Puede funcionar como sustantivo ('a decaf') o como adjetivo ('decaf coffee').",
            "example_1": "I cannot drink normal espresso at night, so I will have a decaf.",
            "example_2": "Do you have decaf beans available today?"
          }
        ]
      }
    },
    {
      "level_code": "A2",
      "target_audience": "Elemental / Pre-Intermedio",
      "instructional_language": "Spanish",
      "sample_island": {
        "island_id": "A2-ISL-05",
        "title": "Retail Shopping & Returns",
        "topic_context": "Experiencia en tiendas de ropa: solicitar tallas, probar prendas, pedir devoluciones de dinero y reclamar defectos de fábrica.",
        "speaking_module": {
          "prompts": [
            {
              "id": "A2-SPK-01",
              "goal": "Solicitar probarse una prenda y pedir una talla diferente.",
              "instructions": "Estás en un probador. La chaqueta que elegiste te queda demasiado ajustada en los hombros. Pídele al dependiente una talla más grande.",
              "target_phrases": [
                "Do you have this in a larger size?",
                "It feels a bit tight.",
                "Could I try on...?"
              ],
              "model_response": "Excuse me, this jacket feels a bit tight around my shoulders. Do you have this in a medium or a larger size?"
            },
            {
              "id": "A2-SPK-02",
              "goal": "Exigir un reembolso por una prenda defectuosa con el recibo en mano.",
              "instructions": "Compraste un suéter ayer y notaste que tiene una rotura en la manga. Explica que tienes el recibo y quieres tu dinero de vuelta, no un cambio de prenda.",
              "target_phrases": [
                "I'd like to get a refund",
                "There is a rip/tear",
                "Here is my receipt"
              ],
              "model_response": "Hello. I bought this sweater yesterday, but there is a rip on the sleeve. Here is my receipt. I would like to get a full refund, please."
            }
          ]
        },
        "listening_module": {
          "id": "A2-LIS-01",
          "audio_script": "Cashier: Next in line, please! Hi there, how can I help you today?\nShopper: Good afternoon. I bought these jeans last Friday, but when I washed them, the zipper broke completely.\nCashier: Oh, I am sorry about that. Do you have the original tag and receipt with you?\nShopper: Yes, here is the receipt, but I already threw the price tag into the recycling bin.\nCashier: That's alright. Since the product is damaged, our policy allows an exchange for another pair or store credit, but no direct refund without the tag.",
          "comprehension_questions": [
            {
              "question": "¿Qué problema tuvieron los jeans del comprador?",
              "options": [
                "A) Encogieron en la secadora",
                "B) La cremallera (cierre) se rompió al lavarlos",
                "C) El color se desvaneció"
              ],
              "correct_answer": "B) La cremallera (cierre) se rompió al lavarlos",
              "explanation": "El cliente dice textualmente: 'when I washed them, the zipper broke completely'."
            },
            {
              "question": "¿Por qué la cajera rechaza entregar un reembolso de dinero en efectivo?",
              "options": [
                "A) Porque pasaron más de 30 días",
                "B) Porque no tiene la etiqueta original",
                "C) Porque la tienda está en quiebra"
              ],
              "correct_answer": "B) Porque no tiene la etiqueta original",
              "explanation": "La cajera señala: 'no direct refund without the tag'."
            }
          ]
        },
        "writing_module": {
          "id": "A2-WRT-01",
          "task_type": "Correo breve de reclamo a atención al cliente",
          "instructions": "Escribe un correo electrónico formal y breve (50-70 palabras) a una tienda online explicando que recibiste el color de calzado incorrecto y solicitando el reemplazo sin costo de envío.",
          "scaffolding_structures": [
            "Dear Customer Service,",
            "I am writing to inform you that...",
            "My order number is...",
            "I look forward to hearing from you."
          ]
        },
        "spanglish_error_lab": [
          {
            "error_id": "A2-SPA-01",
            "incorrect_sentence": "I want to change this shirt because it doesn't stay me well.",
            "spanish_interference": "Calco directo del modismo en español 'no me queda bien'. En inglés, las prendas de vestir 'fit' (si se refieren a la talla o tamaño físico) o 'suit / look good on' (si se refieren al estilo o estética). Además, para cambiar un producto comercial se prefiere 'exchange' sobre 'change'.",
            "native_correction": "I would like to exchange this shirt because it does not fit me well."
          },
          {
            "error_id": "A2-SPA-02",
            "incorrect_sentence": "These shoes are so much small for my feets.",
            "spanish_interference": "Doble error: 1) Uso erróneo de 'so much' con adjetivos en lugar del intensificador 'too' o 'much too'. 2) Pluralizar un sustantivo irregular agregándole 's' (*feets en lugar de feet).",
            "native_correction": "These shoes are too small for my feet."
          }
        ],
        "lexical_toolbox": [
          {
            "term": "Try on",
            "type": "Phrasal Verb",
            "ipa": "/traɪ ɒn/",
            "explanation": "Ponerse una prenda de vestir para comprobar si te queda bien de talla o estilo antes de comprarla.",
            "how_to_use": "Verbo separable. Si usas pronombres como 'it' o 'them', deben ir obligatoriamente en el medio: 'try it on', nunca 'try on it'.",
            "example_1": "Where can I try on these pants?",
            "example_2": "She liked the dress, so she decided to try it on immediately."
          },
          {
            "term": "Rip-off",
            "type": "Slang / Coloquialismo",
            "ipa": "/ˈrɪp.ɒf/",
            "explanation": "Algo que cuesta mucho más dinero de lo que realmente vale; una estafa o timo de precios.",
            "how_to_use": "Sustantivo informal precedido por el artículo indeterminado 'a'. Es común exclamar: 'What a rip-off!'.",
            "example_1": "Fifty dollars for a plain white t-shirt is a complete rip-off.",
            "example_2": "Do not buy electronics at airport shops; they are usually a rip-off."
          },
          {
            "term": "Refund",
            "type": "Verb / Noun",
            "ipa": "/ˈriː.fʌnd/ (sustantivo), /rɪˈfʌnd/ (verbo)",
            "explanation": "Devolver el dinero al cliente insatisfecho; o la suma devuelta.",
            "how_to_use": "Como verbo: 'The store refunded my money'. Como sustantivo: 'Ask for a full refund'. Colocación usual: 'issue a refund'.",
            "example_1": "If the gadget is broken, they will refund the full purchase price.",
            "example_2": "I requested a refund three days ago, but it hasn't appeared in my bank account."
          },
          {
            "term": "Faulty",
            "type": "Adjective",
            "ipa": "/ˈfɔːl.ti/",
            "explanation": "Que no funciona de forma correcta debido a una falla, daño o defecto de fabricación.",
            "how_to_use": "Modifica productos físicos y aparatos electrónicos ('faulty wiring', 'faulty brakes', 'faulty product').",
            "example_1": "Consumers have the legal right to return faulty goods within thirty days.",
            "example_2": "The store apologized and replaced the faulty headphones immediately."
          },
          {
            "term": "Cost an arm and a leg",
            "type": "Idiom",
            "ipa": "/kɒst ən ɑːm ænd ə leɡ/",
            "explanation": "Costar una suma desorbitada de dinero; ser absurdamente costoso (equivalente en español a 'costar un ojo de la cara').",
            "how_to_use": "El verbo 'cost' se conjuga en presente o pasado (el pasado de cost sigue siendo cost).",
            "example_1": "That Italian leather bag looks gorgeous, but it costs an arm and a leg.",
            "example_2": "Fixing the cracked screen of my tablet cost an arm and a leg."
          },
          {
            "term": "Store credit",
            "type": "Useful Vocabulary",
            "ipa": "/stɔːr ˈkred.ɪt/",
            "explanation": "Saldo a favor emitido por un comercio para ser gastado exclusivamente en sus tiendas en lugar de reintegrar dinero en efectivo.",
            "how_to_use": "Incontable. Colocaciones comunes: 'receive store credit', 'use your store credit'.",
            "example_1": "Since I lost the receipt, the manager could only give me store credit.",
            "example_2": "I used my store credit to buy a warm scarf for the winter."
          }
        ]
      }
    },
    {
      "level_code": "B1",
      "target_audience": "Intermediate Users",
      "instructional_language": "English",
      "sample_island": {
        "island_id": "B1-ISL-03",
        "title": "Consumer Culture & Impulse Spending",
        "topic_context": "Psychological triggers in retail, online shopping addiction, credit card liability, and conscious budgeting.",
        "speaking_module": {
          "prompts": [
            {
              "id": "B1-SPK-01",
              "goal": "Analyze personal expenditure habits and rationalize unnecessary purchases.",
              "instructions": "Discuss a recent purchase you made on impulse. What emotional state prompted you to buy it, how did you justify the cost at that moment, and do you feel buyer's remorse now?",
              "target_phrases": [
                "I ended up buying...",
                "I was persuaded by...",
                "Looking back in retrospect..."
              ],
              "model_response": "A few weeks ago, I was browsing online after a stressful workday and ended up buying an expensive espresso machine on impulse. At the moment, I justified it by thinking I would save money on takeaway coffees. However, looking back in retrospect, I barely use it, and I definitely feel buyer's remorse."
            },
            {
              "id": "B1-SPK-02",
              "goal": "Debate the social implications of 'Buy Now, Pay Later' schemes among young adults.",
              "instructions": "State your opinion on short-term automated micro-credit applications. Are they empowering financial tools or predatory services that lead to chronic consumer debt?",
              "target_phrases": [
                "From my standpoint...",
                "It lures people into...",
                "On the flip side..."
              ]
            }
          ]
        },
        "listening_module": {
          "id": "B1-LIS-01",
          "audio_script": "Podcast Host: Welcome back to Modern Wallet. Today we are joined by financial therapist Sarah Jenkins. Sarah, why do flash sales trigger such uninhibited spending?\nSarah: Well, Mark, it fundamentally hinges on artificial scarcity. When an e-commerce platform splashes a countdown clock over a product, our brains bypass rational budgeting. The fear of missing out overrides practical considerations. You aren't actually assessing whether you need the item; your dopamine receptors are merely reacting to winning a perceived bargain before the timer lapses.",
          "comprehension_questions": [
            {
              "question": "According to Sarah, what psychological mechanism drives impulse purchases during flash sales?",
              "options": [
                "A) The high quality of advertised merchandise",
                "B) Artificial scarcity triggering a fear of missing out",
                "C) Subconscious loyalty to retail brands"
              ],
              "correct_answer": "B) Artificial scarcity triggering a fear of missing out",
              "explanation": "Sarah explains that countdown clocks create artificial scarcity, causing consumers to act out of fear of missing out rather than rational necessity."
            },
            {
              "question": "What physiological factor causes shoppers to prioritize the purchase over financial sanity?",
              "options": [
                "A) Dopamine receptors reacting to a perceived competitive victory",
                "B) Fatigue caused by excessive algorithmic advertising",
                "C) Adrenaline caused by credit card fraud alerts"
              ],
              "correct_answer": "A) Dopamine receptors reacting to a perceived competitive victory",
              "explanation": "She notes that 'dopamine receptors are merely reacting to winning a perceived bargain before the timer lapses'."
            }
          ]
        },
        "writing_module": {
          "id": "B1-WRT-01",
          "task_type": "Opinion Blog Post",
          "instructions": "Write an article (120-160 words) for a lifestyle blog titled: 'Can We Truly Opt Out of Fast Fashion?'. Present the hidden costs of ultra-cheap garments and suggest two realistic habits for sustainable consumption.",
          "scaffolding_structures": [
            "It is widely acknowledged that...",
            "While cheap prices seem appealing at first glance...",
            "A viable alternative is to..."
          ]
        },
        "spanglish_error_lab": [
          {
            "error_id": "B1-SPA-01",
            "incorrect_sentence": "I am thinking in buying a new laptop on sales.",
            "spanish_interference": "Spanish speakers frequently transfer the preposition 'en' ('pensando en') into English as 'in'. The correct prepositional collocations for 'think' when contemplating an action are 'of' or 'about' followed by a gerund (-ing). Furthermore, discounted seasonal items are 'on sale' (singular).",
            "native_correction": "I am thinking of buying a new laptop on sale."
          },
          {
            "error_id": "B1-SPA-02",
            "incorrect_sentence": "My brother works hard to pay his debts because he spends too much money in clothes.",
            "spanish_interference": "Direct interference from the Spanish syntax 'gastar dinero en'. In English, you spend money 'on' goods, never 'in'.",
            "native_correction": "My brother works hard to pay off his debts because he spends too much money on clothes."
          }
        ],
        "lexical_toolbox": [
          {
            "term": "Splurge on",
            "type": "Phrasal Verb / Verb Phrase",
            "ipa": "/splɜːdʒ ɒn/",
            "explanation": "To spend an extravagant or excessive amount of money on luxury items that you do not fundamentally need.",
            "how_to_use": "Intransitive construction followed by the mandatory preposition 'on' and the noun phrase denoting the luxury object.",
            "example_1": "After receiving her annual bonus, she decided to splurge on a designer handbag.",
            "example_2": "We rarely eat out, but last night we splurged on a five-course tasting menu."
          },
          {
            "term": "Window shopping",
            "type": "Colloquial Noun Phrase",
            "ipa": "/ˈwɪn.doʊ ˌʃɑː.pɪŋ/",
            "explanation": "The activity of looking at goods displayed in retail shop windows or online marketplaces without any intention of purchasing them.",
            "how_to_use": "Uncountable. Collocates with verbs like 'go' ('go window shopping') or 'do' ('do some window shopping').",
            "example_1": "I don't have any disposable income this month, so I am just going window shopping downtown.",
            "example_2": "Online window shopping has become a major leisure pastime for young professionals."
          },
          {
            "term": "Max out",
            "type": "Phrasal Verb",
            "ipa": "/mæks aʊt/",
            "explanation": "To reach the absolute upper financial limit of a credit card line or financial allowance.",
            "how_to_use": "Transitive and separable. Standard syntax: 'max out my card' or 'my card is maxed out'.",
            "example_1": "He maxed out three credit cards during his vacation and now struggles to cover the interest.",
            "example_2": "If you max out your credit limit, your credit score will drop significantly."
          },
          {
            "term": "Exorbitant",
            "type": "Adjective",
            "ipa": "/ɪɡˈzɔːr.bə.tənt/",
            "explanation": "Far exceeding the bounds of what is reasonable, fair, or customary (specifically applied to prices, fees, and demands).",
            "how_to_use": "Formal and neutral registers. Strongly modifies terms such as 'prices', 'fees', 'rates', or 'rents'.",
            "example_1": "The boutique charges exorbitant prices simply because of its prestige location.",
            "example_2": "Tenants staged a demonstration to protest against exorbitant rent increases in the city center."
          },
          {
            "term": "Burn a hole in one's pocket",
            "type": "Idiom",
            "ipa": "/bɜːrn ə hoʊl ɪn wʌnz ˈpɑː.kɪt/",
            "explanation": "A colloquial figurative idiom describing money that someone has just acquired and feels an overwhelming, urgent urge to spend immediately.",
            "how_to_use": "The subject is usually money, a bonus, or cash: '[Money] is burning a hole in [someone's] pocket'.",
            "example_1": "As soon as Mark got his tax refund, the money burned a hole in his pocket, and he bought a drone.",
            "example_2": "Don't tell Sarah you have spare cash; it will burn a hole in your pocket if you hang out with her."
          },
          {
            "term": "Buyer's remorse",
            "type": "Useful Vocabulary",
            "ipa": "/ˌbaɪ.ɚz rɪˈmɔːrs/",
            "explanation": "A profound sense of mental regret, anxiety, or guilt experienced immediately or shortly after making a substantial purchase.",
            "how_to_use": "Uncountable psychological noun. Collocates with 'suffer from', 'experience', or 'feel'.",
            "example_1": "I suffered severe buyer's remorse after purchasing that luxury sports car on finance.",
            "example_2": "Retailers offer thirty-day return guarantees specifically to alleviate consumer buyer's remorse."
          }
        ]
      }
    },
    {
      "level_code": "B2",
      "target_audience": "Upper Intermediate",
      "instructional_language": "English",
      "sample_island": {
        "island_id": "B2-ISL-06",
        "title": "Gentrification & Urban Identity",
        "topic_context": "Displacement of heritage communities, artisanal commercialization, real estate speculation, and preserving historic neighborhoods.",
        "speaking_module": {
          "prompts": [
            {
              "id": "B2-SPK-01",
              "goal": "Assess the sociopolitical dichotomy between urban revitalization and structural displacement.",
              "instructions": "Some municipal urbanists argue that the arrival of affluent residents and boutique cafes breathes vital economic life into derelict districts. Conversely, cultural sociologists argue it destroys historic communities and prices out generational inhabitants. Adopt a nuanced stance evaluating both perspectives.",
              "target_phrases": [
                "While it indisputably fosters economic influx...",
                "The collateral damage lies in...",
                "Striking a balance necessitates..."
              ]
            },
            {
              "id": "B2-SPK-02",
              "goal": "Pitch a municipal initiative to protect local heritage businesses from soaring commercial leases.",
              "instructions": "Deliver a 2-minute proposal to a simulated City Council. Propose concrete zoning bylaws or tax relief subsidies to safeguard long-standing family businesses against real estate conglomerates.",
              "target_phrases": [
                "I urge the council to enact...",
                "Commercial rent stabilization is paramount because...",
                "Without immediate municipal intervention..."
              ]
            }
          ]
        },
        "listening_module": {
          "id": "B2-LIS-01",
          "audio_script": "Panelist A: What developers euphemistically term 'urban renewal' is, in reality, a ruthless socio-spatial purge. When corporate venture firms acquire historic residential blocks, rent escalates by 300 percent overnight. The corner grocers, multi-generational tailor shops, and affordable tenements vanish, supplanted by overpriced micro-roasteries and luxury co-working facilities.\nPanelist B: That is an overly nostalgic narrative, David. Those neighborhoods were chronically underfunded, plagued by crumbling infrastructure, lead water pipes, and municipal neglect for forty years. Capital investment isn't intrinsically malevolent; it paves roads, lowers crime indices, and widens the municipal tax base to fund social services elsewhere.",
          "comprehension_questions": [
            {
              "question": "What does Panelist A identify as the primary driver of community displacement?",
              "options": [
                "A) Shifting consumer preferences among working-class youths",
                "B) Private equity acquisitions leading to exponential rent hikes",
                "C) Strict municipal historic preservation statutes"
              ],
              "correct_answer": "B) Private equity acquisitions leading to exponential rent hikes",
              "explanation": "Panelist A explicitly states that private venture firms buy blocks and raise rent by 300 percent overnight, forcing inhabitants out."
            },
            {
              "question": "How does Panelist B substantiate the positive aspects of private capital injection?",
              "options": [
                "A) By highlighting infrastructural restoration, crime reduction, and tax base expansion",
                "B) By demonstrating that traditional retail stores are economically unviable",
                "C) By claiming heritage architecture is structurally hazardous"
              ],
              "correct_answer": "A) By highlighting infrastructural restoration, crime reduction, and tax base expansion",
              "explanation": "Panelist B argues that capital investment repairs crumbling infrastructure, reduces crime rates, and generates municipal tax revenues."
            }
          ]
        },
        "writing_module": {
          "id": "B2-WRT-01",
          "task_type": "Formal Perspective Essay",
          "instructions": "Write an analytical essay (200-240 words) addressing the prompt: 'Should metropolitan governments freeze residential property rents to curb gentrification?' Organize your discourse using concession paragraphs and balanced counter-arguments.",
          "scaffolding_structures": [
            "Proponents of market intervention assert that...",
            "Critics, on the other hand, contend that artificial ceilings stifle...",
            "Ultimately, empirical data suggests..."
          ]
        },
        "spanglish_error_lab": [
          {
            "error_id": "B2-SPA-01",
            "incorrect_sentence": "The historic residents had to leave because the living cost is actually intolerable.",
            "spanish_interference": "False friend confusion. The Spanish word 'actualmente' means 'currently' or 'nowadays'. The English word 'actually' is an intensifier meaning 'in fact' or 'truly'. Furthermore, the noun phrase is 'cost of living', not 'living cost'.",
            "native_correction": "The historic residents had to leave because the cost of living is currently intolerable."
          },
          {
            "error_id": "B2-SPA-02",
            "incorrect_sentence": "The mayor compromised herself to protect vulnerable tenants from real estate predators.",
            "spanish_interference": "Reflexive translation fallacy. In Spanish, 'comprometerse a' means to make a commitment or promise. In English, 'to compromise oneself' means to dishonor oneself, lose moral standing, or endanger one's security. The correct verb is 'commit to'.",
            "native_correction": "The mayor committed herself to protecting vulnerable tenants from real estate predators."
          }
        ],
        "lexical_toolbox": [
          {
            "term": "Price out",
            "type": "Phrasal Verb",
            "ipa": "/praɪs aʊt/",
            "explanation": "To cause someone to be unable to remain in an area or purchase a product due to disproportionate price increases.",
            "how_to_use": "Transitive and separable, but predominantly used in the passive voice: 'be priced out of [a neighborhood/market]'.",
            "example_1": "Generational residents are being priced out of their childhood neighborhoods by predatory speculative developments.",
            "example_2": "Rising tuition fees will inevitably price out promising candidates from lower-income brackets."
          },
          {
            "term": "Bougie",
            "type": "Slang / Colloquial Adjective",
            "ipa": "/ˈbuː.ʒi/",
            "explanation": "Deriving from 'bourgeoisie'; used informally, often derisively, to describe tastes, venues, or habits that are pretentiously upscale, fashionable, or pseudo-luxurious.",
            "how_to_use": "Informal, conversational tone. Modifies cafes, gyms, sourdough bakeries, and consumer products.",
            "example_1": "That rundown industrial warehouse was transformed into a bougie artisanal coffee shop.",
            "example_2": "He refuses to drink tap water anymore; he has become entirely too bougie since moving downtown."
          },
          {
            "term": "Displace",
            "type": "Verb",
            "ipa": "/dɪsˈpleɪs/",
            "explanation": "To forcibly cause someone or a community to leave their usual location, domestic habitat, or historical premises.",
            "how_to_use": "Transitive verb. Widely used in sociological, economic, ecological, and urban planning contexts.",
            "example_1": "Massive civic infrastructure projects frequently displace hundreds of marginalized households.",
            "example_2": "Rising sea levels threaten to permanently displace millions of coastal inhabitants."
          },
          {
            "term": "Homogenized",
            "type": "Adjective",
            "ipa": "/həˈmɑː.dʒə.naɪzd/",
            "explanation": "Made completely uniform, identical, or similar in character, thereby extinguishing unique regional idiosyncrasies, local culture, and variety.",
            "how_to_use": "Formal sociopolitical analysis. Modifies nouns such as 'culture', 'retail landscape', 'urban landscape', 'architecture'.",
            "example_1": "Critics decry how globalized retail franchises have created a homogenized, bland high street in every major city.",
            "example_2": "Without neighborhood preservation laws, metropolitan districts become culturally homogenized."
          },
          {
            "term": "Change hands",
            "type": "Idiom",
            "ipa": "/tʃeɪndʒ hændz/",
            "explanation": "To pass from the ownership, possession, or managerial control of one party or entity to another.",
            "how_to_use": "Intransitive verb phrase. The subject is usually property, capital, companies, or historic real estate.",
            "example_1": "Several historic buildings in the quarter changed hands during the peak of the speculative real estate boom.",
            "example_2": "The family-owned bookstore has changed hands and will soon reopen as an upscale cocktail lounge."
          },
          {
            "term": "Social fabric",
            "type": "Useful Vocabulary",
            "ipa": "/ˌsoʊ.ʃəl ˈfæb.rɪk/",
            "explanation": "The intricate network of communal relationships, collective cultural traditions, mutual trust, and shared values that binds a community together.",
            "how_to_use": "Abstract formal sociological noun. Collocates with verbs like 'tear', 'erode', 'strengthen', or 'preserve'.",
            "example_1": "Rapid commercial gentrification erodes the delicate social fabric that historic communities built over generations.",
            "example_2": "Public community centers play an indispensable role in maintaining the local social fabric."
          }
        ]
      }
    },
    {
      "level_code": "C1",
      "target_audience": "Advanced / Fluent",
      "instructional_language": "English",
      "sample_island": {
        "island_id": "C1-ISL-04",
        "title": "Behavioral Economics & Cognitive Biases",
        "topic_context": "Loss aversion, cognitive heuristics, the architecture of choice, irrational financial panics, and the limits of the 'rational actor' paradigm.",
        "speaking_module": {
          "prompts": [
            {
              "id": "C1-SPK-01",
              "goal": "Deconstruct classical economic theories using cognitive heuristics and behavioral insights.",
              "instructions": "Deliver an extemporaneous speech (2 to 3 minutes) dismantling the traditional Chicago School assumption that human beings are fundamentally rational market agents ('Homo Economicus'). Illustrate your points using Kahneman & Tversky's Prospect Theory and the concept of loss aversion.",
              "target_phrases": [
                "The foundational premise of market rationality collapses under...",
                "Empirical cognitive research demonstrates...",
                "Asymmetrical perception of risk..."
              ]
            },
            {
              "id": "C1-SPK-02",
              "goal": "Critique the ethics of 'Nudge Theory' in state policymaking.",
              "instructions": "Engage in an intellectual defense or rebuttal: Is default organ donation or automated pension enrollment benevolent state guidance, or does it constitute paternalistic psychological manipulation? Argue with rhetorical precision.",
              "target_phrases": [
                "Libertarian paternalism ostensibly offers...",
                "Under the veneer of altruism lies...",
                "One must interrogate whether default presets infringe upon..."
              ]
            }
          ]
        },
        "listening_module": {
          "id": "C1-LIS-01",
          "audio_script": "Keynote Lecturer: If we scrutinize the mechanics of choice architecture, we instantly recognize that neutrality is a mathematical impossibility. The manner in which choices are presented inevitably tilts the outcome. When a retirement fund sets an opt-in default, enrollment languishes at roughly 35 percent. Invert that default to automatic enrollment with an opt-out clause, and participation skyrockets to 94 percent without altering the financial incentives by a single basis point. The economic agent remains nominally autonomous, yet their inertia is weaponized for systemic stabilization.",
          "comprehension_questions": [
            {
              "question": "What theoretical illusion does the keynote speaker dismantle regarding decision architecture?",
              "options": [
                "A) The concept that digital choices are more transparent than paper forms",
                "B) The belief that any systemic presentation of choices can remain wholly neutral",
                "C) The hypothesis that automated defaults decrease overall long-term investment yields"
              ],
              "correct_answer": "B) The belief that any systemic presentation of choices can remain wholly neutral",
              "explanation": "The speaker states unequivocally that 'neutrality is a mathematical impossibility; the manner in which choices are presented inevitably tilts the outcome'."
            },
            {
              "question": "What psychological behavioral trait is harnessed to surge retirement enrollment from 35% to 94%?",
              "options": [
                "A) Fear of regulatory litigation",
                "B) Calculated capital greed",
                "C) Human inertia and passive adherence to default frameworks"
              ],
              "correct_answer": "C) Human inertia and passive adherence to default frameworks",
              "explanation": "The lecturer highlights that the consumer's 'inertia is weaponized' simply by switching the default baseline."
            }
          ]
        },
        "writing_module": {
          "id": "C1-WRT-01",
          "task_type": "Executive Policy Brief",
          "instructions": "Draft a high-level policy brief (250-300 words) intended for a national treasury committee. Evaluate how the 'sunk cost fallacy' leads to prolonged state subsidies for unviable infrastructure megaprojects, and outline two institutional checks to enforce objective fiscal termination.",
          "scaffolding_structures": [
            "This memorandum seeks to elucidate...",
            "Entrenched institutional confirmation bias precipitates...",
            "We recommend establishing autonomous algorithmic auditing bodies to..."
          ]
        },
        "spanglish_error_lab": [
          {
            "error_id": "C1-SPA-01",
            "incorrect_sentence": "The research group disposed all their capital without discarding future financial bankruptcies.",
            "spanish_interference": "Double lexical and syntactic interference. 1) 'Disposed' in English means to arrange or get rid of ('dispose of'). In Spanish, 'disponer de' means to have something available or allocate it; the correct English verb is 'allocate' or 'deploy'. 2) 'Discard' means to throw away physically; the native verb for eliminating an abstract conceptual possibility or future risk is 'rule out'.",
            "native_correction": "The research group deployed all their capital without ruling out future financial insolvency."
          },
          {
            "error_id": "C1-SPA-02",
            "incorrect_sentence": "The central bank took decisions that provoked an unprecedented inflationist spiral.",
            "spanish_interference": "Unidiomatic collocation and false derivational morphology. Spanish speakers translate 'tomar decisiones' literally as *take decisions (native English requires 'make decisions' or 'reach decisions'). Furthermore, *inflationist is an erroneous derivation; the formal economic adjective is 'inflationary'.",
            "native_correction": "The central bank made decisions that triggered an unprecedented inflationary spiral."
          }
        ],
        "lexical_toolbox": [
          {
            "term": "Factor out",
            "type": "Phrasal Verb",
            "ipa": "/ˈfæk.tər aʊt/",
            "explanation": "To deliberately exclude an analytical variable, anomalous data point, or extraneous factor from a mathematical calculation or strategic assessment.",
            "how_to_use": "Transitive and separable. Standard syntax: 'factor [variable] out' or 'factor out [variable]'. Widely used in econometric and scientific registers.",
            "example_1": "When analyzing consumer sentiment trends, econometricians must factor out temporary seasonal anomalies.",
            "example_2": "The model yields vastly divergent forecasts if you factor out geopolitical supply chain shocks."
          },
          {
            "term": "FOMO-driven",
            "type": "Colloquial Compound Adjective",
            "ipa": "/ˈfoʊ.moʊ ˌdrɪv.ən/",
            "explanation": "Propelled or governed by the acute psychological neurosis that others are profiting from or enjoying an opportunity that one is missing out on.",
            "how_to_use": "Informal to analytical register. Modifies nouns: 'investing', 'purchasing', 'market rally', 'behavior'.",
            "example_1": "Retail investors poured life savings into volatile digital tokens during a frantic, FOMO-driven bubble.",
            "example_2": "FOMO-driven acquisitions almost universally result in crippling balance-sheet write-downs."
          },
          {
            "term": "Heuristic",
            "type": "Adjective / Noun",
            "ipa": "/hjʊəˈrɪs.tɪk/",
            "explanation": "Relating to rule-of-thumb mental shortcuts or intuitive strategies that enable swift problem-solving and decision-making without systematic computational analysis.",
            "how_to_use": "High-level academic and cognitive register. Used as a noun ('a heuristic') or as an adjective ('heuristic method').",
            "example_1": "Under conditions of severe cognitive fatigue, human subjects fall back on crude heuristic judgments.",
            "example_2": "The availability heuristic frequently misleads investors into overweighting recent catastrophic events."
          },
          {
            "term": "Paternalistic",
            "type": "Adjective",
            "ipa": "/pəˌtɜːr.nəlˈɪs.tɪk/",
            "explanation": "Characterized by a system, practice, or attitude in which an authority governs people by restricting their personal freedom or autonomy, ostensibly for their own welfare or moral benefit.",
            "how_to_use": "Political philosophy and legal discourse. Modifies 'governance', 'policies', 'nudges', 'state legislation'.",
            "example_1": "Critics rejected the sugary drink tax as an overtly paternalistic overreach by the public health ministry.",
            "example_2": "There is a fine boundary between compassionate consumer protection and paternalistic surveillance."
          },
          {
            "term": "Throw good money after bad",
            "type": "Idiom",
            "ipa": "/θroʊ ɡʊd ˈmʌn.i ˈæf.tər bæd/",
            "explanation": "To recklessly squander additional capital, effort, or resources on an enterprise or asset that has already unequivocally failed, driven by irrational refusal to accept the initial loss.",
            "how_to_use": "Informal to formal executive idiomatic discourse. Functions as an infinitive or continuous verb phrase.",
            "example_1": "Pouring another round of venture funds into this insolvent startup is merely throwing good money after bad.",
            "example_2": "Discipline in institutional trading demands cutting losses decisively rather than throwing good money after bad."
          },
          {
            "term": "Loss aversion",
            "type": "Useful Vocabulary",
            "ipa": "/ˌlɒs əˈvɜːr.ʒən/",
            "explanation": "The empirical psychological phenomenon wherein the emotional, psychological pain of losing a specific amount is quantified as significantly more potent than the pleasure of gaining that exact same equivalent.",
            "how_to_use": "Formal technical behavioral economics term. Primary subject or object in cognitive psychology.",
            "example_1": "Due to deep-seated loss aversion, average investors liquidate winning stocks too early while desperately clinging to deteriorating assets.",
            "example_2": "Kahneman demonstrated that loss aversion ratios operate at approximately two to one across most demographics."
          }
        ]
      }
    },
    {
      "level_code": "C2",
      "target_audience": "Mastery / Native Proficiency",
      "instructional_language": "English",
      "sample_island": {
        "island_id": "C2-ISL-01",
        "title": "Epistemological Solipsism & The Architecture of Truth",
        "topic_context": "Epistemic limits, post-structural deconstruction, hyperreality, consensus reality collapse, and radical skepticism.",
        "speaking_module": {
          "prompts": [
            {
              "id": "C2-SPK-01",
              "goal": "Deliver an extemporaneous philosophical exegesis on hyperreality and simulacra.",
              "instructions": "Deliver a rigorous 3-minute philosophical discourse evaluating Jean Baudrillard's thesis that contemporary society has supplanted the real with the simulacrum. How do generative multimodal synthetic media models dissolve the ontological distinction between an authentic biological event and its synthetic facsimile? Speak with absolute tonal command, rhetorical fluidity, and syntactic elegance.",
              "target_phrases": [
                "The ontological boundary between...",
                "Consensus reality is thoroughly superseded by...",
                "An irreducible epistemological crisis..."
              ]
            },
            {
              "id": "C2-SPK-02",
              "goal": "Engage in an intellectual dialectic on epistemic foundationalism vs coherentism.",
              "instructions": "Interrogate the premise that empirical observation can serve as an unshakeable bedrock for absolute truth. Defend coherentism against the Agrippan Trilemma with rigorous dialectical nuance.",
              "target_phrases": [
                "The Cartesian quest for apodictic certainty...",
                "The infinite regress inherent in justification...",
                "Coherentist webs of belief provide no escape from..."
              ]
            }
          ]
        },
        "listening_module": {
          "id": "C2-LIS-01",
          "audio_script": "Professor Emeritus: To postulate that language mirrors external reality is to capitulate to the most naive variant of referential realism. Derrida's dictum that there is no outside-text does not imply an empirical world ceases to exist beyond human consciousness, but rather that our cognitive apprehension of that world is irrevocably conditioned by symbolic signifiers. Every iteration of 'truth' is an act of rhetorical consolidation. Once algorithmic generative systems begin autonomously cross-pollinating these signifiers in a self-referential digital hall of mirrors, the hermeneutic enterprise ceases to uncover meaning; it merely catalogs the endless decay of semiotic resonance.",
          "comprehension_questions": [
            {
              "question": "How does the lecturer characterize the traditional realist conception that words directly map onto objective reality?",
              "options": [
                "A) As an unassailable triumph of late Enlightenment empiricism",
                "B) As a hopelessly naive expression of referential realism",
                "C) As the prerequisite ontological framework for semiotic analysis"
              ],
              "correct_answer": "B) As a hopelessly naive expression of referential realism",
              "explanation": "The professor unequivocally labels the view that language merely mirrors reality as 'capitulating to the most naive variant of referential realism'."
            },
            {
              "question": "According to the lecture, what epistemic consequence ensues when synthetic generative models autonomously remix cultural signifiers?",
              "options": [
                "A) The hermeneutic quest uncovers fundamental objective ontology",
                "B) Human linguistics achieves mathematically complete descriptive accuracy",
                "C) The interpretive pursuit degrades into cataloging the entropic decay of meaning"
              ],
              "correct_answer": "C) The interpretive pursuit degrades into cataloging the entropic decay of meaning",
              "explanation": "The speaker concludes that the hermeneutic enterprise ceases to discover meaning and merely catalogs the 'endless decay of semiotic resonance'."
            }
          ]
        },
        "writing_module": {
          "id": "C2-WRT-01",
          "task_type": "Academic Philosophical Polemic",
          "instructions": "Compose a scholarly essay (350-400 words) interrogating the epistemic validity of sensory data in light of modern neuroscience. Incorporate stylistic devices such as chiasmus, periodic sentences, and negative inversions while adhering to a rigorous academic register.",
          "scaffolding_structures": [
            "Not until empirical observation is interrogated does the fragility of...",
            "So tenuous is the sensory apparatus that...",
            "Neither does perception reveal the thing-in-itself, nor can cognition escape the solipsistic trap of..."
          ]
        },
        "spanglish_error_lab": [
          {
            "error_id": "C2-SPA-01",
            "incorrect_sentence": "The philosopher pretend to demonstrate that human consciousness cannot evict the subjective perception.",
            "spanish_interference": "High-level false cognate and lexical misuse. 1) 'Pretend' in English means to feign or simulate falsehood; the Spanish 'pretender' in academic argumentation is rendered as 'purports to', 'attempts to', or 'seeks to'. 2) 'Evict' strictly refers to the lawful expulsion of a tenant from physical property; the appropriate native verb for escaping or banishing an internal condition or state of perception is 'transcend', 'escape', or 'cast off'.",
            "native_correction": "The philosopher purports to demonstrate that human consciousness cannot transcend subjective perception."
          },
          {
            "error_id": "C2-SPA-02",
            "incorrect_sentence": "Under my point of view, these epistemological arguments are completely out of place.",
            "spanish_interference": "Calque of the ubiquitous Spanish discourse marker 'bajo mi punto de vista'. Standard English usage accepts exclusively 'from my point of view' or 'in my view'. Furthermore, 'out of place' refers to social impropriety or spatial dislocation; in a rigorous intellectual dialectic, arguments are characterized as 'unfounded', 'untenable', or 'beside the point'.",
            "native_correction": "From my perspective, these epistemological arguments are utterly untenable."
          }
        ],
        "lexical_toolbox": [
          {
            "term": "Boil down to",
            "type": "Phrasal Verb",
            "ipa": "/bɔɪl daʊn tuː/",
            "explanation": "To reduce a Byzantine, highly intricate, or protracted theoretical argument to its core, irreducible, essential constituent.",
            "how_to_use": "Intransitive phrasal verb with the mandatory preposition 'to'. Often used in intellectual debates to expose core premises.",
            "example_1": "Strip away the esoteric jargon, and his treatise boils down to basic Cartesian skepticism.",
            "example_2": "The entire epistemological controversy boils down to whether empirical knowledge can ever achieve indubitable certainty."
          },
          {
            "term": "Word salad",
            "type": "Colloquial / Academic Slang Noun",
            "ipa": "/ˈwɜːd ˌsæləd/",
            "explanation": "A confusing, pretentious, or meaningless conglomeration of high-sounding words and esoteric terms lacking coherent syntactic or conceptual logic.",
            "how_to_use": "Uncountable noun. Critical and polemical discourse to dismiss obfuscatory philosophical text.",
            "example_1": "His latest monograph on post-structural metaphysics is nothing more than pretentious, unreadable word salad.",
            "example_2": "The spokesperson attempted to deflect the inquiry with an impenetrable barrage of corporate word salad."
          },
          {
            "term": "Obfuscate",
            "type": "Verb",
            "ipa": "/ˈɒb.fə.skeɪt/",
            "explanation": "To deliberately render something obscure, impenetrable, confusing, or intellectually opaque to confound scrutiny.",
            "how_to_use": "Transitive verb. Common collocations: 'obfuscate the truth', 'obfuscate reality', 'obfuscate intentionality'.",
            "example_1": "Authoritarian regimes deploy labyrinthine legal statutes deliberately designed to obfuscate human rights abuses.",
            "example_2": "The sophist sought to obfuscate the core philosophical contradiction with rhetorical flourishes."
          },
          {
            "term": "Apodictic",
            "type": "Adjective",
            "ipa": "/ˌæp.əˈdɪk.tɪk/",
            "explanation": "Clearly established or beyond the possibility of contradiction; expressing necessary, indubitable truth.",
            "how_to_use": "High-order epistemology and formal philosophical logic. Modifies 'certainty', 'proof', 'truth', 'propositions'.",
            "example_1": "Descartes famously sought an apodictic foundation upon which the edifice of scientific knowledge could be rebuilt.",
            "example_2": "Mathematical axioms possess an apodictic certainty that empirical sciences can never fully duplicate."
          },
          {
            "term": "Grasp at straws",
            "type": "Idiom",
            "ipa": "/ɡrɑːsp æt strɔːz/",
            "explanation": "To resort in desperation to the most fragile, implausible, or hopeless argument or expedient when facing intellectual defeat or collapse.",
            "how_to_use": "Metaphorical idiom. Often applied to a dialectician struggling to sustain an already demolished philosophical premise.",
            "example_1": "Faced with overwhelming neurobiological evidence, the idealist was reduced to grasping at straws to defend metaphysical duality.",
            "example_2": "Invoking paranormal phenomena to explain neurological anomalies is simply grasping at straws."
          },
          {
            "term": "Simulacrum",
            "type": "Useful Vocabulary (Philosophical Noun)",
            "ipa": "/ˌsɪm.jəˈleɪ.krəm/",
            "explanation": "A representation or imitation of a person or thing that either lacks the substance of the original or completely supersedes the reality it purports to represent.",
            "how_to_use": "Plural: 'simulacra' (/ˌsɪm.jəˈleɪ.krə/). Formal academic and critical theory contexts.",
            "example_1": "The theme park is not an homage to the historical city, but a sanitised, hyperreal simulacrum.",
            "example_2": "In the digital age, political discourse has degenerated into a simulacrum of democratic debate without substantive policy friction."
          }
        ]
      }
    }
  ]
} as const;

export const EXPERIENCE_ISLAND_MAP_RAW: Record<string, { theme: string; islands: string[] }> = {
  "A1": {
    "theme": "Foundations & Daily Encounters",
    "islands": [
      "Arrival & Border Control",
      "The Coffee Shop Exchange",
      "Roommates & Living Spaces",
      "Daily Rhythms & Commute",
      "Family Roots & Origins",
      "Supermarket Run",
      "Digital Messaging",
      "Weather & Weekend Outings",
      "Medical Help & Symptoms",
      "Passions & Hobbies",
      "The Office Tour",
      "Milestones & Birthdays",
      "Lost in the Subway",
      "Dining Out & Ordering",
      "Memory Lane: Childhood"
    ]
  },
  "A2": {
    "theme": "Social Routines & Travel Practicalities",
    "islands": [
      "Baggage Claim & Hotels",
      "Workplace Collaboration",
      "Cooking & Home Recipes",
      "Gym, Fitness & Habits",
      "Retail Shopping & Returns",
      "The Road Trip",
      "Global Traditions",
      "Neighborhood News",
      "Job Applications",
      "Streaming & Pop Culture",
      "Personal Finances & Bills",
      "Green Living at Home",
      "Tech Support",
      "City Commute & Transit",
      "Future Plans"
    ]
  },
  "B1": {
    "theme": "Personal Perspectives & Everyday Dilemmas",
    "islands": [
      "Personality Types & Friendships",
      "Urban Legends & Unexplained Mysteries",
      "Consumer Culture & Impulse Spending",
      "Career Pivots",
      "Media Diet & Clickbait",
      "Travel Disruptions & Delays",
      "Social Dynamics & Dating",
      "Stress Management & Burnout",
      "Environmental Choices",
      "The Art of Bargaining",
      "Smart Homes & Privacy",
      "Creative Sparks & Art",
      "Generations at the Workplace",
      "Emergency Response",
      "Life Milestones & Regrets"
    ]
  },
  "B2": {
    "theme": "Critical Perspectives & Societal Trends",
    "islands": [
      "The Psychology of Ambition",
      "Ethical Quandaries in AI",
      "Culture Shock & Expats",
      "Neuromarketing & Subconscious Triggers",
      "The Evolution of Remote Work",
      "Gentrification & Urban Identity",
      "Crime, Punishment & Justice",
      "The Gig Economy Reality",
      "Wellness Industry vs Science",
      "Architecture & Urban Design",
      "Disruptions in Global Supply Chains",
      "Rhetoric & The Power of Persuasion",
      "Socioeconomic Ladders",
      "Aerospace & Deep Ocean Frontiers",
      "Underground Subcultures"
    ]
  },
  "C1": {
    "theme": "Pragmatic Nuance & Strategic Discourse",
    "islands": [
      "Diplomatic Evasion & Crisis Management",
      "Corporate Whistleblowing & Governance",
      "Philosophy of Mind & Subjectivity",
      "Behavioral Economics & Bias",
      "Linguistic Relativity & Identity",
      "Free Speech vs Algorithmic Censorship",
      "Genetic Frontiers & Bioethics",
      "High Art, Irony & Camp",
      "Monetary Policy & Market Shocks",
      "Surveillance Capitalism",
      "Historiography & Narrative Power",
      "Clinical Psychology & Modern Malaise",
      "Secular Rites & Cultural Memory",
      "Geopolitics of Scarce Resources",
      "Satire & Subversive Comedy"
    ]
  },
  "C2": {
    "theme": "Intellectual Precision & Linguistic Virtuosity",
    "islands": [
      "Epistemological Solipsism & Truth",
      "Classical Rhetoric & Stylistic Subversion",
      "Common Law Jurisprudence & Hermeneutics",
      "Post-Humanism & Cybernetics",
      "Archaic Idioms & Dialectical Dialectics",
      "Existentialism & The Absurd",
      "High-Stakes Hostage Negotiations",
      "Dark Ecology & Anthropocene Realities",
      "Shadow Banking & Derivative Arbitrage",
      "Neurobiology of Qualia",
      "Propaganda Engineering & Semiotics",
      "Polyphonic Literature & Stream of Consciousness",
      "Micropolitics of Panoptic Power",
      "Non-Equilibrium Thermodynamics & Emergence",
      "The Semantics of Linguistic Ineffability"
    ]
  }
};

/** Islas generadas con IA y aprobadas (0 de 8). */
export const EXPERIENCE_EXTRA_ISLANDS_RAW = [];
