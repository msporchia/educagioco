# La freccina verso la missione

Una missione presa e non ancora fatta si ricorda da sola, giù e sopra. Le missioni
in sé (l'albero, il diario, i premi) sono in [missioni.md](missioni.md); il mondo di
sopra in [mondo-3d.md](mondo-3d.md). Il codice: `rotta` in `motore/missioni.js`
(pura, gira in Node), `posaLaRotta` in `Gioco.vue`, `viste/Mondo3d.vue` (`fuori`, la
meta e il suo indicatore sul bordo).

Chi gioca poco spesso non si ricorda una missione presa tre giorni fa (l'utente,
8 ottobre): due freccine la ricordano, una giù e una sopra. **È una direzione e
non una strada**: niente percorso disegnato, e una freccina sola per volta.

- **Giù** (`rotta` in `motore/missioni.js`, `posaLaRotta` in `Gioco.vue`): una
  freccina attorno all'eroe, ruotata verso la missione presa e non ancora fatta
  **più vicina** della discesa. Se la cosa è su questo piano punta al forziere
  d'oro o al mostro con la corona (oro, `data-verso="qui"`); se è più in basso
  punta alla **scala che scende** (azzurra, `"scala"`) e la riga in cima dice
  «la collana è al terzo piano: scendi». Una già sfuggita (piano passato), una
  fatta, o una missione di un'altra discesa non c'è; senza missioni, niente. La
  riga che la freccina sta seguendo ha il suo ▸ (`data-segui`).
- **Non guarda la nebbia né la torcia**: indica anche verso il buio, ed è il
  motivo per andarci. Provato nel test: la scala non è stata vista e la
  freccina c'è lo stesso.
- **Non prende i tocchi** (`pointer-events: none`): il campo sotto si tocca come
  sempre. Si nasconde con un foglio aperto o lo zaino, che sono sopra il campo.
- **Sopra** (`viste/Mondo3d.vue`, `fuori`): un indicatore sul bordo della vista, nella direzione della cosa
  quando è fuori schermo. **Azzurro, col ritaglio della discesa**, verso la meta (`[data-meta-fuori]`); **d'oro, un «?»**, verso
  chi aspetta una consegna (`[data-consegna-fuori]`: dice che c'è una consegna, non sceglie la meta). Toccato, l'eroe ci va a piedi
  e si apre il fumetto della discesa. La meta **viene solo dal «segui questa»** (di difetto la storia, la porta da aprire:
  [la-storia-principale.md](la-storia-principale.md)) e non cambia camminando né consegnando altro. Con la cosa in vista non c'è la
  freccina attorno all'eroe: ci sono la carta della meta in cima (nome, passi), la scia di luci per terra e la strada aperta fra le
  nuvole ([mondo-3d-la-meta.md](mondo-3d-la-meta.md)).

## Quale seguire

Con più missioni prese le freccine ne indicano una. Di difetto giù è la più vicina; **nel dettaglio
di una missione presa nel diario il tasto «segui questa»** ne sceglie una (l'utente, 8 ottobre:
*«quale missione indicano le freccine quando ce n'è più d'una»*), e «smetti» ridà la regola di
prima. Anche la missione principale ha il suo «segui questa» (`segui = 'storia'`):
vale sempre, e non decade. La scelta è `avventura.segui` (un id, di quell'eroe) e **vale finché quella
missione è presa**: fatta o consegnata decade da sé (`seguita` in `motore/missioni.js`;
`Gioco.vue` la toglie anche dal salvataggio alla consegna).

- **Giù** (`rotta(c, segui)`): se la scelta è di questa discesa e ancora da fare vince
  sulla più vicina; se è di un'altra discesa non conta e vale la regola di prima.
- **Sopra** vale `metaScelta` (`motore/meta-sopra.js`): la scelta, se no la storia.
- La riga seguita ha il suo ▸ nel promemoria, e nel diario la voce ha il bordo azzurro
  e «la segui» (`li[data-segui]`).

Nei test: `[data-rotta]` con `data-verso` (`qui` o `scala`), `data-missione-rotta` e `data-gradi`;
nel promemoria `li[data-segui]`; sopra la freccia azzurra `[data-meta-fuori="<discesa>"]`
(`.sot-bussola-meta`, col suo `[data-ritaglio]`; l'indicatore d'oro è `[data-consegna-fuori]`).
`unita/sotterraneo-missioni` prova la scelta (stesso piano, scala, la più vicina, nessuna, fatta,
piano passato); `integrazione/sotterraneo-rotta` misura sullo schermo che la punta cada sulla retta dall'eroe
alla cosa (forziere e scala), e sopra che la freccia azzurra porti alla discesa, ceda alla
consegna e sparisca senza missioni. La scelta nel diario (`seguita`, `rotta`
con la scelta, il dettaglio di ogni voce) è in `unita/sotterraneo-missioni`; col dito, la freccia
che cambia obiettivo sopra e giù, e la scelta nell'avventura, in `integrazione/sotterraneo-dettaglio`
(`[data-azione="segui"]`, `[data-segui-attivo]`).
