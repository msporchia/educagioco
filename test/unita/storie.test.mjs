/* ═══════════════════════════════════════════════════════════════════
   LE CINQUE STORIE DEL GENERALE — il controllo che nessuno lanciava

   `src/data/storie-generale.js` si porta dentro `verificaStorie()`: un
   controllo scritto bene, che sa dire un ordine sconosciuto, un attore
   che non esiste, due capitoli di fila con la stessa forma d'obiettivo,
   un concetto che torna indietro nella scala, un `eredita` che punta a
   un filo che nessuno ha lasciato. Solo che **non lo chiamava nessuno**:
   `grep` lo trova citato in due commenti e definito una volta, mai
   invocato. Un controllo che non gira è un controllo che non c'è, e
   infatti teneva nascosto un capitolo col concetto sbagliato
   (`bibi/bombo` diceva `sincronizzazione`, che nella scala non esiste)
   più ventisei code del `par`, tolto dal gioco il 15 agosto 2026 e
   rimasto qui a far dire «par storto» a tutti i capitoli.

   Da qui in poi gira a ogni `npm test`. Le storie sono ancora spente
   (`AVVENTURE_APERTE`), ma i dati sono già scritti: è meglio che a
   marcire non ci vadano nel frattempo.
   ═══════════════════════════════════════════════════════════════════ */
import { nota, controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { STORIE, verificaStorie, senzaMappa, conteggioForme, quantiCapitoli }
  from '../../src/data/storie-generale.js'

/* ═══════════ 1. i dati stanno in piedi ═══════════ */
{
  const guai = verificaStorie()
  controlla('le cinque storie non hanno guai', !guai.length, guai.join(' ⏐ '))
  nota(`storie: ${STORIE.length}, capitoli: ${STORIE.reduce((n, s) => n + quantiCapitoli(s.id), 0)}`)
}

/* ═══════════ 2. la forma d'obiettivo che queste storie non usano ═══════════
   `arrivo` («uno dei tuoi arriva sul forziere») è la forma di quasi tutti
   i livelli che esistono, ed è quella che le cinque storie hanno deciso
   di non usare mai: è tutta la ragione per cui sono state scritte. Se un
   capitolo ci ricasca, questo test è l'unico posto che se ne accorge. */
{
  const n = conteggioForme()
  uguale('nessun capitolo si vince arrivando sul forziere', n.arrivo, 0)
  const mai = Object.entries(n).filter(([f, q]) => !q && f !== 'arrivo').map(([f]) => f)
  nota(mai.length ? `forme dichiarate e mai usate: ${mai.join(', ')}` : 'ogni forma dichiarata è usata almeno una volta')
}

/* ═══════════ 3. le mappe che mancano ═══════════
   Non è un guasto: è il lavoro che resta. Serve a leggerlo come numero
   invece che a memoria. */
nota(`capitoli che aspettano ancora una mappa: ${senzaMappa().length}`)

riassunto('le storie del Generale')
