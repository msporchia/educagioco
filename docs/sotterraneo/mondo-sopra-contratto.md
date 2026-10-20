# Il motore di sopra sul percorso: il contratto

Cosa danno `motore/mondo-sopra.js` e `motore/aperta.js` sul mondo a percorso ([mondo-a-percorso.md](mondo-a-percorso.md), il
generatore in [mondo-aperto-generatore.md](mondo-aperto-generatore.md)) a chi disegna (il compito D: `viste/Mondo3d.vue`,
`scena3d/mondo/*`) e a chi fa le terre (E). È il compito B di [mondo-a-percorso-lavori.md](mondo-a-percorso-lavori.md). Le regole
dei mostri stanno in [mondo-aperto-mostri.md](mondo-aperto-mostri.md), le taglie in [mondo-aperto-quest.md](mondo-aperto-quest.md).

## Il mondo tenuto e le zone che seguono l'eroe

- **`ilMondo({ terra })`** torna lo scheletro del percorso (`scheletroDelMondo`, seme 8) con le zone attorno alla partenza già caricate
  (la 0 col villaggio e la 1): la stessa istanza per pagina, una per terra (cambiando terra si rifà).
- **`seguiLEroe(m, x, y)`** tiene caricate la zona dell'eroe e le due accanto e butta le altre (`tieniAttorno` del generatore); torna
  `{ zona, caricate, scaricate }`. Si chiama **a ogni cella nuova** dell'eroe (e dopo un viaggio con la pietra): costa niente se non
  cambia zona, 25–130 ms in Node (×3–5 sul telefono) quando una zona si carica. Le celle di una zona scaricata restano scritte; le liste
  (decoro, case, campi) se ne vanno, e la scena butta i pezzi di quella zona.
- **`terraDelMondo(m)`** è la terra dell'A* (`creaTerra`) su tutte le celle scritte: una zona mai caricata è roccia. È la stessa finché
  non si carica una zona per la prima volta, poi una nuova: **la scena la richiede dopo ogni `seguiLEroe` con `caricate`**, non la tiene.
- **I mostri seguono da soli**: `muoviMostri`, `cammina` e `incontro` guardano `m.zonaCaricata` e popolano le zone appena caricate,
  dimenticano quelle scaricate (`allineaZone(stato)`, che si può anche chiamare a mano dopo `seguiLEroe`). Un mostro di una zona
  dimenticata non c'è più: la scena smette di disegnarlo (`mostriVicini` non lo dà).
- **Per gli strumenti e i test**: `ilMondoIntero()` carica tutto (~1 s in Node). Rimessi poi con `seguiLEroe`.

## `motore/mondo-sopra.js`

| funzione | cosa fa |
|---|---|
| `ilMondo({ terra })`, `ilMondoIntero()`, `seguiLEroe(m, x, y)`, `terraDelMondo(m)` | sopra |
| `tieniAttorno`, `zonaDi`, `livelloDi`, `zoneAttorno`, `caricaTutto`, `baseDi`, `listaDi` | rilanciate dal generatore |
| `postiDi(m, tipo)`, `pietreDi(m)`, `ingressoDi(m, chiave)` | i posti; le otto pietre; un ingresso (con `zona`, `regione`, `livello`) |
| `cittaDi(m, chiave)`, `cittaInCella(m, x, y)` | il villaggio (anche per le chiavi `forte` e `rifugio`) |
| `regioneInCella(m, x, y)`, `zonaInCella(m, x, y)` | il luogo (le chiavi di sempre) e la zona di una cella |
| `lontanoDalleCitta(m, x, y)`, `MARGINE_DEL_GIRO` | il giro della bacheca, come prima |
| `dungeonDi(chiave)`, `dungeonDellIndice(i)` | dalla scheda (senza il mondo): `nome`, `indice`, `livello`, `zona`, `monumento`… |
| `cittaDelDungeon()`, `portaleDella(m)`, `minatoreDi(m)`, `capitanoDi(m)` | tutto nel villaggio |
| `hoLaFontana`, `fontaneDi(m, terra)`, `curaDellaFontana(forze)` | la regola resta; il villaggio ha chi cura: nessuna fontana |
| `nomeDellaPietra(chiave)`, `difDellaPietra(m, chiave)`, `pietraAccanto(m, x, y)` | le pietre; anche con le chiavi di prima |
| `meteDelViaggio(m, da, accese)` | da una accesa: il villaggio sempre e le altre accese; dal villaggio le accese delle zone |
| `pietreDiOggi(lista)`, `CHIAVI_DELLE_PIETRE` | le pietre salvate nelle chiavi di oggi |
| `nebbiaInBase64(n)`, `nebbiaDaBase64(s, W, H)` | la nebbia: 504×300 celle sono 25 200 caratteri |
| `mondoNuovo(m, tappe)` | la prima volta, e il travaso: `{ nebbia, pietre }` |
| `mondoDaSalvato(m, salvato, tappe)` | il `mondo` salvato rimesso in forma: la firma, il travaso, le pietre vecchie (sotto) |
| `mondoDaSalvare(m, { nebbia, ...resto })` | quello che si scrive: `firma` e la nebbia in base64 accanto al resto |
| `frecceDelCartello(m, 'villaggio')` | una freccia, la strada maestra: `{ verso, nome, zone, regioni, posti, citta: [] }` |
| `VISTA_MONDO`, `PASSO_MONDO`, `ACCANTO_PIETRA`, `CURA_DEL_MERCANTE` | come prima |

**Il salvato e il travaso.** All'apertura `const s = mondoDaSalvato(m, props.mondo, props.tappe)`: `s.nebbia` è già un `Uint8Array`,
`s.pietre` le accese (`altare` è diventata `zona:prati`, `forte` il villaggio), `s.dove` è `null` se si ricomincia dalla piazza, `s.sopra`
è `null` se i mostri vanno rifatti. `s.travasato` dice che la mappa è cambiata (la scena lo può dire una volta: «la terra è cambiata:
le strade che conosci ci sono ancora»), `s.nuovo` che è la prima volta. Il resto (`giro`, `parlato`, `divieti`, `novita`, `quest`) torna
com'era. Salvando: `emit('mondo', mondoDaSalvare(m, { nebbia, dove, giro, pietre, parlato, divieti, novita, quest, sopra }))`.

## Vecchio → nuovo, per `Mondo3d.vue` e la scena

| prima | adesso |
|---|---|
| `ilMondo()` (anelli, 160×140, tutto caricato) | `ilMondo()` percorso, 504×300, tre zone caricate; il vecchio è `ilMondoAdAnelli()` di `mondo-sopra-anelli.js` |
| — | `seguiLEroe(m, x, y)` a ogni cella nuova; poi `terraDelMondo(m)` di nuovo e i pezzi delle zone `caricate`/`scaricate` |
| `aperturaDi(tappe)`, `ap.aperto(q)`, `chiusoPerche(q, ap)` | via: niente si chiude. Restano come finti (tutto aperto, nessun perché) finché la vista li chiama |
| `terraDelMondo(m, ap.aperto)` | `terraDelMondo(m)` (il secondo parametro si ignora) |
| `m.passaggi`, `q.conGrata`, `[data-grata]`, il fumetto `grata` | via; i ponti e i valichi sono `m.confini` (`tipo`, `modello`, `celle`, `rive`, `quota`, `arco`) |
| `m.citta` di tre, `forte`, `rifugio` | `m.citta = [m.villaggio]`; `cittaDi(m, 'forte')` è il villaggio |
| `portaleDella(m, tappa, terra)` | `portaleDella(m)`: il gemello del villaggio |
| `minatoreDi(m, finite)` | `minatoreDi(m)`: nel villaggio sempre |
| il capitano nel forte (`forte.persone`) | `capitanoDi(m)`, in `m.villaggio.persone` |
| `fontaneDi(m, terra)` col forte | `[]` oggi (il villaggio ha la guaritrice e l'incantatrice) |
| undici pietre: città e una davanti a ogni ingresso | otto: `villaggio` e `zona:<chiave>`, con `zona` e `dif` |
| `meteDelViaggio`: le altre accese | in più il villaggio da ogni pietra accesa |
| `nebbiaDaBase64(s.nebbia)`, `mondoNuovo(m, terra, tappe)` | `mondoDaSalvato(m, s, tappe)`; `mondoNuovo(m, tappe)` (la firma vecchia vale) |
| il salvataggio `{ nebbia, dove, … }` | `mondoDaSalvare(m, {...})`: c'è `firma` |
| `frecceDelCartello`: una freccia per passaggio, tre cartelli | una, la strada maestra, nel villaggio |
| `dungeonDi(k).regione` (dalla scheda) | `ingressoDi(m, k).regione` (dal mondo); `dungeonDi(k).zona` dalla scheda |
| `DUNGEON`, `CITTA` di `dati/mondo-aperto.js` | `INGRESSI_DEL_MONDO` (14), `VILLAGGIO`, `ZONE_DEL_MONDO` |
| `m.regioni[r].anello`, `R.marca` | `R.zona` (indice), `R.zonaChiave`; la fascia è della zona: `m.zone[k].fascia`, `livelloDi(m, x, y)` |
| `m.antri` | `[]`: non ci sono più |

## `motore/aperta.js`: i mostri

| funzione | cosa cambia |
|---|---|
| `popolaMondo({ mondo, eroe, giro })` | popola **le zone caricate**; le altre quando si caricano |
| `allineaZone(stato)` | nuovo: popola le zone caricate, dimentica le scaricate; `{ nate, dimenticate }` |
| `muoviMostri`, `cammina`, `incontro` | uguali, e chiamano `allineaZone` |
| `mostriVicini(stato, x, y, r)` | uguale (solo le zone caricate) |
| `annuncioDi(m, x, y, forza)` | in città com'era; fuori `{ zona, nome, luogo, nomeLuogo, fascia, colore, segno, sicura, testo }`: il nome e la fascia **della zona** («🟢 Il bosco vecchio · livello 3–5»). Si dice quando cambia `zona` |
| `alSicuro(m, x, y)` | il villaggio, la cintura del generatore (`m.cintura`), i ponti e i varchi, le zone non caricate |
| `cittaDelRisveglio(m)` | il villaggio, accanto alla sua pietra |
| `tanaDi(stato, luogo)` | null se la zona del luogo non è caricata |
| `inSalvo(stato)` / `riprendiMondo` | `v: 2`; i morti **per zona** (`morti: { prati: [[j, torna]] }`): anche quelli delle zone dimenticate. Un `sopra` di prima (`v: 1`) è storto: tornano tutti |
| `tagliaDi`, `taglieDaContare(t, { specie, regione, signore, zona })` | `zona` (la chiave) al posto di `anello` |

**Un mostro** (`stato.mostri[i]`): come prima (`id`, `regione` il luogo, `branco`, `tipo`, `livello`, `casa`, `fx fy`, `sveglio`, `morto`,
`torna`, `ossa`, `scheda`, `caporale`, `signore`) più `zona` (l'indice). **L'indice `i` è `zona × 1000 + j`**, stabile finché la zona è
caricata e uguale ricaricandola: la scena lo usa come prima (`[data-mostro-sopra] data-i`, `tocca(i)`, la foto dello scontro).
**`stato.mostri` ha i buchi** (le zone non caricate): si legge per indice, **per scorrerli si usa `stato.lista`**. Anche `stato.branchi`
è per indice (un oggetto). Un mostro sta nella sua zona (non ne esce inseguendo) e mai a meno di quattro celle da un ponte o da un varco.

## Le taglie

- `regioniServite(m, 'villaggio')`: tutti i luoghi fuori dal villaggio, di tutte le zone (la tana e il centro di ogni luogo stanno
  nello scheletro, senza caricare). `candidati` e `bachecaDi` come prima, con le pietre di zona e i quattordici ingressi (le cacce
  restano dei sette della storia). `ctx.raggiunge` non serve più (niente si chiude): **non va passato con la terra delle zone
  caricate**, che direbbe «non si raggiunge» a tutto quello che è lontano.
- Gli id di prima si rifanno tutti: `t:forte:…` e `t:rifugio:…` si leggono sul villaggio (`cittaDiOggi`) e si consegnano lì.

## Cosa si cancella, e chi

Il mondo ad anelli resta finché la scena lo importa: **lo cancella D** quando `Mondo3d.vue` e `scena3d/mondo/*` sono sul percorso (o B,
se D ha già finito): `motore/mondo-aperto.js`, `motore/mondo-sopra-anelli.js`, la prima metà di `dati/mondo-aperto.js` (`MONDO_APERTO`,
`LARGA_REGIONE`, `FASCE_DEGLI_ANELLI`, `DUNGEON`, `MARCHE`, `REGIONI_DEL_MONDO`, `PASSAGGI`, `regolaDellaRegione`, `haGrata`, `regolaDi`,
`passaggioAperto`, `anelloDi`, `fasciaDi`, `CITTA`; restano `difDi`, `BOTTEGHE`, `PERSONE`, `PERSONE_NUOVE`, `HABITAT`, `LOTTI`),
`strumenti/sotterraneo-pianta-mondo.mjs` e la riga `--mondo` di `sotterraneo-pianta.mjs`, `test/unita/sotterraneo-mondo.test.mjs`; i
finti `aperturaDi` e `chiusoPerche` qui. I test di D che oggi importano `mondo-sopra-anelli.js` (`unita/sotterraneo-mondo-3d`,
`-mondo-props`, `catalogo-3d-sotterraneo`) tornano a `mondo-sopra.js` con la scena.

Nei test: `unita/sotterraneo-mondo-salva` (la nebbia, la prima volta, il travaso di un salvataggio di oggi, una città sola, le pietre,
il cartello, le zone che seguono l'eroe, nessuna grata).
