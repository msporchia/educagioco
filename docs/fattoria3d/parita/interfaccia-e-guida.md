# Parità: interfaccia, guida, genitori

Legenda in [README.md](README.md). 2D: il gioco è tolto, le sue regole del «no» stanno in [../regole.md](../regole.md) «Come si dice di no». Comuni:
[../../core/guida.md](../../core/guida.md), [../../core/il-dito.md](../../core/il-dito.md), [../../core/ripresa.md](../../core/ripresa.md).

## Guida e aiuto (S6)

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| I1 | il `?` della barra | `guida="fattoria"` in `src/guide/contenuti.js` (tocchi, terra, animali, livelli, catena) | ✅ `guida="fattoria3d"` ([../guida.md](../guida.md)); da leggere con un bambino | – |
| I2 | il primo giro | guida del primo giro ([../../core/guida.md](../../core/guida.md)) | ✅ `motore/guida.js`: 🌱 → grano → aspetta → ✂️ → 🏗, con la manina; non provato con un bambino piccolo ([../guida.md](../guida.md)) | – |
| I3 | «🌳 Come si fa» (l'albero delle ricette: `alberoDi`, `dati/albero.js`) | si apre da silo, mercato, fogli | ✅ `dati/albero.js` (`alberoDi`, strada sola per riga, scorta spartita, il mangime delle bestie come ramo) e `viste/Albero.vue`; si apre dall'inventario (🌳 sotto la merce scelta) e dal passo sotto un «non si può» di macchina, banco e mongolfiera, sulla merce che manca ([../guida.md](../guida.md)). Non c'è «tutto l'albero»; manca la riga «o nel pollaio» delle strade alternative | – |
| I4 | il consiglio: ogni «non si può» porta con sé il passo e il tasto per farlo (`motore/consiglio.js`, risale la catena) | sì, 4 forme di azione | ✅ `motore/consiglio.js` (`comeAvere` risale la catena, `cosaFaccioAdesso`): 🧭 «E adesso?» e il passo col tasto sotto i «mancano» di macchina, banco e mongolfiera; gli altri «no» dicono ancora solo il perché | – |
| I5 | «a cosa serve una roba» | silo + `dati/usi.js` | ✅ inventario, una frase (`dati/usi.js`: ricette, bestie, banco, mongolfiera) | – |
| I6 | inviti, non rimproveri (🧺 sui campi pronti, 💭 sulle bestie) | sì | ✅ cartelli «N pronti!» e fame, badge sulle macchine | – |
| I7 | aiuti a monete 💡 | non ce l'ha (è dei quiz) | non ce l'ha | n/a |

## Gesti e fogli

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| I8 | gesto base | tocca la cosa → gettoni sul prato; tieni premuto sposta; tieni premuto sul prato apre il baule | 🟡 tocca → il contadino cammina e lo fa; tieni premuto apre «Costruisci qui» | – |
| I9 | semina/raccolta a strisciata | seme e cesto trascinati su più campi | ✅ armare e passare sui campi | – |
| I10 | il baule in tre metà e lo scaffale che scorre | sì | 🟡 «Costruisci qui» a 5 schede con anteprime 3D | – |
| I11 | il magazzino (pezzi messi via) | baule | ✅ `magazzino`, gratis rimetterli | – |
| I12 | soglie del dito (16 px, click fantasma, 420 ms) | `scena/dito.js` (le soglie ora in `viste/dito-soglie.js`) | ✅ in `scena3d/dito.js`; **non provato su un telefono** | P1 |
| I13 | fogli con la ✕ in alto a destra | sì | ✅ | – |
| I14 | home: carta, riassunto, traguardi dell'albo | `gioco.js` | ✅ riassunto e 10 traguardi (la 2D ne ha 7): stesse soglie dove il gesto è lo stesso (terre, posati/pezzi, varietà `[8,20,32]` come primato, ordini), soglie sue dove il conto è diverso (raccolti a tessere: ×~7). «Sgomberi» = `f3d-alberi`; «Che eleganza» c'è anche in 3D da quando le bestie si vestono (`fattoria3dVestiti`, [../addobbi.md](../addobbi.md)). Contatori `fattoria3d*` con `segna()`/`segnaBest()` in `Gioco.vue`, niente campi nuovi nel profilo | – |
| I15 | ripresa / sosta | il mondo si salva da sé ([../../core/ripresa.md](../../core/ripresa.md)) | ✅ lo stesso (`posto: true`) | – |
| I16 | **pausa** | assente di proposito | assente | n/a |

## I grandi (S8)

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| I17 | «Ricomincia la fattoria di …» (`GenitoriView`, `cestinaOra('fattoria')`, `azzeraCampagna`) | sì, con cestino | ✅ azzera la 3D (stato e vicini) e la 2D salvata insieme, con la copia nel cestino; accanto c'è «Riconverti», che la rifà dalla 2D ([../../genitori/giochi.md](../../genitori/giochi.md)) | – |
| I18 | interruttori dei grandi (in prova, «In casa» a tre posizioni, tempo, domande) | la 2D non era in prova: un `posto` (non si spegne per età) | ✅ **fuori dalla prova dal 31/10/2026** (`sperimentale` tolto dal manifesto, `gioco.js`): compare per tutti come la 2D; in `Giochi › La fattoria` la tendina «In casa», il tempo e «Cosa si impara» (`cosa-insegna.js`) ([../../genitori/interruttori.md](../../genitori/interruttori.md)) | – |
| I19 | il quadro dei genitori / «Come va» | `posto: true`: non si giudica per età, non paga monete (`paga()` in `data/varieta.js`), il tempo è per vista | ✅ verificato: la 3D è `posto: true` e passa dagli stessi filtri generici (sessioni per chiave `fattoria3d`; nessun codice la nomina). Niente di suo da mostrare: livello e cosa ha costruito stanno nella carta di home (`riassunto`) e nell'albo, come per la 2D | – |
| I20 | le novità per i bambini | righe 6, 7, 8, 24, 29 | 🟡 finché era in prova niente righe (D16); al cambio del 31/10 una riga si **propone** a fine lavoro e si scrive solo dopo il sì ([../../genitori/novita-bambini.md](../../genitori/novita-bambini.md)); niente righe per i traguardi, stanno nell'albo | – |
| I21 | la guida in app per i grandi | – | – | – |

## Cheat di indirizzo

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| I22 | alzare il livello (`#fattoria=40`) | sì | ✅ `#fattoria3d=N` (alza, non abbassa mai; `Gioco.vue`, `cheatDellIndirizzo`) | – |
| I23 | una fattoria già giocata di quel livello (`#fattoria-tipo=30`, `motore/tipo.js`) | sì: la fattoria sta in piedi a ogni livello (test) | ✅ `#fattoria3d-tipo=N` (1–99, `motore/tipo.js`, test `unita/fattoria3d-tipo`); `#fattoria-tipo=N` scrive una 2D già giocata (`da2d/motore/tipo.js`) e la fa convertire ([migrazione.md](migrazione.md)). Tutti e due buttano la fattoria del bambino attivo nel cestino | – |
| I24 | `#stagione=` | sì | ✅ `#stagione=natale|halloween` (`dati/stagioni3d.js`, [../stagioni.md](../stagioni.md)) | – |
| I25 | `#fattoria3d&tela=niente` | – | ✅ prova il messaggio senza WebGL | – |

Il cheat 3D va nella pagina `#admin` accanto agli altri e in [../../core/comandi.md](../../core/comandi.md).

## Suoni

| id | cosa | 2D | 3D |
|---|---|---|---|
| I26 | suoni | nessuno | nessuno: parità. Col suono spento il gioco resta intero ([la regola](../../../CLAUDE.md)). Tenerlo così, P2 |

## Accessibilità ed età (4–12)

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| I27 | figure al posto delle frasi | faccia disegnata per ogni merce (atlante) | ✅ `Faccia.vue` con l'atlante (`src/grafica/atlante-fattoria.js`); i testi restano emoji | – |
| I28 | `portata` e età: i giochi senza campagna non si giudicano | `posto: true` | ✅ | – |
| I29 | testi da leggere a 4–6 anni | pochi, figure grandi | 🟡 il banco ha dettagli in testo; da verificare con un bambino piccolo | P1 |
| I30 | 44 px minimi di tocco | `MINIMO_TOCCO` | da verificare su 360 px (bacheca, macchina, mongolfiera mai guardate) | P1 |
