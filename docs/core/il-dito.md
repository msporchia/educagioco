# Il dito

Un tocco non è un click: quattro regole che col mouse non si vedono mai, e
come si provano.

- **Il dito si lascia dietro un click, e va ingoiato.** Dopo il `pointerup`
  di un canvas arriva un `click` mandato a chi sta sotto il dito *in quel
  momento*: il velo appena aperto, che si chiude da sé (`@click.self`), o
  un tasto del foglio, che si preme da solo. Col mouse il bersaglio si
  decide alla pressione. Rimedio: `zittisciIlFantasma` in
  `src/giochi/fattoria/Gioco.vue`. Prova: un tocco vero,
  `Input.dispatchTouchEvent` via CDP come in `integrazione/fattoria` — un
  `page.click()` non porta nessun fantasma.
- **La soglia si misura sul dito, ~16 px** (`SCARTO_DITO`, contro
  `SCARTO_MOUSE`, in `src/giochi/fattoria/scena/dito.js`). Sotto quella
  misura Android e iOS considerano il dito fermo: un gioco più severo butta
  via i tocchi di chi preme forte, cioè dei bambini.
- **Un elenco che scorre non agisce alla pressione.** Una voce presa al
  `pointerdown` si porta via la strisciata (nel baule della fattoria,
  comprando), e gli spazi fra le carte non servono: il telefono sposta il
  tocco sull'elemento più vicino. Decide il movimento
  (`src/giochi/fattoria/viste/Roba.vue`): fermo è un tocco, su e giù è del
  browser (`touch-action: pan-y`; `pointercancel` = non è successo niente),
  di lato si trascina. Lo vede solo un test che scorre col dito
  (`integrazione/campi`): `scrollIntoViewIfNeeded` scorre da programma e
  non incontra il guasto.
- **Il dito non seleziona**, e la regola sta in un posto solo
  (`src/style.css`): niente evidenziazione blu né callout «Copia» su
  iPhone.
  - Servono tutte e tre: `-webkit-user-select` (Safari ha imparato
    `user-select` solo dalla 17), `user-select`, e `-webkit-touch-callout`,
    che non è un doppione — il menù del tener-premuto esce anche sui link e
    sulle tele.
  - Stanno su `html,body,#app`, **non su `*`**: si ereditano, e con `*` le
    eccezioni non arriverebbero ai paragrafi.
  - Dove si copia a dito: `class="copiabile"` (`input`, `textarea`,
    `[contenteditable]` ci sono già). Mai appendere l'eccezione a una classe
    esistente: `.avviso` se la riprenderebbe qualunque riquadro
    con quel nome, a partita in corso.
  - `touch-action: manipulation` su `#app` toglie solo lo zoom del doppio
    tocco; chi trascina da sé dichiara `touch-action: none`, più stretto.

Il gemello — una schermata appena comparsa non si tocca subito — sta in
[interfaccia.md](interfaccia.md).
