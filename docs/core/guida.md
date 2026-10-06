# La guida del primo giro

Una riga col 👇 e un anello che respira sull'unica cosa da toccare adesso.
Non è un tutorial: niente da chiudere, niente da saltare, niente che aspetti
un gesto per andare avanti. Al primo schermo la domanda vera non è «cosa gli
dico», è «dove metto il dito».

## Il pezzo comune e quello del gioco

- **Comune** (`src/giochi/guida.js`, `src/giochi/Guida.vue`, l'anello in
  `src/style.css`): `usaGuida(radice, passo)` accende con `data-indicato`
  quello che il passo indica, e lo riaccende se il pezzo compare dopo (un
  foglio che si apre). `<Guida :passo>` è la riga.
- **Del gioco**: una funzione pura che dallo stato dice il passo,
  `{ testo, dove, mano? }`, dove `dove` è un selettore (di solito il
  bersaglio dei test) o `null` quando non c'è niente da accendere (una
  piazzola disegnata sul canvas). E il gioco decide dove mettere la riga e
  quando la guida si spegne.

```js
const radice = ref(null)
const passoGuida = computed(() => primaVolta ? guidaDelMioGioco(stato) : null)
usaGuida(radice, passoGuida)
```
```html
<div ref="radice" class="schermo"> … <Guida :passo="passoGuida" /> …
```

## Le regole

- **Si legge lo schermo, non un copione**: il passo si calcola da quello che
  c'è (fila vuota, foglio aperto, ultimo ▶ provato o no, cosa è andato
  storto), così regge chi fa le cose in un altro ordine o sbaglia. Una
  sequenza di passi numerati si perde al primo gesto fuori posto.
- **L'anello respira, non lampeggia**, ed è un `outline`: l'ombra del tasto
  resta sua. Un tasto tratteggiato indicato può diventare pieno con una
  regola del gioco (`.cst-piu[data-indicato]`).
- **`mano: true` aggiunge la manina 👆** sopra il tasto, per chi non legge
  (Passo passo): lì la riga non si mostra, conta il dito.
- **Si spegne da sé**: alla prima vittoria del livello (costruttore, Passo
  passo), al primo ▶ (Generale), a battaglia partita (castello, memoria in
  `settings.guideViste`). Il banco salta le spiegazioni del castello
  (`saltaLeSpiegazioni`).

## Chi la usa

| Gioco | Funzione | Quando |
|---|---|---|
| Il costruttore | `costruttore/motore/guida.js` | il primo muretto, finché non è vinto (`guida: true`): comincia sulla scheda, dal led 1 |
| Passo passo | `passo-passo/motore/guida.js` | il primo prato, e 🔁 alla prima tappa dello zaino |
| Il Generale | `passoGuida` in `views/GeneraleGame.vue` | il primo livello della vita, fino al primo ▶ |
| Difendi il Castello | `passoGuida` in `views/TowerDefense.vue` | la prima partita della vita |

Nei test: `[data-indicato]` (`="mano"` con la manina), `[data-guida-riga]`.
