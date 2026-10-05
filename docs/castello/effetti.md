# Gli effetti dei colpi

Ogni tiro ha il suo disegno, in volo e all'impatto, e ogni ramo il suo:
dal disegno si riconosce chi ha sparato. Tutto è procedurale (nei fogli
degli sprite non c'è un proiettile) e non cambia niente al gioco: i numeri
sono quelli di [torri.md](torri.md) e [resa-delle-torri.md](resa-delle-torri.md).

## Come è fatto

- **Il volo** (`grafica/castello/effetti-volo.js`) lo sceglie la chiave
  `ramo || tipo`: freccia, cecchino (mirino di luce che resta in aria),
  raffica, dardo magico, veleno (gocciola), catena (il fulmine nasce già
  lungo tutto il tratto), le tre bombe (tiro a campana con ombra a terra).
- **L'impatto** (`effetti-impatto.js`) è uno `Schizzo` con `stile`, che sta
  nel motore e vive `DURATE[chiave]` secondi (`motore/castello/schizzo.js`):
  deve morire con la partita. Ha due strati, `suolo` (pozze, bruciature,
  sotto i mostri) e `aria`; la scena lo emette due volte
  (`views/castello/scena.js`). Il gelo è lo stesso meccanismo, partito dalla torre.
- **Il mostro** mostra lampo bianco, veleno (verde, bolle), napalm (fiamme)
  e brina (crepa): `grafica/castello/stati.js`, dai campi `lampo`,
  `malTipo` e `fragile` di `Nemico`.
- **Gli effetti sono piccoli e brevi di proposito** (`PICCOLO`, `AREA`, `GELO` in `colpi.js`; `VEL_EFFETTI` in `schizzo.js`): scala 0,6, raggio dell'effetto al più 26 unità (gelo 24, vicino alla torre; in più un cerchio sottilissimo alla gittata vera) **a prescindere dall'area vera** (magica 42–72, gelo 83–120): per ora conta che sia bello e non faccia confusione con molte torri, la calibrazione viene dopo, la freccia piantata resta un quarto di secondo. La prima versione copriva il campo («il ghiaccio occupa tutta la schermata», «le frecce troppo grandi e troppo a lungo»).
- Ogni effetto è una **funzione pura del tempo**: scintille, fumo e fiamme
  si ricalcolano da un seme (`effetti-base.js`), niente stato in mano a chi
  disegna. Il caso è sul seme, mai su `Math.random`.
- **La velocità di volo** è per ramo (`VOLI` in `motore/castello/colpo.js`):
  le bombe ci mettono 0,36–0,48 s, il cecchino 0,14, il fulmine 0,08. Un
  colpo ad area cade dove stava il bersaglio quando è partito: misurato con
  `npm run test:misure`, il bilancio non si è mosso.

## Provato

- Un unico ramo d'arco per le bombe: la parabola sale in parti della
  distanza (`ALTO`), non in unità, o i tiri corti sembravano lanci in cielo.
- Lampo bianco dell'esplosione grande e detriti scuri nel centro: sembrava
  un occhio. Ora il lampo è un alone breve e il fuoco un grumo di sei bolle.

## Nei test

`unita/rami-castello` e `unita/immunita-castello` coprono i colpi e gli
schizzi; per guardare gli effetti c'è il filmato (si registra con
`strumenti/scatti.mjs`, vedi [../core/strumenti.md](../core/strumenti.md)).
