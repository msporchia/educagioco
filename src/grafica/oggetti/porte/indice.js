/* ═══════════════════════════════════════════════════════════════════
   LE PORTE — cinque stili, un pittore solo

   «Tutti i portoni hanno sempre la stessa immagine»: era vero, e non
   è un problema di disegno — è un problema di **dati**. Un varco non
   è sempre la stessa cosa: una porta di legno con le borchie, un
   cancello di ferro da cui si vede attraverso, una saracinesca che
   cala dall'alto, un arco con la tenda che si scosta, una lastra di
   pietra che scorre nel muro e si apre solo con un meccanismo. Sono
   cinque promesse diverse fatte a chi gioca, e devono avere cinque
   facce diverse.

   Il livello dice quale:
       { che: 'porta', x, y, stile: 'ferro', apertura: 1 }

   e il pittore riceve **fatti già decisi**, come sempre: qui dentro
   non si sceglie niente a caso, e chi non dichiara lo stile riceve il
   portone di legno di prima.

   Lo stato è un numero solo, `apertura` da 0 a 1, uguale per tutti
   gli stili: ognuno lo interpreta a modo suo (il battente gira, la
   grata sale, il telo si raccoglie, la lastra rientra nel muro). Così
   il gioco può animare un varco senza sapere che varco è, e cambiare
   stile a un livello non tocca una riga di logica.

   Aggiungere uno stile è un file qui dentro più una riga in `PORTE`.
   ═══════════════════════════════════════════════════════════════════ */
import { portone } from './legno.js'
import { cancello } from './ferro.js'
import { saracinesca } from './saracinesca.js'
import { arco } from './arco.js'
import { pietraPorta } from './pietra.js'

export { portone, cancello, saracinesca, arco, pietraPorta }

export const PORTE = {
  // il legno è binario: un battente o è chiuso o è spalancato
  legno: (p, cosa, S, a) => portone(p, { ...cosa, aperto: a > 0.5 }, S),
  ferro: (p, cosa, S, a) => cancello(p, { ...cosa, apertura: a }, S),
  saracinesca: (p, cosa, S, a) => saracinesca(p, { ...cosa, alzata: a }, S),
  arco: (p, cosa, S, a) => arco(p, { ...cosa, apertura: a }, S),
  pietra: (p, cosa, S, a) => pietraPorta(p, { ...cosa, apertura: a }, S),
}

export const STILI_PORTA = Object.keys(PORTE)

/* il pittore unico: legge lo stile, normalizza lo stato e passa la
   mano. `aperta` (vero/falso) resta accettato perché è il modo in cui
   il gioco parlava prima. */
export function porta(p, cosa, S = p.S) {
  const disegna = PORTE[cosa.stile] || PORTE.legno
  const a = cosa.apertura ?? (cosa.aperta || cosa.aperto ? 1 : 0)
  disegna(p, cosa, S, Math.max(0, Math.min(1, a)))
}
