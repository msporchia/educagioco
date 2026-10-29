# La pelle delle schermate di contorno

Home, profilo, albo delle medaglie, impostazioni dei grandi (con tutto
quello che ci sta dentro: manopola dell'età, «Come va», la scheda di un
gioco, nascita, amici), guide, novità, benvenuto, i fogli delle guide e
degli amici: **una pelle sola**, quella scelta per la home («più elegante,
non cartonato», [home.md](home.md#lo-stile)). Erano scritte a cinque mani:
quattordici angoli, sedici ombre, tre tavolozze (cartonata col giallo,
beige, lilla) che cambiavano anche a metà schermata.

I giochi non c'entrano: hanno i loro mondi, i titoli grandi e i tasti
gialli. Anche la barra in cima resta quella di tutti (`Barra.vue`), col ←
blu: è lo stesso tasto in ogni schermata.

## I valori

Stanno in `:root` di `src/style.css`; una schermata di contorno li usa
per nome, mai a numero.

| variabile | cosa |
|---|---|
| `--fondo` | il fondo della schermata, grigio chiarissimo |
| `--superficie` | le carte, bianche |
| `--inchiostro` | titoli e testo forte, e il tasto principale (scuro) |
| `--grigio` | il testo secondario |
| `--filo` | bordi sottili, separatori, campi |
| `--tessera` | le cose dentro una carta: tessere di numeri, interruttori a segmenti, voci scelte |
| `--accento` | l'unico colore che non dice niente di suo: barrette, grafici, «▾» |
| `--ombra` | l'ombra appena accennata di una carta |
| `--raggio` / `--raggio-piccolo` | l'angolo di una carta (14) e quello di campi e tessere (10) |
| `--colonna` | la larghezza della colonna (400): tutto quello che sta in fila è largo uguale |

Pesi 600 per titoli e tasti, 400 per il resto; niente corsivo per le
spiegazioni. I toni caldi o freddi che dicono qualcosa (un avviso, la
posta, una cosa da sistemare, l'oro di una medaglia, le barrette di livello)
restano: sono un segnale, non una pelle.

## `.pulito`

La radice di ogni schermata di contorno ha `class="schermo pulito"`. Su
`.pulito` `style.css` rimette `h2`, `.mini`, `.testo`, `.bottone` (scuro),
`.bottone.chiaro` (bianco col filo) e `.bottone.rosso` (piatto). Non è
globale perché le stesse classi i giochi le usano con la loro pelle.

Un componente nuovo dentro queste schermate prende i valori sopra; se
gli serve un colore nuovo, prima si guarda se è un segnale (allora resta
suo) o una pelle (allora è una variabile che manca, e si aggiunge qui).

- Provato a lasciare a ogni componente i suoi numeri e allinearli a
  mano: non regge, al terzo componente nuovo si torna a cinque mani.
