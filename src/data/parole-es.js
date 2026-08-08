/* ═══════════════════════════════════════════════════════════════════
   IL LESSICO SPAGNOLO — ogni voce è [spagnolo, italiano, emoji, categoria].

   Stessa forma di `words.js` e stesse categorie: le emoji sono quelle
   dell'inglese, voce per voce, perché sono già state scelte una volta
   senza doppioni e cambiarle vorrebbe solo dire rifare quel lavoro.
   Valgono le due regole di là:

   1. NESSUNA EMOJI RIPETUTA e nessuna parola ripetuta. I distrattori
      figurati escono dalla stessa categoria: due voci con la stessa
      emoji darebbero una domanda con due risposte giuste.
   2. L'EMOJI È FACOLTATIVA (`''`): una voce senza emoji semplicemente
      non esce nelle domande figurate, e va benissimo per aggettivi,
      preposizioni e parole di servizio.

   ── Quale spagnolo ──
   Quello che si parla in casa: dove il boliviano e lo spagnolo di Spagna
   non vanno d'accordo si è scelto il primo — `papa` e non `patata`,
   `palta` e non `aguacate`, `auto`, `celular`, `computadora`, `jugo`,
   `lentes`, `durazno`, `frutilla`. Sono parole capite in tutta l'America
   latina, ed è la lingua che i bambini sentiranno dalla mamma.

   ── Le parole che si somigliano ──
   Alcune coppie in spagnolo si distinguono per poco: `tarde` (tardi) e
   `la tarde` (il pomeriggio), `mañana` (domani) e `la mañana` (la
   mattina). Si tengono con l'articolo, che è come si dicono davvero: due
   voci uguali sarebbero due risposte giuste nella stessa domanda.
   ═══════════════════════════════════════════════════════════════════ */
export const PAROLE_ES = [
  // ---- animali ----
  ['perro','cane','🐶','a'],['gato','gatto','🐱','a'],['ratón','topo','🐭','a'],
  ['conejo','coniglio','🐰','a'],['zorro','volpe','🦊','a'],['oso','orso','🐻','a'],
  ['panda','panda','🐼','a'],['león','leone','🦁','a'],['tigre','tigre','🐯','a'],
  ['vaca','mucca','🐮','a'],['cerdo','maiale','🐷','a'],['rana','rana','🐸','a'],
  ['mono','scimmia','🐵','a'],['gallina','gallina','🐔','a'],['pingüino','pinguino','🐧','a'],
  ['pájaro','uccello','🐦','a'],['pato','anatra','🦆','a'],['búho','gufo','🦉','a'],
  ['caballo','cavallo','🐴','a'],['pez','pesce','🐟','a'],['ballena','balena','🐳','a'],
  ['delfín','delfino','🐬','a'],['elefante','elefante','🐘','a'],['serpiente','serpente','🐍','a'],
  ['tortuga','tartaruga','🐢','a'],['mariposa','farfalla','🦋','a'],['abeja','ape','🐝','a'],
  ['oveja','pecora','🐑','a'],['lobo','lupo','🐺','a'],['cangrejo','granchio','🦀','a'],
  ['tiburón','squalo','🦈','a'],['pulpo','polpo','🐙','a'],['caracol','lumaca','🐌','a'],
  ['hormiga','formica','🐜','a'],['jirafa','giraffa','🦒','a'],['cebra','zebra','🦓','a'],
  ['camello','cammello','🐫','a'],['cocodrilo','coccodrillo','🐊','a'],['leopardo','leopardo','🐆','a'],
  ['ciervo','cervo','🦌','a'],['erizo','riccio','🦔','a'],['loro','pappagallo','🦜','a'],
  ['ardilla','scoiattolo','🐿️','a'],['murciélago','pipistrello','🦇','a'],['foca','foca','🦭','a'],
  ['pavo real','pavone','🦚','a'],['canguro','canguro','🦘','a'],['araña','ragno','🕷️','a'],
  // ---- cibo ----
  ['manzana','mela','🍎','f'],['plátano','banana','🍌','f'],['uvas','uva','🍇','f'],
  ['frutilla','fragola','🍓','f'],['limón','limone','🍋','f'],['sandía','anguria','🍉','f'],
  ['cereza','ciliegia','🍒','f'],['durazno','pesca','🍑','f'],['pera','pera','🍐','f'],
  ['piña','ananas','🍍','f'],['zanahoria','carota','🥕','f'],['papa','patata','🥔','f'],
  ['tomate','pomodoro','🍅','f'],['maíz','mais','🌽','f'],['pan','pane','🍞','f'],
  ['queso','formaggio','🧀','f'],['huevo','uovo','🥚','f'],['leche','latte','🥛','f'],
  ['torta','torta','🍰','f'],['galleta','biscotto','🍪','f'],['chocolate','cioccolato','🍫','f'],
  ['helado','gelato','🍦','f'],['pizza','pizza','🍕','f'],['miel','miele','🍯','f'],
  ['hongo','fungo','🍄','f'],['palta','avocado','🥑','f'],['arroz','riso','🍚','f'],
  ['sopa','zuppa','🍲','f'],['papas fritas','patatine','🍟','f'],['sándwich','panino','🥪','f'],
  ['ensalada','insalata','🥗','f'],['café','caffè','☕','f'],['jugo','succo','🧃','f'],
  ['mantequilla','burro','🧈','f'],['sal','sale','🧂','f'],['pepino','cetriolo','🥒','f'],
  ['cebolla','cipolla','🧅','f'],['ajo','aglio','🧄','f'],['brócoli','broccolo','🥦','f'],
  ['fideos','pasta','🍝','f'],['carne','carne','🥩','f'],['hamburguesa','hamburger','🍔','f'],
  ['palomitas','popcorn','🍿','f'],['té','tè','🍵','f'],['panqueque','frittella','🥞','f'],
  ['mango','mango','🥭','f'],['coco','cocco','🥥','f'],['caramelo','caramella','🍬','f'],
  ['dona','ciambella','🍩','f'],['nuez','noce','🌰','f'],['desayuno','colazione','','f'],
  ['almuerzo','pranzo','','f'],['cena','cena','','f'],
  // ---- colori ----
  ['rojo','rosso','🔴','c'],['azul','blu','🔵','c'],['verde','verde','🟢','c'],
  ['amarillo','giallo','🟡','c'],['naranja','arancione','🟠','c'],['morado','viola','🟣','c'],
  ['marrón','marrone','🟤','c'],['negro','nero','⚫','c'],['blanco','bianco','⚪','c'],
  ['rosado','rosa','','c'],['gris','grigio','','c'],['dorado','oro','','c'],
  ['plateado','argento','','c'],['color','colore','','c'],
  // ---- numeri ----
  ['uno','uno','1️⃣','n'],['dos','due','2️⃣','n'],['tres','tre','3️⃣','n'],
  ['cuatro','quattro','4️⃣','n'],['cinco','cinque','5️⃣','n'],['seis','sei','6️⃣','n'],
  ['siete','sette','7️⃣','n'],['ocho','otto','8️⃣','n'],['nueve','nove','9️⃣','n'],
  ['diez','dieci','🔟','n'],
  ['once','undici','','n'],['doce','dodici','','n'],['trece','tredici','','n'],
  ['catorce','quattordici','','n'],['quince','quindici','','n'],['dieciséis','sedici','','n'],
  ['diecisiete','diciassette','','n'],['dieciocho','diciotto','','n'],['diecinueve','diciannove','','n'],
  ['veinte','venti','','n'],['treinta','trenta','','n'],['cuarenta','quaranta','','n'],
  ['cincuenta','cinquanta','','n'],['cien','cento','','n'],['mil','mille','','n'],
  ['primero','primo','','n'],['segundo','secondo','','n'],['tercero','terzo','','n'],
  // ---- casa ----
  ['casa','casa','🏠','h'],['puerta','porta','🚪','h'],['ventana','finestra','🪟','h'],
  ['cama','letto','🛏️','h'],['silla','sedia','🪑','h'],['sofá','divano','🛋️','h'],
  ['bañera','vasca','🛁','h'],['ducha','doccia','🚿','h'],['lámpara','lampada','💡','h'],
  ['reloj','orologio','⏰','h'],['llave','chiave','🔑','h'],['espejo','specchio','🪞','h'],
  ['escoba','scopa','🧹','h'],['jabón','sapone','🧼','h'],['vela','candela','🕯️','h'],
  ['cuadro','quadro','🖼️','h'],['planta','pianta','🪴','h'],['canasta','cesto','🧺','h'],
  ['tenedor','forchetta','🍴','h'],['cuchara','cucchiaio','🥄','h'],['plato','piatto','🍽️','h'],
  ['taza','tazza','🫖','h'],['botella','bottiglia','🍾','h'],['inodoro','gabinetto','🚽','h'],
  ['escalera','scale','🪜','h'],['frazada','coperta','🛌','h'],['almohada','cuscino','','h'],
  ['mesa','tavolo','','h'],['cocina','cucina','','h'],['dormitorio','camera','','h'],
  ['baño','bagno','','h'],['garaje','garage','','h'],['techo','tetto','','h'],
  ['pared','muro','','h'],['piso','pavimento','','h'],
  // ---- scuola e oggetti ----
  ['libro','libro','📚','s'],['lápiz','matita','✏️','s'],['bolígrafo','penna','🖊️','s'],
  ['regla','righello','📏','s'],['tijeras','forbici','✂️','s'],['mochila','zaino','🎒','s'],
  ['papel','foglio','📄','s'],['crayón','pastello','🖍️','s'],['pinturas','colori','🎨','s'],
  ['cuaderno','quaderno','📓','s'],['computadora','computer','💻','s'],['celular','telefono','📱','s'],
  ['carta','lettera','✉️','s'],['caja','scatola','📦','s'],['campana','campanella','🔔','s'],
  ['mapa','mappa','🗺️','s'],['pegamento','colla','🩹','s'],['borrador','gomma','🧽','s'],
  ['pizarra','lavagna','📋','s'],['pupitre','banco','','s'],['examen','verifica','📝','s'],
  ['tarea','compiti','','s'],['lección','lezione','','s'],['palabra','parola','','s'],
  ['pregunta','domanda','❓','s'],['respuesta','risposta','','s'],['cuento','storia','📖','s'],
  ['canción','canzone','🎵','s'],
  // ---- mezzi ----
  ['auto','automobile','🚗','t'],['autobús','autobus','🚌','t'],['tren','treno','🚆','t'],
  ['bicicleta','bicicletta','🚲','t'],['avión','aereo','✈️','t'],['bote','barca','⛵','t'],
  ['cohete','razzo','🚀','t'],['camión','camion','🚚','t'],['taxi','taxi','🚕','t'],
  ['helicóptero','elicottero','🚁','t'],['tractor','trattore','🚜','t'],['monopatín','monopattino','🛴','t'],
  ['barco','nave','🚢','t'],['ambulancia','ambulanza','🚑','t'],['motocicleta','motocicletta','🏍️','t'],
  ['camión de bomberos','autopompa','🚒','t'],['trineo','slitta','🛷','t'],['rueda','ruota','🛞','t'],
  ['boleto','biglietto','🎫','t'],['viaje','viaggio','','t'],
  // ---- corpo ----
  ['mano','mano','✋','b'],['pie','piede','🦶','b'],['ojo','occhio','👁️','b'],
  ['oreja','orecchio','👂','b'],['nariz','naso','👃','b'],['boca','bocca','👄','b'],
  ['diente','dente','🦷','b'],['lengua','lingua','👅','b'],['cerebro','cervello','🧠','b'],
  ['hueso','osso','🦴','b'],['pierna','gamba','🦵','b'],['corazón','cuore','❤️','b'],
  ['brazo','braccio','','b'],['dedo','dito','👆','b'],['pelo','capelli','💇','b'],
  ['cara','faccia','😐','b'],['cabeza','testa','','b'],['espalda','schiena','','b'],
  ['cuello','collo','','b'],['rodilla','ginocchio','','b'],['hombro','spalla','','b'],
  ['barriga','pancia','','b'],
  // ---- natura e tempo che fa ----
  ['sol','sole','☀️','w'],['luna','luna','🌙','w'],['estrella','stella','⭐','w'],
  ['nube','nuvola','☁️','w'],['lluvia','pioggia','🌧️','w'],['nieve','neve','❄️','w'],
  ['arcoíris','arcobaleno','🌈','w'],['fuego','fuoco','🔥','w'],['árbol','albero','🌳','w'],
  ['flor','fiore','🌸','w'],['hoja','foglia','🍃','w'],['agua','acqua','💧','w'],
  ['montaña','montagna','⛰️','w'],['playa','spiaggia','🏖️','w'],['volcán','vulcano','🌋','w'],
  ['semilla','seme','🌱','w'],['viento','vento','🌬️','w'],['tormenta','temporale','⛈️','w'],
  ['niebla','nebbia','🌫️','w'],['hielo','ghiaccio','🧊','w'],['mar','mare','🌊','w'],
  ['río','fiume','🏞️','w'],['bosque','bosco','🌲','w'],['isla','isola','🏝️','w'],
  ['desierto','deserto','🏜️','w'],['pasto','erba','🌿','w'],['piedra','sasso','🪨','w'],
  ['cielo','cielo','','w'],['tierra','terra','🌍','w'],['aire','aria','','w'],
  // ---- vestiti ----
  ['camiseta','maglietta','👕','p'],['pantalón','pantaloni','👖','p'],['vestido','vestito','👗','p'],
  ['zapato','scarpa','👟','p'],['bota','stivale','🥾','p'],['sombrero','cappello','🎩','p'],
  ['gorra','berretto','🧢','p'],['calcetín','calzino','🧦','p'],['guante','guanto','🧤','p'],
  ['bufanda','sciarpa','🧣','p'],['abrigo','cappotto','🧥','p'],['lentes','occhiali','👓','p'],
  ['falda','gonna','👚','p'],['suéter','maglione','🩳','p'],['pijama','pigiama','🩲','p'],
  ['paraguas','ombrello','☂️','p'],['anillo','anello','💍','p'],['bolso','borsa','👜','p'],
  ['bolsillo','tasca','','p'],['botón','bottone','','p'],
  // ---- sport, musica, giochi ----
  ['pelota','palla','⚽','g'],['básquet','pallacanestro','🏀','g'],['tenis','tennis','🎾','g'],
  ['natación','nuoto','🏊','g'],['patín','pattino','⛸️','g'],['esquí','sci','🎿','g'],
  ['guitarra','chitarra','🎸','g'],['tambor','tamburo','🥁','g'],['piano','pianoforte','🎹','g'],
  ['trompeta','tromba','🎺','g'],['violín','violino','🎻','g'],['medalla','medaglia','🏅','g'],
  ['juego','gioco','🎮','g'],['rompecabezas','puzzle','🧩','g'],['cometa','aquilone','🪁','g'],
  ['muñeca','bambola','🪆','g'],['peluche','orsacchiotto','🧸','g'],['dado','dado','🎲','g'],
  ['cartas','carte','🃏','g'],['carrera','gara','🏁','g'],['equipo','squadra','','g'],
  ['música','musica','🎶','g'],
  // ---- persone e famiglia ----
  ['mamá','mamma','👩','k'],['papá','papà','👨','k'],['hermana','sorella','👧','k'],
  ['hermano','fratello','👦','k'],['bebé','bambino piccolo','👶','k'],['abuela','nonna','👵','k'],
  ['abuelo','nonno','👴','k'],['maestra','maestra','🧑‍🏫','k'],['doctor','dottore','🧑‍⚕️','k'],
  ['agricultor','contadino','🧑‍🌾','k'],['cocinero','cuoco','🧑‍🍳','k'],['policía','poliziotto','👮','k'],
  ['bombero','pompiere','🧑‍🚒','k'],['rey','re','🤴','k'],['reina','regina','👸','k'],
  ['piloto','pilota','🧑‍✈️','k'],['enfermera','infermiera','💉','k'],['cantante','cantante','🎤','k'],
  ['amigo','amico','🤝','k'],['familia','famiglia','🏡','k'],['hombre','uomo','','k'],
  ['mujer','donna','','k'],['chico','maschio','','k'],['chica','femmina','','k'],
  ['niño','bambino','','k'],['gente','gente','','k'],['nombre','nome','','k'],
  ['tía','zia','','k'],['tío','zio','','k'],['primo','cugino','','k'],
  // ---- tempo, giorni, stagioni ----
  ['lunes','lunedì','','d'],['martes','martedì','','d'],['miércoles','mercoledì','','d'],
  ['jueves','giovedì','','d'],['viernes','venerdì','','d'],['sábado','sabato','','d'],
  ['domingo','domenica','','d'],['hoy','oggi','','d'],['mañana','domani','','d'],
  ['ayer','ieri','','d'],['la mañana','mattina','🌅','d'],['la tarde','pomeriggio','','d'],
  ['el atardecer','sera','🌆','d'],['la noche','notte','🌃','d'],['el día','giorno','','d'],
  ['semana','settimana','📅','d'],['mes','mese','🗓️','d'],['año','anno','','d'],
  ['hora','ora','⌛','d'],['minuto','minuto','⏱️','d'],['tiempo','tempo','⏳','d'],
  ['primavera','primavera','','d'],['verano','estate','','d'],['otoño','autunno','🍂','d'],
  ['invierno','inverno','⛄','d'],['cumpleaños','compleanno','🎂','d'],['Navidad','Natale','🎄','d'],
  ['vacaciones','vacanza','🎉','d'],['fin de semana','fine settimana','','d'],['temprano','presto','','d'],
  ['tarde','tardi','','d'],
  // ---- luoghi ----
  ['escuela','scuola','🏫','y'],['tienda','negozio','🏪','y'],['hospital','ospedale','🏥','y'],
  ['iglesia','chiesa','⛪','y'],['estación','stazione','🚉','y'],['museo','museo','🏛️','y'],
  ['banco','banca','🏦','y'],['castillo','castello','🏰','y'],['puente','ponte','🌉','y'],
  ['cine','cinema','🎬','y'],['aeropuerto','aeroporto','🛫','y'],['ciudad','città','🏙️','y'],
  ['pueblo','paese','🏘️','y'],['carretera','strada','🛣️','y'],['carpa','tenda','⛺','y'],
  ['circo','circo','🎪','y'],['fábrica','fabbrica','🏭','y'],['parque','parco','🎠','y'],
  ['jardín','giardino','','y'],['mercado','mercato','','y'],['biblioteca','biblioteca','','y'],
  ['zoológico','zoo','','y'],['restaurante','ristorante','','y'],['granja','fattoria','','y'],
  ['patio','cortile','','y'],['piscina','piscina','','y'],['país','paese, nazione','','y'],
  ['mundo','mondo','','y'],
  // ---- come sono le cose: aggettivi ----
  ['grande','grande','','j'],['pequeño','piccolo','','j'],['alto','alto','','j'],
  ['bajo','basso, corto','','j'],['largo','lungo','','j'],['nuevo','nuovo','','j'],
  ['viejo','vecchio','','j'],['joven','giovane','','j'],['bueno','buono','','j'],
  ['malo','cattivo','','j'],['feliz','felice','😀','j'],['triste','triste','😢','j'],
  ['enojado','arrabbiato','😠','j'],['caliente','caldo','🥵','j'],['frío','freddo','🥶','j'],
  ['rápido','veloce','','j'],['lento','lento','','j'],['fácil','facile','','j'],
  ['difícil','difficile','','j'],['limpio','pulito','','j'],['sucio','sporco','','j'],
  ['bonito','bello','','j'],['gracioso','divertente','😂','j'],['fuerte','forte','💪','j'],
  ['cansado','stanco','😪','j'],['hambriento','affamato','','j'],['sediento','assetato','','j'],
  ['lleno','pieno','','j'],['vacío','vuoto','','j'],['callado','silenzioso','🤫','j'],
  ['ruidoso','rumoroso','','j'],['suave','morbido','','j'],['duro','duro','','j'],
  ['mojado','bagnato','','j'],['seco','asciutto','','j'],['asustado','spaventato','😨','j'],
  ['enfermo','malato','🤒','j'],['listo','pronto','','j'],['amable','gentile','','j'],
  ['valiente','coraggioso','','j'],['dulce','dolce','','j'],['correcto','giusto','','j'],
  ['equivocado','sbagliato','','j'],['igual','uguale','','j'],['diferente','diverso','','j'],
  // ---- parole che tengono insieme le frasi ----
  ['yo','io','','q'],['tú','tu','','q'],['él','lui','','q'],
  ['ella','lei','','q'],['nosotros','noi','','q'],['ellos','loro','','q'],
  ['mi','mio','','q'],['tuyo','tuo','','q'],['de él','suo (di lui)','','q'],
  ['de ella','suo (di lei)','','q'],['nuestro','nostro','','q'],['este','questo','','q'],
  ['ese','quello','','q'],['aquí','qui','','q'],['allí','lì','','q'],
  ['quién','chi','','q'],['qué','che cosa','','q'],['dónde','dove','','q'],
  ['cuándo','quando','','q'],['por qué','perché','','q'],['cómo','come','','q'],
  ['y','e','','q'],['pero','ma','','q'],['o','o','','q'],
  ['con','con','','q'],['en','dentro','','q'],['sobre','sopra','','q'],
  ['debajo','sotto','','q'],['detrás','dietro','','q'],['cerca','vicino','','q'],
  ['siempre','sempre','','q'],['nunca','mai','','q'],['a veces','a volte','','q'],
  ['ahora','adesso','','q'],['muy','molto','','q'],['otra vez','ancora','','q'],
  ['por favor','per favore','','q'],['gracias','grazie','','q'],['perdón','scusa','','q'],
  ['hola','ciao (saluto)','','q'],['adiós','arrivederci','','q'],['sí','sì','','q'],
]

/* le stesse categorie dell'inglese: i nomi li legge solo chi guarda i
   progressi, il gioco usa le lettere */
export const CATS_ES = { a:'animali', f:'cibo', c:'colori', n:'numeri', h:'casa',
                         s:'scuola', t:'mezzi', b:'corpo', w:'natura', p:'vestiti',
                         g:'sport e giochi', k:'persone', d:'tempo e giorni',
                         y:'luoghi', j:'com’è fatto', q:'parole di tutti i giorni' }
