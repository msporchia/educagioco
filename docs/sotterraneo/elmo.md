# L'elmo: la casella della testa

Decisione dell'utente (22 ottobre 2026): *«sì all'elmo tutto suo»*. L'eroe ha una settima casella, `testa`, per un copricapo: un elmo
per chi veste il ferro, un cappello per chi veste la stoffa, la cuffia per tutti. Il 3D li disegna coi modelli dei copricapi
(`eroi3d/copricapi.js`). Il codice: `dati/cose.js` (le basi, `CASELLE`, `COPRICAPI`),
`dati/pezzi.js` (la crescita col livello, le abilità), `motore/corredo.js`, `motore/bottino.js` (`copricapoDalTrovato`),
`motore/corsa.js` (`trovato`), `dati/mercanti.js` (le linguette e le battute: il fabbro nomina gli elmi, l'incantatrice i cappelli) e `motore/bottega.js`, `scena3d/anteprime3d-pura.js`
(`COPRICAPI_3D`, `copricapoDi`), `viste/Addosso.vue`. La roba in generale: [roba.md](roba.md); i gioielli: [gioielli.md](gioielli.md).

## La casella e chi porta cosa

- **`dove: 'testa'`**, una casella sola (`CASELLE_DEL_TIPO.testa`), **in coda** a `CASELLE`: chi scorre le altre (il confronto, i
  salvataggi) le trova in ordine.
- **Le famiglie sono quelle delle armature** (`portaLa`, niente famiglie nuove): il ferro per il cavaliere e il nano, la stoffa per
  l'elfa e il mago; la cuffia non ha famiglia e la mette chiunque, come la giubba di cuoio.

| base | nome | famiglia | numeri a livello 1 | prezzo | modelli 3D (dal più umile) |
|---|---|---|---|---|---|
| `cuffia` | Cuffia di cuoio | — | ❤️ 3 | 7 | cuffia di cuoio |
| `elmo` | Elmo | ferro | 🛡️ 1 | 10 | calotta, nasale, paragnatici, grande elmo, elmo del re dorato |
| `elmo-cornuto` | Elmo cornuto | ferro | 🛡️ 1 ❤️ 3 | 16 | elmo a corna, elmo alato |
| `cappuccio` | Cappuccio | stoffa | 🛡️ 1 | 10 | cappuccio, fascia, feltro con piuma |
| `cerchietto` | Cerchietto | stoffa | 🛡️ 1 🔦 1 | 16 | corona di foglie, diadema |
| `cappello-mago` | Cappello a punta | stoffa | 🛡️ 1 ❤️ 3 | 16 | da apprendista, stellato, arcano |

Il nano col suo elmo cornuto, il cavaliere col grande elmo, l'elfa col cerchietto e il mago col cappello a punta sono i pezzi di
ognuno; il bottino predilige quelli della propria famiglia (`PESO_ALTRUI`, come il resto).

## I numeri: una frazione di un'armatura

Nessuna ritaratura: le formule sono quelle delle altre caselle (`componi` in `dati/cose.js`), con il passo raddoppiato.

- **Un punto di difesa, che cresce a metà passo di un'armatura** (`DIF_TESTA_OGNI_LIVELLI` = 2 × `DIF_OGNI_LIVELLI`: +1 ogni trenta
  livelli invece che ogni quindici); la vita di un copricapo cresce a metà passo di quella di un gioiello (`VITA_TESTA_OGNI_LIVELLI`,
  ogni otto). A ogni livello l'elmo para meno della corazza e non più della giubba di cuoio, e costa meno della corazza (un test).
- **Perché una frazione**: la testa è un posto in più, e ogni punto che dà si somma a tutto quello che c'era. Con mezza corazza il
  curioso entra nelle discese con un punto di difesa in più, non con un'armatura in più; i prezzi (7–16) stanno fra la giubba (9) e
  la corazza (18), così il banco non lo propone come una spesa più grossa del corpo.
- **Le abilità dei pezzi magici e rari sono quelle del corpo** (difesa, vita, rigenera, schivata, fortuna, pozioni: `dove` in
  `ABILITA_DEI_PEZZI`), coi valori di ogni altro pezzo: come per i gioielli, la frazione sta sul numero di base, non sulla magia.
- `confronto` lo legge sulla difesa (come scudi e armature): un copricapo migliore di quello che c'è si mette da sé.

## Dove si trova: solo dove è acceso

**I copricapi stanno fuori dal bottino e dai banchi di base** (`copricapo: true` sulle basi: fuori da `PEZZI_DI_BASE`, `IN_VENDITA`,
`A_SORTE`) e ci entrano solo dove il gioco li accende, **`Corredo.copricapi`, spento di difetto come le botti** ([paesaggi-3d.md](paesaggi-3d.md)):
Gioco.vue lo accende (la corsa e la bottega), il banco di prova e la taratura no. Così
i numeri del giocatore finto non si muovono (le «sei storie del curioso» restano quelle), e un copricapo che si ha già si porta
dappertutto.

- **Il bottino** (`copricapoDalTrovato`, `QUOTA_DEL_COPRICAPO` = 1/7): un pezzo trovato su sette (forzieri, mostri, grossi, signori)
  diventa un copricapo **dello stesso livello e della stessa rarità, con altrettante abilità**. Un posto su sette addosso, e i pezzi che
  cadono restano quanti erano. Il tiro e la scelta nascono dal seme, dal piano e dal posto (`Corsa.trovato`, sali loro), come
  l'elisir: accenderlo non sposta niente del resto. Un leggendario e un pezzo col nome restano quello che sono (il copricapo col nome è un
  pezzo in più del suo grosso, più sotto). La roba della storia e delle missioni non cambia. Misurato sui forzieri dell'abisso: 88 su 574, otto su dieci della
  famiglia del cavaliere.
- **Le botteghe**: il fabbro ha la linguetta **«Elmi»** (🪖, ferro e cuffia; la vede chi veste il ferro) e l'incantatrice
  **«Cappelli»** (🎩, stoffa), con `copricapi: true` sulla linguetta (`schedeDi(…, { copricapi })`, `Bottega.prepara`). Le regole di
  ogni linguetta che veste valgono uguali: dieci pezzi, salti e sogni, due da mettersi subito, il livello. Le basi si pescano da
  `BASI_DEL_BANCO` (le basi e i copricapi in coda): le altre linguette restano le stesse, accese o spente (un test).
- **Il livello dei pezzi** ([livello-dei-pezzi.md](livello-dei-pezzi.md)) vale come per tutto: un copricapo di livello N si mette
  dal livello N, e un salvataggio che ce l'ha già addosso lo tiene.
- **Il copricapo col nome**: l'**Elmo alato di Piumanera** (`COPRICAPI_DEI_GROSSI` in `dati/pezzi.js`, `copricapo` in `GROSSI.piumanera`;
  raro, 🛡️ + 🌀 + ❤️ sulla cuffia, che non ha famiglia: lo porta chiunque come gli altri pezzi dei grossi). Cade **in più** del suo
  medaglione solo dove i copricapi sono accesi (`Corsa.copricapi`), senza tiri: il bottino di sempre non si sposta. Non ha una
  figura dei fogli (nessun foglio ha un elmo): `modello: 'elmo-alato'` di `COPRICAPI_3D` lo disegna e `copricapoDi` lo rispetta. Non è un leggendario (la lista di `LEGGENDARI` e i suoi conti non si sono toccati). Un solo grosso: gli altri non ne hanno, e chi vuole il secondo lo aggiunge a `COPRICAPI_DEI_GROSSI` con la riga `copricapo` del grosso.
- **Il mondo di sopra** (gli scontri sul prato, `apriLoScontro`) li fa cadere quando il gioco passa `copricapi: true` (`Gioco.vue`); il
  banco (`banco.js`, `banco-mondo.js`) non lo passa, e i suoi numeri restano quelli di prima (lo stesso patto delle discese: un pezzo su
  sette diventa un copricapo, quanti ne cadono non cambia). Per terra lassù (`stato.perTerra`) un copricapo è una cosa come un'altra.

## I salvataggi

**Un salvataggio senza il campo `testa` non ha niente in testa**, senza conversione: `rileggiRoba` legge `testa` come le altre
caselle (un id sparito vale null) e la `v` della roba resta 1, come per la collana e il secondo anello. Una cosa che non va in testa
(un dato storto) torna in tasca. Il copricapo addosso a chi non lo porta torna nello zaino (`sistemaIlCorredo`, come sempre).

## A schermo

- **La casella sta sopra la testa dell'eroe** (`viste/Addosso.vue`, in cima alla colonna del ritratto), vuota con l'ombra 🪖.
- **La casella c'è sempre**, vuota o piena.
- **Non hanno sprite**: dove manca l'anteprima si vede l'emoji (🪖 elmi e cuffia, 🎩 cappuccio e cappello, 👑 cerchietto);
  `guastiDelleCose` non chiede la figura ai pezzi da testa. La casella, la bottega e il pannello hanno l'anteprima, e per terra
  una cosa senza sprite si vede con la sua emoji sospesa (`scena3d/cose.js`).
- Nella riga del pezzo: «Elmo» per il ferro, «Copricapo» per gli altri (`tipoDi` in `viste/pezzo.js`).

## In scena

- **L'eroe porta il copricapo della casella** (`vestiDotazione` in `scena3d/eroe3d.js`: `copri(eroe, id)`, che nasconde quello di serie
  e, con un elmo, i capelli); senza, l'eroe ha il suo di serie. `#testa=<id>` nell'indirizzo resta la prova, e vince sulla casella.
- **Il modello** (`copricapoDi` in `anteprime3d-pura.js`): ogni base ha i suoi modelli col pregio a cui stanno (`COPRICAPI_3D`), la
  rarità sceglie fra quelli del suo pregio (`pregio` di `RARITA`) e la chiave ne sceglie uno, sempre lo stesso, come l'aspetto di un
  pezzo ([figure.md](figure.md)). Un elmo raro è il grande elmo o quello del re dorato, un cappello comune quello da apprendista.
- **L'anteprima** ([anteprime-3d.md](anteprime-3d.md)): `copricapo:<modello>:<lettera della rarità>`, il copricapo da solo su una
  testa finta, di tre quarti, con l'alone della rarità; uguale per i quattro eroi. Nella chiave dell'eroe vestito il modello va **in
  coda, solo se c'è** (`eroe:…:<collo>:<copricapo>`): le chiavi di chi non ne ha non cambiano.
- Il copricapo in testa all'eroe non ha alone (come la collana: starebbe su tutto l'eroe).

## Cosa resta

- Uno sprite per dove manca l'anteprima (oggi l'emoji): nessun foglio dipinto ha un elmo o un cappello (`bottino-e-arredo` lo dice), e un
  disegno in codice dei sei modelli, a quattro rarità, è un lavoro a sé: per ora restano 🪖 🎩 👑.

Nei test: `unita/sotterraneo-elmo` (la casella e il catalogo, i numeri a frazione, addosso e riposto, i salvataggi di prima, il
bottino acceso e spento sui forzieri dell'abisso, le linguette, le chiavi 3D), `integrazione/sotterraneo-elmo` (col dito: le sette
caselle, «Indossa», l'anteprima, il fabbro); `[data-casella="testa"]` (con `data-cosa`), `[data-scheda="elmi"]`,
`[data-scheda="cappelli"]`.
