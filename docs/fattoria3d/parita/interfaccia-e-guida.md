# Parità: interfaccia, guida, genitori

Legenda in [README.md](README.md). 2D: [../../fattoria/come-si-tocca.md](../../fattoria/come-si-tocca.md), [baule.md](../../fattoria/baule.md),
[pagina-albero.md](../../fattoria/pagina-albero.md), [regole.md](../../fattoria/regole.md) «Come si dice di no». Comuni:
[../../core/guida.md](../../core/guida.md), [../../core/il-dito.md](../../core/il-dito.md), [../../core/ripresa.md](../../core/ripresa.md).

## Guida e aiuto (S6)

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| I1 | il `?` della barra | `guida="fattoria"` in `src/guide/contenuti.js` (tocchi, terra, animali, livelli, catena) | ❌ `<Barra>` senza `guida` | **P0** |
| I2 | il primo giro | guida del primo giro ([../../core/guida.md](../../core/guida.md)) | ❌ un bambino vede il prato e le azioni, e basta | **P0** |
| I3 | «🌳 Come si fa» (l'albero delle ricette: `alberoDi`, `dati/albero.js`) | si apre da silo, mercato, fogli | ❌ | P1 |
| I4 | il consiglio: ogni «non si può» porta con sé il passo e il tasto per farlo (`motore/consiglio.js`, risale la catena) | sì, 4 forme di azione | 🟡 `dettoDi` dice cosa serve e dove si fa, senza tasto che porti lì | **P0** |
| I5 | «a cosa serve una roba» | silo + `dati/usi.js` | ✅ inventario, una frase | – |
| I6 | inviti, non rimproveri (🧺 sui campi pronti, 💭 sulle bestie) | sì | ✅ cartelli «N pronti!» e fame, badge sulle macchine | – |
| I7 | aiuti a monete 💡 | non ce l'ha (è dei quiz) | non ce l'ha | n/a |

## Gesti e fogli

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| I8 | gesto base | tocca la cosa → gettoni sul prato; tieni premuto sposta; tieni premuto sul prato apre il baule | 🟡 tocca → il contadino cammina e lo fa; tieni premuto apre «Costruisci qui» | – |
| I9 | semina/raccolta a strisciata | seme e cesto trascinati su più campi | ✅ armare e passare sui campi | – |
| I10 | il baule in tre metà e lo scaffale che scorre | sì | 🟡 «Costruisci qui» a 5 schede con anteprime 3D | – |
| I11 | il magazzino (pezzi messi via) | baule | ✅ `magazzino`, gratis rimetterli | – |
| I12 | soglie del dito (16 px, click fantasma, 420 ms) | `scena/dito.js` | ✅ in `scena3d/dito.js`; **non provato su un telefono** | P1 |
| I13 | fogli con la ✕ in alto a destra | sì | ✅ | – |
| I14 | home: carta, riassunto, traguardi dell'albo | `gioco.js` | ✅ riassunto e 9 traguardi (la 2D ne ha 7) | – |
| I15 | ripresa / sosta | il mondo si salva da sé ([../../core/ripresa.md](../../core/ripresa.md)) | ✅ lo stesso (`posto: true`) | – |
| I16 | **pausa** | assente di proposito | assente | n/a |

## I grandi (S8)

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| I17 | «Ricomincia la fattoria di …» (`GenitoriView`, `cestinaOra('fattoria')`, `azzeraCampagna`) | sì, con cestino | ✅ azzera anche `fattoria3d` (stato e vicini), con la stessa copia nel cestino; la carta compare se uno dei due giochi è stato aperto | – |
| I18 | interruttore dei giochi in prova | – | ✅ la 3D è `sperimentale` e sta dietro l'interruttore | uscire dalla prova (G10) |
| I19 | il quadro dei genitori / «Come va» | conta la fattoria come gioco senza campagna | da verificare per la 3D (`posto: true`) | P1 |
| I20 | le novità per i bambini | righe 6, 7, 8, 24, 29 | ❌ «un gioco in prova non la vuole»: al giorno del cambio serve una riga, proposta, mai scritta prima | P1 |
| I21 | la guida in app per i grandi | – | – | – |

## Cheat di indirizzo

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| I22 | alzare il livello (`#fattoria=40`) | sì | ✅ `#fattoria3d=N` (alza, non abbassa mai; `Gioco.vue`, `cheatDellIndirizzo`) | – |
| I23 | una fattoria già giocata di quel livello (`#fattoria-tipo=30`, `motore/tipo.js`) | sì: la fattoria sta in piedi a ogni livello (test) | ✅ `#fattoria3d-tipo=N` (1–99, `motore/tipo.js`, test `unita/fattoria3d-tipo`); butta quella del bambino attivo nel cestino | – |
| I24 | `#stagione=` | sì | ❌ | P1 |
| I25 | `#fattoria3d&tela=niente` | – | ✅ prova il messaggio senza WebGL | – |

Il cheat 3D va nella pagina `#admin` accanto agli altri e in [../../core/comandi.md](../../core/comandi.md).

## Suoni

| id | cosa | 2D | 3D |
|---|---|---|---|
| I26 | suoni | nessuno | nessuno: parità. Col suono spento il gioco resta intero ([la regola](../../../CLAUDE.md)). Tenerlo così, P2 |

## Accessibilità ed età (4–12)

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| I27 | figure al posto delle frasi | faccia disegnata per ogni merce (atlante) | ✅ `Faccia.vue` con l'atlante 2D; i testi restano emoji | – |
| I28 | `portata` e età: i giochi senza campagna non si giudicano | `posto: true` | ✅ | – |
| I29 | testi da leggere a 4–6 anni | pochi, figure grandi | 🟡 il banco ha dettagli in testo; da verificare con un bambino piccolo | P1 |
| I30 | 44 px minimi di tocco | `MINIMO_TOCCO` | da verificare su 360 px (bacheca, macchina, mongolfiera mai guardate) | P1 |
