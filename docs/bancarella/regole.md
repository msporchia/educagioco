# Le regole della bancarella

Come è fatta una giornata, dove sta la difficoltà, chi fa i conti e quanto
rende un cliente. I dati e la tabella della scaletta stanno in testa a
`src/data/bancarella.js`, il gioco in `src/views/BancarellaGame.vue`.

## Giornate, banchi, clienti

- **Una giornata è una campagna, un banco è una tappa**, tre clienti per
  banco (`CLIENTI_PER_TAPPA`). Si arriva al banco, cala il cartello col
  nome e il tempo, e la fila si presenta. La giornata finita apre la dopo.
- **Cinque banchi** (`BANCHI`): 🍎 il fruttivendolo, 🥬 l'orto, 🥖 il forno,
  🧀 il frigo, 🍬 i dolciumi. **Quello che si vende è tutto lì davanti**,
  fino a otto ceste (`MAX_CESTE`, `esposizione`): niente reparti da aprire,
  il tempo si passa a contare i soldi e non a cercare il pane. Il cliente
  chiede solo roba esposta.
- **Le categorie devono essere ovvie**, se no il gioco diventa indovinare:
  il gelato sta al frigo, ciambelle e salatini al forno. Ogni banco ha
  almeno sei prodotti in vendita in ogni giornata (lo verifica il test).
- **Il listino è fisso** (`LISTINO`): il pane costa 1,50 € oggi come
  domani, e il cartellino diventa una cosa da leggere. Ogni banco tiene
  almeno sei cose in euro tondi, perché le prime giornate sommano a mente
  da «2 € + 3 €». I prodotti al centesimo (arance a 0,89 €, budino a
  1,29 €) esistono perché senza, ogni resto era multiplo di cinque e 1c e
  2c non servivano mai.
- **La raccolta**: la lista sta nel fumetto del cliente. Con le copie
  («due angurie») la cesta si tocca due volte, il fumetto segna `×2` e la
  cesta ricorda quanti ne mancano. Prendere la cosa sbagliata costa due
  secondi e un «No, non quello!», non un cuore.
- **La cassa**: quando il cliente ha tutto, il banco **diventa il
  registratore** senza aprire niente — scontrino riga per riga, display
  verde, cassetto con uno scomparto per taglio (`TAGLI`).
- **La fila si vede**: chi aspetta è disegnato (faccia e vestito colorato,
  `FACCE`, `VESTITI`) con la sua barretta di pazienza, che scende a un
  terzo di chi è al banco. Monete e banconote sono disegnate coi colori veri.

## Chi fa i conti

La spina dorsale del gioco (`CONTI`, `chiedeIlTotale`, `chiedeIlResto`):

| `conto` | il totale | il resto | quello che fa il bambino |
|---|---|---|---|
| `niente` | lo somma la cassa | lo calcola la cassa | compone il resto con le monete |
| `totale` | `? ? ?` | lo calcola la cassa | batte il totale sulla tastiera |
| `resto` | lo somma la cassa | `? ? ?` | conta il resto, posa le monete, ✓ |
| `tutto` | `? ? ?` | `? ? ?` | tutti e due (la cassa rotta) |

- **La tastiera della cassa scrive come sta scritto sul cartellino**:
  `4` o `4,30`, non i centesimi. Una tastiera in centesimi avrebbe
  insegnato a scrivere 430 per dire quattro euro e trenta.
- **La cassa non dice mai la cifra giusta.** Un totale sbagliato dice «È
  troppo!»/«È poco…», un resto sbagliato «Sono troppi!»/«Sono pochi…»:
  costa tre secondi di pazienza e si riprova. Se la svelasse, il conto dopo
  non lo farebbe più nessuno.
- **Dove la cassa calcola il resto non si sbaglia per eccesso**: una
  moneta troppo grande viene rifiutata con uno scarto e costa due secondi,
  non un cuore. Dove il resto lo conta il bambino le monete si posano
  tutte, anche quelle di troppo: rifiutarle direbbe già la risposta.
- **Si perde solo per tempo scaduto**: un cliente che se ne va costa un
  cuore. Cambiare banco ne ridà uno, mai più di tre. Bonus ✨ quando il
  resto è dato col minor numero di pezzi.

## La scaletta: una leva per giornata

Sedici giornate, e **ogni giornata cambia una leva sola rispetto a quella
prima**, sempre in salita. Le leve sono sei (`leve`): `conto`, `banchi`,
`articoli`, `copie`, `passo` (1 € · 50c · 10c · 5c · 1c), `paga` (la
banconota più grossa). La tabella sta in testa a `src/data/bancarella.js`,
e `unita/bancarella` la ricontrolla leva per leva. Il campo `nuovo` dice la
cosa che la giornata aggiunge, e il test lo pretende da tutte tranne la
prima.

- **Quando entra un conto nuovo, le altre leve tornano indietro**: la
  fatica si sposta sulla testa, e non fa mai due salti insieme. Alleggerire
  è gratis, appesantire costa una giornata.
- **Il conto entra un pezzo per volta, su numeri che si fanno a mente**:
  prima il totale (somme entro il 10 in euro tondi, poi tre addendi, poi
  entro il 20), poi il resto (il totale è scritto, si paga con 10 €, poi
  20 €, poi 50 €, e solo dopo i prezzi si fanno fini), infine la cassa
  rotta in cima alla scala. Provato: cinque giornate con la cassa che
  faceva tutto e poi la cassa rotta — due conti nuovi insieme, un gradino
  e non una salita.
- **`pezzi` (quante monete chiede il resto) non è una leva**: è la
  conseguenza di passo e banconota, e contarla a parte sarebbe contare due
  volte la stessa cosa. Resta come promessa dove il cliente sceglie come
  pagare.
- **La difficoltà è un numero ricavato, non scelto** (`fatica`: pesa le
  sei leve con `PESO_CONTO`, `PESO_PASSO`, `PESO_PAGA`). I pesi non sono
  opinioni: il conto è la voce più cara (una sottrazione a mente vale più
  di due centesimi in più sul cartellino), i centesimi costano poco alla
  volta e tanto in fondo, la banconota grossa sposta il resto di un
  ordine di grandezza. Due giornate
  vicine non distano più di `SALTO` (6). La `portata` esce riscalando il
  **massimo raggiunto** della fatica fra `PORTATA_DA` 32 (sei anni e mezzo)
  e `PORTATA_A` 72 (nove anni e tre quarti): la fatica scende quando entra
  un conto nuovo, ma un cancello che si riapre rimetterebbe in fila roba
  già passata (`conPortata`). `scuola: 'numeri'` su ogni giornata.
- **Il salvataggio segue la fila**: le giornate hanno id stabili, e
  `migraMercato` in `src/store/profile.js` porta un salvataggio scritto
  sulla fila vecchia dove gli tocca.

## Dove sta l'altra metà della difficoltà

Non nei numeri grandi: in **quante monete vuole il resto**. 4,90 € con
cinque pezzi e 0,40 € con due sono lo stesso conto per il computer e due
mestieri per un bambino di otto anni (`generaCliente`, `comePuoPagare`).

- **`paga` con una voce sola** («paga con 20 €»): il cliente ha quella e
  basta. Serve alle giornate del resto, dove la sottrazione deve partire da
  un numero conosciuto; il `tetto` della giornata garantisce che basti.
- **`paga` con più voci**: fra i modi possibili il cliente sceglie quello
  che lascia un resto da tanti pezzi quanti ne vuole la giornata (`pezzi`).
- **Il ripiego**: la banconota che ha in tasca o una cifra tonda poco sopra
  la spesa, comunque mai più di tre pezzi in mano. Un cliente senza soldi
  bloccherebbe la fila.
- **La spesa si tira a sorte e si riprova** sotto il `tetto`, invece di
  scegliere i prodotti uno per uno guardando quanto resta: quella strada
  finirebbe per prendere sempre i più economici. Mai più di tre uguali.
- Ogni resto è **garantito componibile** con le monete della giornata, e
  il minimo dichiarato è davvero il minimo (lo prova il test).

## Il tempo

- `tempo: [primo, ultimo]` sono i secondi di pazienza per una spesa da tre
  pezzi: si stringe dentro la giornata e da una giornata all'altra, e
  **torna largo quando entra un conto nuovo** (`tappaDi`).
- **Chi compra di più aspetta di più**: +8 secondi per ogni pezzo oltre i
  tre.
- **La giornata libera** (`LIBERA`) si apre a campagna finita e non chiude
  mai: cinque banchi, prezzi al centesimo, cassa rotta (tornare a farsi
  dire il resto sarebbe un passo indietro), il tempo che scende di due
  secondi a tappa fino a 45 e poi si ferma — una sfida, non una condanna.
- **Fermarsi**: il ⏸, il telefono posato e il foglio del `?` fermano la
  pazienza, e non si riparte da soli. Il cartello del cambio banco si
  ferma anche lui (senza, si tornava con la fila già al banco); il
  cartello di un traguardo no, perché passa da sé e la pazienza è già
  ferma. (`usaPausa`, vedi [../core/interfaccia.md](../core/interfaccia.md))

## Lasciare a metà

La regola comune è [../core/ripresa.md](../core/ripresa.md): la giornata
lasciata a metà si ritrova al rientro com'era. Il formato sta in
`src/motore/bancarella/sosta.js`, sotto `profile.campagne.bancarella.sosta`
(l'avanzamento delle giornate resta in `profile.mercato`).

- **Si scrive**: la giornata (per `id`, `libera` compresa), il banco a cui
  si è, cuori, serviti, perfetti, incasso, le ceste **nello stesso
  ordine**, la fila con la spesa, la banconota e la pazienza di ognuno, e
  il cliente al banco com'è: la roba già data, le monete posate, la cifra
  battuta a metà, il totale già indovinato, gli sbagli. Prezzi, resto,
  monete del cassetto e tempi si rifanno dal listino e dalla giornata.
- **Si perde** poco: la battuta nel fumetto, e il pezzo di cartello del
  banco già passato (ripreso lì, il cartello riparte da capo).
- **Uscire non è una mossa**: la fila non si rimescola, la pazienza non
  torna piena, i cuori e gli sbagli restano quelli, e il cliente a metà non
  cambia spesa né banconota. Il cliente appena servito (i 900 ms
  del «grazie») si chiude prima di scrivere: ha già pagato, e ripreso non
  ripagherebbe.
- **Quando**: col ←, a pagina nascosta, prima di smontare, e a ogni cliente
  che lascia il posto. La giornata ripresa nasce dietro il velo della pausa.
- **Un salvataggio che non torna** (giornata sparita, merce tolta dal
  listino, più roba data di quella chiesta) si butta e la mappa resta
  com'è. Una giornata vinta o persa la toglie, cominciarne un'altra chiede
  prima.

Nei test: `unita/bancarella-sosta`, `integrazione/bancarella-sosta`; i
bersagli della carta sono quelli comuni di [../core/ripresa.md](../core/ripresa.md).

## Quanto rende, e cosa si segna

- **Un cliente vale da 🪙2 a 🪙4** secondo il lavoro (`MONETE_CLIENTE`:
  `niente` 2 · `totale` 3 · `resto` 3 · `tutto` 4, cioè ~20-40 secondi di
  esercizio), **pagate nel momento in cui è servito** — prima arrivavano a
  gruppi di tre clienti, e gli ultimi due di una giornata finita a metà non
  pagavano. Una giornata va da 🪙18 a 🪙48, e a fine giornata il cartello
  dice il totale (`[data-monete-prese]`) e il salvadanaio stanco
  (`[data-nota-monete]`). Un cliente che se ne va non paga niente. Provato: il premio legato al livello del bambino — la stessa
  giornata pagava il doppio a chi giocava da più tempo. (Vedi
  [../apprendimento/calibrazione.md](../apprendimento/calibrazione.md).)
- **Nel motore di apprendimento l'elemento è il pezzo più piccolo che
  serve** per comporre il resto, non la cifra (2,40 € oggi e domani non
  sono due cose da sapere): cinque fasce, da `bancarella:euro` a
  `bancarella:centesimi` (`FASCE`, `chiaveResto`). Si scoprono da sole:
  nelle prime giornate i centesimi non compaiono.

Nei test: `unita/bancarella`, `integrazione/bancarella`; `[data-camp]`
(le giornate, `libera` compresa), `[data-banco]`, `.cesta[data-em]`,
`[data-tasto]` (la tastiera del totale, `fatto` è ✓), `.scomparto[data-v]`.
