/* 188 vocaboli concreti: ogni voce e' [inglese, italiano, emoji, categoria].
   Nessuna emoji ripetuta e nessuna parola ripetuta: i distrattori vengono
   dalla stessa categoria, quindi ogni categoria ne ha almeno sei. */
export const WORDS = [
  // ---- animali ----
  ['dog','cane','🐶','a'],['cat','gatto','🐱','a'],['mouse','topo','🐭','a'],
  ['rabbit','coniglio','🐰','a'],['fox','volpe','🦊','a'],['bear','orso','🐻','a'],
  ['panda','panda','🐼','a'],['lion','leone','🦁','a'],['tiger','tigre','🐯','a'],
  ['cow','mucca','🐮','a'],['pig','maiale','🐷','a'],['frog','rana','🐸','a'],
  ['monkey','scimmia','🐵','a'],['chicken','gallina','🐔','a'],['penguin','pinguino','🐧','a'],
  ['bird','uccello','🐦','a'],['duck','anatra','🦆','a'],['owl','gufo','🦉','a'],
  ['horse','cavallo','🐴','a'],['fish','pesce','🐟','a'],['whale','balena','🐳','a'],
  ['dolphin','delfino','🐬','a'],['elephant','elefante','🐘','a'],['snake','serpente','🐍','a'],
  ['turtle','tartaruga','🐢','a'],['butterfly','farfalla','🦋','a'],['bee','ape','🐝','a'],
  ['sheep','pecora','🐑','a'],['wolf','lupo','🐺','a'],['crab','granchio','🦀','a'],
  ['shark','squalo','🦈','a'],['octopus','polpo','🐙','a'],['snail','lumaca','🐌','a'],
  ['ant','formica','🐜','a'],['giraffe','giraffa','🦒','a'],['zebra','zebra','🦓','a'],
  // ---- cibo ----
  ['apple','mela','🍎','f'],['banana','banana','🍌','f'],['grapes','uva','🍇','f'],
  ['strawberry','fragola','🍓','f'],['lemon','limone','🍋','f'],['watermelon','anguria','🍉','f'],
  ['cherry','ciliegia','🍒','f'],['peach','pesca','🍑','f'],['pear','pera','🍐','f'],
  ['pineapple','ananas','🍍','f'],['carrot','carota','🥕','f'],['potato','patata','🥔','f'],
  ['tomato','pomodoro','🍅','f'],['corn','mais','🌽','f'],['bread','pane','🍞','f'],
  ['cheese','formaggio','🧀','f'],['egg','uovo','🥚','f'],['milk','latte','🥛','f'],
  ['cake','torta','🍰','f'],['cookie','biscotto','🍪','f'],['chocolate','cioccolato','🍫','f'],
  ['ice cream','gelato','🍦','f'],['pizza','pizza','🍕','f'],['honey','miele','🍯','f'],
  ['mushroom','fungo','🍄','f'],['avocado','avocado','🥑','f'],['rice','riso','🍚','f'],
  ['soup','zuppa','🍲','f'],['fries','patatine','🍟','f'],['sandwich','panino','🥪','f'],
  ['salad','insalata','🥗','f'],['coffee','caffè','☕','f'],['juice','succo','🧃','f'],
  // ---- colori (l'arancia è esclusa: stessa parola del colore) ----
  ['red','rosso','🔴','c'],['blue','blu','🔵','c'],['green','verde','🟢','c'],
  ['yellow','giallo','🟡','c'],['orange','arancione','🟠','c'],['purple','viola','🟣','c'],
  ['brown','marrone','🟤','c'],['black','nero','⚫','c'],['white','bianco','⚪','c'],
  // ---- numeri ----
  ['one','uno','1️⃣','n'],['two','due','2️⃣','n'],['three','tre','3️⃣','n'],
  ['four','quattro','4️⃣','n'],['five','cinque','5️⃣','n'],['six','sei','6️⃣','n'],
  ['seven','sette','7️⃣','n'],['eight','otto','8️⃣','n'],['nine','nove','9️⃣','n'],
  ['ten','dieci','🔟','n'],
  // ---- casa ----
  ['house','casa','🏠','h'],['door','porta','🚪','h'],['window','finestra','🪟','h'],
  ['bed','letto','🛏️','h'],['chair','sedia','🪑','h'],['sofa','divano','🛋️','h'],
  ['bath','vasca','🛁','h'],['shower','doccia','🚿','h'],['lamp','lampada','💡','h'],
  ['clock','orologio','⏰','h'],['key','chiave','🔑','h'],['mirror','specchio','🪞','h'],
  ['broom','scopa','🧹','h'],['soap','sapone','🧼','h'],['candle','candela','🕯️','h'],
  ['picture','quadro','🖼️','h'],['plant','pianta','🪴','h'],['basket','cesto','🧺','h'],
  // ---- scuola e oggetti ----
  ['book','libro','📚','s'],['pencil','matita','✏️','s'],['pen','penna','🖊️','s'],
  ['ruler','righello','📏','s'],['scissors','forbici','✂️','s'],['backpack','zaino','🎒','s'],
  ['paper','foglio','📄','s'],['crayon','pastello','🖍️','s'],['paint','colori','🎨','s'],
  ['notebook','quaderno','📓','s'],['computer','computer','💻','s'],['phone','telefono','📱','s'],
  ['letter','lettera','✉️','s'],['box','scatola','📦','s'],['bell','campanella','🔔','s'],
  ['map','mappa','🗺️','s'],
  // ---- mezzi ----
  ['car','automobile','🚗','t'],['bus','autobus','🚌','t'],['train','treno','🚆','t'],
  ['bike','bicicletta','🚲','t'],['plane','aereo','✈️','t'],['boat','barca','⛵','t'],
  ['rocket','razzo','🚀','t'],['truck','camion','🚚','t'],['taxi','taxi','🚕','t'],
  ['helicopter','elicottero','🚁','t'],['tractor','trattore','🚜','t'],['scooter','monopattino','🛴','t'],
  ['ship','nave','🚢','t'],['ambulance','ambulanza','🚑','t'],
  // ---- corpo ----
  ['hand','mano','✋','b'],['foot','piede','🦶','b'],['eye','occhio','👁️','b'],
  ['ear','orecchio','👂','b'],['nose','naso','👃','b'],['mouth','bocca','👄','b'],
  ['tooth','dente','🦷','b'],['tongue','lingua','👅','b'],['brain','cervello','🧠','b'],
  ['bone','osso','🦴','b'],['leg','gamba','🦵','b'],['heart','cuore','❤️','b'],
  // ---- natura e tempo ----
  ['sun','sole','☀️','w'],['moon','luna','🌙','w'],['star','stella','⭐','w'],
  ['cloud','nuvola','☁️','w'],['rain','pioggia','🌧️','w'],['snow','neve','❄️','w'],
  ['rainbow','arcobaleno','🌈','w'],['fire','fuoco','🔥','w'],['tree','albero','🌳','w'],
  ['flower','fiore','🌸','w'],['leaf','foglia','🍃','w'],['water','acqua','💧','w'],
  ['mountain','montagna','⛰️','w'],['beach','spiaggia','🏖️','w'],['volcano','vulcano','🌋','w'],
  ['seed','seme','🌱','w'],
  // ---- vestiti ----
  ['shirt','maglietta','👕','p'],['trousers','pantaloni','👖','p'],['dress','vestito','👗','p'],
  ['shoe','scarpa','👟','p'],['boot','stivale','🥾','p'],['hat','cappello','🎩','p'],
  ['cap','berretto','🧢','p'],['sock','calzino','🧦','p'],['glove','guanto','🧤','p'],
  ['scarf','sciarpa','🧣','p'],['coat','cappotto','🧥','p'],['glasses','occhiali','👓','p'],
  // ---- sport e musica ----
  ['ball','palla','⚽','g'],['basketball','pallacanestro','🏀','g'],['tennis','tennis','🎾','g'],
  ['swimming','nuoto','🏊','g'],['skate','pattino','⛸️','g'],['ski','sci','🎿','g'],
  ['guitar','chitarra','🎸','g'],['drum','tamburo','🥁','g'],['piano','pianoforte','🎹','g'],
  ['trumpet','tromba','🎺','g'],['violin','violino','🎻','g'],['medal','medaglia','🏅','g'],
]

export const CATS = { a:'animali', f:'cibo', c:'colori', n:'numeri', h:'casa',
                      s:'scuola', t:'mezzi', b:'corpo', w:'natura', p:'vestiti', g:'sport' }
