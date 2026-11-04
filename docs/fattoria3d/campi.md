# I campi col dito

**Decisione dell'utente del 4/11/2026**: «tu premi sul campo e ti dà l'arma e tu la trascini, così anche se vuoi coltivare o falciare uno o più è
sempre pronto». I tasti Libero, Semina e Raccogli non ci sono più, e con loro la coda dei campi e il foglio «Cosa semini?». Codice:
`scena3d/attrezzi.js` (il mondo), `viste/Attrezzi.vue` (i gettoni), `azioni.semina` e `azioni.raccogli`.

## Le regole

- **Un tocco su un campo porta l'attrezzo accanto**: vuoto i semi, pronto il falcetto. Su un campo che cresce il contadino dice quanto manca.
- **Si trascina l'attrezzo sui campi**, uno o tanti. Il campo cambia sotto il dito, senza aspettare il contadino, che non si muove.
- **Ogni campo si fa una volta per passata**; i semi vanno solo sui vuoti, il falcetto solo sui pronti: gli altri si attraversano senza dire niente.
- **Un tocco su un gettone non fa niente**: dice cos'è (nome, tempo). Il gesto è trascinare ([memoria di ottobre sull'interfaccia alla Hay Day](regole.md)).
- **I semi stanno ad arco**, cinque per pagina, solo quelli arrivati al livello; «» sotto l'arco sfogliano. L'arco si riapre sulla pagina dell'ultimo seme usato.
- **Raccogliere costa sempre il gesto (🪙1–2)** e guarda lo scomparto prima di cominciare: un rifiuto lo dice e ferma la passata, l'attrezzo resta lì.
- **L'attrezzo si posa** dopo una passata riuscita, con un tocco altrove, spostando la vista o sollevando un pezzo.
- **Il tasto di «🧭 E adesso?»** manda il contadino al primo campo che ne ha bisogno e lì apre l'attrezzo, col seme del consiglio già in vista.

Un campo si riconosce sotto il dito dalla cella (`cosaSu`), non con un raggio sulle mesh: `passa` gira a ogni `pointermove`.

## Nei test

`integrazione/fattoria3d` e `integrazione/fattoria3d-guida` (il dito vero). Bersagli: `[data-f3="attrezzi"][data-tipo="semi|falce"]`, i gettoni
`[data-seme="<coltura>"]` e `[data-f3="falce"]`, `[data-f3="semi-prima|semi-dopo"]` (le pagine), `[data-f3="attrezzi-riga"]`.
