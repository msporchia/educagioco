# Español a mondi — le trappole

Le frasi sbagliate dello spagnolo a mondi: la tabella `dati/trappole.js`
e le operazioni di `motore/trappole.js`. Il resto del motore e il
contratto per chi scrive frasi e capitoli stanno in
[spagnolo-motore.md](spagnolo-motore.md); il metodo, uguale all'inglese, in
[trappole.md](trappole.md).

## La tabella

La tabella (`dati/trappole.js`) ha una riga per errore tipico di chi parla
italiano, con il suo perché per un bambino (sotto i 70 caratteri, a frase
riempita) e un `esempio` che il test rifà. Ogni forma di `dati/forme.js` ha
almeno una riga. **Nascono da sole**, su ogni frase dove l'errore si può
fare:

| dove | righe |
|---|---|
| genere e numero | `un-una` (*una perro*), `el-la`, `el-agua` (*la agua*), `este-esta`, `aggettivo-genere` (*una vaca negro*, *la vaca es negro*), `aggettivo-numero`, `aggettivo-prima` (*un negro gato*), `buenos-buenas`, `plurale-mancante` (*dos perro*, *los gato*), `plurale-in-piu` (*un gatos*), `plurale-sbagliato` (*lápizes*), `mi-mis`, `mucho-accordo`, `un-poco-de` |
| all'italiana | `mi-me` (*mi llamo*), `te-ti`, `ho-he` (*he un perro*), `tener-ser` (*soy hambre*, *soy siete años*), `gustar-io` (*yo gusto el pan*), `gusta-gustan`, `hace-es` (*es frío*), `muy-mucho` (*muy frío*), `en-a` (*estoy a casa*), `a-en` (*voy en el parque*), `costa` |
| ser, estar, hay | `ser-al-posto-di-estar` (*soy cansado*, *es en casa*, *soy bien*), `estar-al-posto-di-ser` (*está un perro*), `hay-es`, `hay-el`, `estuve-fui` |
| i verbi | `persona-ser`, `persona-tener`, `persona-verbo` (*yo juega*: solo col soggetto scritto), `desinenza-classe` (*ella coma*, *vivemos*), `dittongo` (*quero*), `dittongo-in-piu` (*puedemos*), `infinito-dopo-querer` (*quiero nado*), `riflessivo-mancante`, `riflessivo-persona`, `gerundio-senza-estar`, `gerundio-infinito` (*estoy comer*), `gerundio-classe` (*comando*), `voy-senza-a`, `voy-a-gerundio` |
| il passato | `passato-al-presente`, `passato-regolare` (*hací*), `dijo-regolare` (*deció*), `passato-accento` (*comio*), `passato-ortografia` (*jugé*) |
| al, del, la strada | `contrazione-a` (*a el*), `contrazione-de`, `al-femminile` (*al escuela*), `del-femminile`, `direzione-senza-la`, `al-lado-al`, `posto-scambiato`, `sinistra-destra` |
| l'ora e le date | `ora-es-son` (*es las tres*), `ora-a-en`, `data-senza-de`, `giorno-con-en`, `mese-con-el` |
| la scrittura | `accento-domanda` (*¿que es?*), `accento-in-piu` (*más alto qué*), `accento-corto` (*vió*, *dió*, *fué*), `el-él`, `tu-tú` |
| il senso | `parola-che-chiede`, `mio-tuo`, `lui-lei`, `oggi-domani`, `cuando-mientras`, `negazione-tolta`, `negazione-aggiunta`, `parola-vicina` |
| i paragoni | `mas-de` (*más alto de*), `mas-bueno`, `mas-mejor` |

**Una trappola sbaglia in un punto solo.** Cambiare una parola rifà il
resto: la parola vicina si porta il suo genere (*el gato negro* → *la vaca
negra*, *esta es mi regla* → *este es mi libro*, *a la* → *al*), tiene il
numero (mai una cosa già plurale al posto di una sola, mai *un* davanti a
una cosa che non si conta), e un verbo resta nella sua persona e nel suo
tempo (*juego* → *canto*); *él* al posto di *ella* riaccorda il predicato
(*él es alto*), e allora l'italiano non si offre. Le trappole di una
domanda sono domande: non ce n'è nessuna che la gira in affermazione.
**`sgrammaticata` controlla** ogni frase e ogni trappola: articolo,
dimostrativo, possessivo e quantità col genere e il numero del nome,
l'aggettivo prima e dopo, il predicato del soggetto in testa, il plurale
dopo un numero, *un* con le cose che non si contano, *el agua*, *a el*,
*primer*. Le righe che sbagliano apposta queste cose stanno in `APPOSTA`.
Un aggettivo che è anche un verbo (*limpia*) non si controlla.

**Le gemelle** (`GEMELLE`, la prima parola di ogni fila è quella a cui la
fila appartiene): *es/son*, *soy/eres*, *estoy/estás/está*, *tengo/tiene*,
*un/una*, *el/la/los/las*, *mi/mis/me*, *gusta/gustan*, *al/a/el*,
*a/en*, *qué/que*… Niente *es/está* né *en/sobre*: darebbero una seconda
frase giusta. Le altre gemelle le fa `motore/formati.js`: le forme dello
stesso verbo che la tappa ammette (*juego* → *juegas*, *jugar*),
l'aggettivo nell'altro genere e numero (*negro* → *negra*, *negros*), il
nome nell'altro numero (*gato* → *gatos*).

## Le parole che una trappola può mostrare

**Una trappola generata non mette davanti al bambino una parola vera che
la sua tappa non gli ha mai mostrato**: *el gato soy negro* in prima, quando
*soy* non è ancora arrivato, insegna una parola invece dello sbaglio. Una
parola è «vera» se toccata si traduce (`traduci(w).it`); è nota come per le
frasi (`sconosciute` di `motore/grafo.js`, col contesto della tappa che
`contesto` di `motore/formati.js` passa a `trappoleDi`). Restano:

- **i refusi**, che non sono parole: *ola*, *adonde*, *comio*, *lápizes*;
- **le parole della frase giusta** e **la stessa parola senza o con
  l'accento** (*como* per *cómo*, *tu* per *tú*): lo sbaglio è l'accento;
- **il calco italiano** delle righe con `calco: true` (`mi-me`, `te-ti`): *mi
  llamo* sbaglia proprio con la parola che il bambino sa dall'italiano;
- **le trappole scritte a mano**, che non si filtrano.

Con solo *Io lavo* arrivato (la forma `presente-ar` sì, `presente-er-ir`
no) le forme del presente dei verbi in *-er* e *-ir* (*como*, *vives*) non
sono ancora note: niente distrattori di un'altra classe (`soloAr` del
contesto). **Una trappola con parole mai viste torna solo se senza non se ne
fanno tre** (prima quella con meno parole nuove): oggi succede a *hola me
llamo Leo* (*se llamo*) e a *dónde estás* (*cuándo estás*).

## Le scelte delle operazioni

- **`gustar-io`** non si fa con *a mí*, *a ti*, *a Leo* in testa (chi è lo
  dice già «a …»); il soggetto va prima di *no* e *también* (*yo también
  gusto*). Se la tappa non ha mai visto *gusto*, la trappola è *yo gusta*;
  con *gustan* allora non si fa.
- **`riflessivo-persona`** solo con *me*, *te*, *nos* e il verbo della
  stessa persona: *papá se levanta* non ha trappola (*papá me levanta* è
  giusta, con un altro senso). Il perché dice la persona: «Tu: te lavas».
- **`negazione-aggiunta`** mette *no* davanti al verbo, anche dopo un
  complemento di tempo (*el sábado Leo no fue*). L'italiano si offre solo
  quando si sa dov'è il verbo: dopo *io, tu, lui…* se il soggetto spagnolo è
  un pronome, o in testa se la frase comincia col verbo; con un nome per
  soggetto, con *gira, sigue, cruza* (in italiano «vai») e con *también*
  (ci vorrebbe *tampoco*) niente italiano, o niente trappola.
  **`negazione-tolta`** non offre l'italiano con *mai*, *niente*, *nessuno*.
- **`tener-ser`** non si fa quando *ser* rende *frío* un aggettivo che non
  si accorda (*ellos son frío*): sarebbe sgrammaticata per caso.
- **`lui-lei`** riaccorda il predicato anche dopo *y, pero, que…* (*yo soy
  alto y él es bajo*) e l'articolo davanti a un aggettivo senza nome (*él es
  el mejor*, *él es el más alto*); quando riaccorda, l'italiano non si offre.
- **`mas-de`** contrae: *más rápido que el perro* → *del perro*; il perché
  dice *más* o *menos* e l'aggettivo della frase.
- **`passato-al-presente`** su *fue*, *fui*: *ir* se dopo c'è *a* o *al*
  (*fue al parque* → *va*), se no *ser* (*ayer fue lunes* → *es*).
- **`dittongo`** non tocca una forma che è anche un'altra cosa (*viste*:
  hai visto; *este juego*: il gioco) né scrive una parola vera (*juego* →
  *jugo*, il succo).
- **`parola-vicina`**: niente plurale per mesi, stagioni, *mañana*, *tarde*,
  *noche* (*los eneros*); il nome del predicato tiene il genere del soggetto
  (*nosotros somos hermanas* no); dopo *hace* solo il tempo che si fa
  (*frío, calor, sol, viento*: niente *hace mucha nube*).
- **`mese-con-el`** solo coi mesi: *en el invierno* si dice anche.
- **`hace-es`** dice la cosa intera: «hace mucho frío».
- **`posto-scambiato`** sistema l'italiano: *vicino alla porta*, *sopra la
  porta*.
- **`accento-in-piu`** vale anche dentro una domanda: «Qui cuando non
  chiede: niente accento».
- **`desinenza-classe`** anche senza soggetto (*comes* → *comas*): la
  persona la dice il verbo; mai con *yo* (tutte le classi fanno *-o*).
- **`soggettoInTesta`** salta i complementi di tempo in testa (*hoy*,
  *ayer*, *el sábado*, *en mayo*, *a las siete*), e *Leo* con la maiuscola è
  un nome, non *leo* di *leer*.

## Nei test

`unita/spagnolo-lingua` rifà l'`esempio` di ogni riga e controlla che le
righe di `APPOSTA` sbaglino la concordanza; `guastiDelleFrasi`
(`unita/spagnolo-mondi`) vuole almeno tre trappole per frase, nessuna
sgrammaticata per caso fuori da `APPOSTA`.
