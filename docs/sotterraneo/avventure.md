# Le quattro avventure

Ogni eroe del sotterraneo ha la sua avventura, come i personaggi di Diablo:
cavaliere, elfa, mago e nano hanno ognuno la sua roba, le sue discese, la sua
nebbia e la sua discesa a metà. Scegliere chi scende è scegliere quale storia
riprendere. Il codice: `motore/avventure.js` (le funzioni pure sul record della
campagna), `Gioco.vue` (chi legge e scrive), `viste/Eroi.vue` (la scelta).

## La regola, e perché

- **Un'avventura per eroe**, decisa il 7 ottobre 2026. Da quando la roba resta
  ([la-roba-che-resta.md](la-roba-che-resta.md)) il sotterraneo non è più una
  discesa per volta ma una storia lunga, e con una roba sola cambiare eroe
  voleva dire o non cambiarlo mai, o portarsi la spada del cavaliere in tasca
  al mago. Vietare il cambio toglieva la voglia di provarli tutti; quattro
  storie la lasciano.
- **Un eroe nuovo comincia dalla scalinata**, a casa, con lo zaino vuoto, la
  nebbia nuova e il minatore che non ha ancora parlato. L'età apre lo stesso le
  discese già passate per lei (`aperta(…, fatte)` con le discese
  dell'avventura): il lucchetto guarda l'avventura, la portata il bambino.
- **Dalla terra di sopra si torna alla scelta** col «cambio» della carta di chi
  scende (`[data-azione="eroe"]`), senza perdere niente: la terra rinasce con
  la nebbia e il posto dell'eroe scelto (`:key` sull'eroe in `Gioco.vue`).
- **La scheda dice a che punto è**: discese finite e stelle, la roba principale
  addosso (arma e armatura), le gemme, il record dell'abisso, la discesa a
  metà; una mai cominciata dice «nuova avventura» (`cominciata`: una discesa
  vinta o a metà, della roba, un record).
- **La scheda dice i numeri veri e mostra la roba in mano**: vita, braccio e
  difesa sono quelli che la discesa userà con la roba addosso
  (`schedaConLaRoba` in `motore/corredo.js`, lo stesso `Corredo` della Corsa),
  con i tratti che contano (`💎 ×1,5`, `🔥 vedi più lontano`); un'avventura
  nuova ha lo zaino vuoto e quindi quelli di base. Il ritratto (`viste/Armato.vue`,
  alla scala della figura) impugna l'arma e imbraccia lo scudo; l'armatura e il
  gioiello restano due iconcine accanto. Vale anche per la carta di chi
  scende in fondo alla terra di sopra. Le barre della scelta si misurano sul
  più forte di loro, con la sua roba, e non sbordano.

## Dove sta, nel salvataggio

Tutto in `profile.campagne.sotterraneo`, nessun campo nuovo nel profilo:

```js
{
  tappa, libera, stelle,          // il massimo fra le avventure: lo legge il resto dell'app
  cfg: {
    eroe: 'mago',                 // l'avventura aperta adesso
    avventure: {
      cavaliere: { tappa, libera, stelle,   // le sue discese
                   roba,                    // gemme, addosso, tasche, torce (motore/corredo.js)
                   terra,                   // { nebbia, dove, parlato }
                   botteghe,                // i banchi pescati in questo giro
                   sosta,                   // la discesa lasciata a metà (motore/sosta.js)
                   abisso,                  // { fondo }
                   missioni },              // il posto per quelle dei personaggi, che verranno
      mago: { … },
    },
  },
}
```

- **La sosta è una per avventura**, non una per gioco come negli altri
  ([../core/ripresa.md](../core/ripresa.md)): ogni eroe ritrova la sua.
- **Ci scrive solo `Gioco.vue`**, con `nellAvventura` → `ritocca()` di
  `giochi/campagne.js`; un campo a `null` si toglie.
- **I mercanti pescano per avventura**: le righe sul banco dipendono dalle
  discese finite di quell'eroe, e i banchi già pescati stanno nella sua
  avventura.

## Cosa è in comune

- **Le monete**: sono dell'app. A risposta giusta 🪙1, con qualunque eroe.
- **Medaglie, esperienza, riga della home, primati contano il massimo.** Il
  record di fuori (`tappa`, `stelle`, `libera`) lo scrive `completa()`, che
  tiene sempre il più alto: a discesa vinta `Gioco.vue` scrive prima
  l'avventura (`vintaNellAvventura`) e poi `completa()`. Così fuori c'è il
  cursore più avanti e, discesa per discesa, le stelle migliori di chiunque
  (`ilMassimo` lo ricalcola dalle avventure, e il test lo confronta). Rifare la
  scalinata con un altro eroe non ridà l'esperienza della tappa e non abbassa
  niente; vincerla meglio alza le stelle di quella discesa, come rigiocarla
  con lo stesso eroe.
- **La riga della home** (`riassunto` in `gioco.js`) dice il fondo più giù fra
  tutte le avventure; il primato `sotFondo` e i contatori (`sotPiani`,
  `sotMostri`…) sono del bambino e salgono con chiunque scenda.
- **«Riprendi da qui»** in home apre l'avventura aperta per ultima
  (`cfg.eroe`) e, se ha una discesa a metà, la riprende (`riprendiSeChiesta`).
  La discesa a metà di un altro eroe la si ritrova scegliendolo.

## Il passaggio dei profili di prima

`passaAlleAvventure` gira all'apertura del gioco, una volta (dopo c'è
`cfg.avventure` e non fa niente):

- **tutto va all'eroe usato per ultimo** (`cfg.eroe`, o il cavaliere se non
  c'era): discese e stelle, roba, nebbia, banchi, sosta, record dell'abisso.
  Gli altri tre partono da capo;
- **le gemme di bentornato le prende solo lui** (`robaDiCasa`, per chi non
  aveva ancora `cfg.roba`): ha le discese finite e lo zaino vuoto;
- **la discesa a metà cominciata da un altro eroe** la riprende l'eroe
  dell'avventura (`sosta.eroe` riscritto; nella versione 2, dove `eroe` era
  la cella, ci pensa il ripiego di `leggi`);
- **il record di fuori non si tocca**: era già il suo, quindi il massimo.
  Nessun bambino perde stelle, medaglie, esperienza o monete;
- `cfg.roba`, `cfg.terra`, `cfg.abisso`, `cfg.botteghe` e la sosta di fuori si
  tolgono: due posti per la stessa roba divergerebbero. Una build di prima
  aperta dopo il passaggio ritroverebbe lo zaino vuoto (e il bentornato).

Nei test: `unita/sotterraneo-avventure` (le avventure separate, il massimo con
lo store vero, il passaggio da profili finti a inizio, a metà, con la sosta
aperta, con l'abisso, da prima della roba), `integrazione/sotterraneo-avventure`
(col dito: un profilo di prima passa al cavaliere, il mago comincia da capo, si
torna al cavaliere e si ritrova tutto, e «riprendi da qui»). Nella scelta
`.sot-eroe[data-eroe="<eroe>"]` con `data-nuova` (1 se mai cominciata),
`[data-punto]` (a che punto è), `[data-addosso="<cosa>"]` (l'arma in mano, l'armatura
e il gioiello), `[data-in-mano]` / `[data-in-braccio]` sul ritratto, `[data-tratti]`,
`[data-fondo]`,
`[data-a-meta]`; `[data-azione="eroe"]` la apre dalla terra di sopra;
`scegliAvventura` in `test/aiuto/browser.mjs` per chi deve solo scegliere.
