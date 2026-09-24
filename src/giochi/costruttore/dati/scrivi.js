/* ═══════════════════════════════════════════════════════════════════
   COME SI SCRIVE UN PROGRAMMA DENTRO UN DATO

   Un programma del costruttore è un oggetto semplice — lo scrive il
   bambino toccando, lo salva l'archivio così com'è, lo legge
   l'esecutore — e questo file è il modo di scriverlo **a mano** nei
   livelli: la soluzione ufficiale, le mosse ingenue che devono perdere,
   i progetti che un livello regala già fatti.

     programma({
       lavagnette: ['h'],
       progetti: [progetto('colonna', { nome: 'colonna', icona: '🏛️', misure: ['alta'] }, [
         fai.ripeti('alta', [fai.metti('bianco', 'sotto')]),
       ])],
       principale: [fai.chiama('colonna', 3)],
     })

   ── LA FORMA, UNA VOLTA PER TUTTE ─────────────────────────────────
   Un programma è `{ principale, progetti, lavagnette }`:

     principale   la fila da cui si parte (un elenco di istruzioni)
     progetti     [{ id, nome, icona, misure: ['alta'], corpo: [...] }]
                  — le funzioni; le misure sono i parametri
     lavagnette   ['h', 'conta'] — le variabili che il bambino ha creato

   Un'istruzione ha sempre `tipo` e `id` (l'id serve alla vista per
   accendere la riga che sta girando e per sapere dove inserire):

     vai      { verso: destra|sinistra, quanto: numero }   cammina, e cade
     metti    { dove: sotto|giu-destra|giu-sinistra, colore }
              sotto i piedi (e il robot ci sale sopra), o in basso a
              destra / a sinistra: dove appoggerà il piede
     ripeti   { volte: numero, corpo }
     finche   { cond, corpo }                 «ripeti · smetti quando [cond]»
     se       { cond, allora, altrimenti }    `altrimenti` può essere null
     assegna  { nome, valore: numero }        «[h] diventa [...]»
     chiama   { progetto, argomenti: [numero] }

   Un **numero** è `{ n: 3 }`, `{ v: 'h' }` (una lavagnetta, una misura o
   un numero dell'ordine) o `{ op: '+', a, b }` con `+ - ×`. Un'operazione
   sola per numero: `h + 1` sì, `h + 1 - k` no — a dieci anni un'espressione
   si legge tutta d'un colpo o non si legge. E c'è `{ vuoto: true }`, la
   **N**: il numero ancora da scegliere, con cui nasce ogni riga nuova.
   Non ha un valore di comodo apposta — «ripeti 2 volte» diceva al
   bambino che si ripete due volte, «ripeti N volte» gli chiede quante.

   Un **colore** è una stringa (`'rosso'`) o `{ v: 'tinta' }`: il nome di
   una misura di un progetto che è un colore, o di una lavagnetta
   dell'ordine che ne porta uno («sinistra», nelle bandiere). Una misura
   è un numero se non si dichiara altro; un colore lo dice il progetto,
   in `tipi: { tinta: 'colore' }`.

   Una **condizione** è
     { tipo: 'guarda', dove: sotto|giu-destra|giu-sinistra|destra|sinistra|sopra,
       cosa: mattone|terreno|acqua|vuoto|pieno|bordo, c: true|false,
       colore?: 'rosso' }       — solo con `mattone`: un mattone di quel colore
       — «[sotto i piedi] c'è / non c'è [un mattone rosso]»
     { tipo: 'confronta', a, cmp: '<'|'='|'>', b }
       — «[h] è [più piccolo di] [5]»

   Gli id qui dentro si possono omettere: `numera()` li mette tutti prima
   che il programma arrivi a una vista o all'esecutore.

   ── IL PORTO ───────────────────────────────────────────────────────
   Il porto si vede dall'alto e ha un orologio, e aggiunge poche cose:

     vai      il verso può essere anche su | giu
     prendi   { lato: su|giu|destra|sinistra }   la cosa di fianco, in mano
     posa     { lato }                           quella in mano, di fianco
     aspetta  { cond }                           «aspetta che [cond]»: un
                                                 turno alla volta
     sempre   { corpo }                          «ripeti per sempre»: la
                                                 giornata la chiude il livello

   un valore in più, `{ leggi: lato }` — quello che il robot legge di
   fianco o in mano (`lato` può essere anche `mano`): un colore o un
   numero, a seconda di cosa c'è scritto; e la domanda
     { tipo: 'guarda', dove: su|giu|destra|sinistra|mano,
       cosa: cassa|niente|libero|cliente|biglietto|bancone|scaffale|
             cassone|nastro|muro|mare|bordo, c, colore? }
   dove il colore di una cassa può essere anche un nome (`{ v: 'tinta' }`):
   «smetti quando ↑ c'è una cassa [tinta]» è il cuore di «cerca».
   ═══════════════════════════════════════════════════════════════════ */

import { CHIAVI_COLORI } from './colori.js'

export const VERSI = ['destra', 'sinistra']
/* il porto si vede dall'alto: le frecce sono quattro, e il robot prende
   e posa di fianco a sé, verso una di loro */
export const LATI = ['su', 'giu', 'sinistra', 'destra']
export const DOVE_PORTO = [...LATI, 'mano']
export const COSE_PORTO = ['cassa', 'niente', 'libero', 'cliente', 'biglietto', 'bancone',
                           'scaffale', 'cassone', 'nastro', 'muro', 'mare', 'bordo']
/* dove si posa un mattone: sotto i piedi, o dove appoggerà il piede */
export const POSTI = ['sotto', 'giu-destra', 'giu-sinistra']
/* dove guarda una condizione: i posti del mattone, più i tre dove si va */
export const DOVE = ['sotto', 'giu-destra', 'giu-sinistra', 'destra', 'sinistra', 'sopra']
export const COSE = ['mattone', 'terreno', 'acqua', 'vuoto', 'pieno', 'bordo']
export const CONFRONTI = ['<', '=', '>']
export const OPERAZIONI = ['+', '-', '×']

/* un numero scritto comodo: 3 → {n:3}, 'h' → {v:'h'}, un oggetto resta com'è */
export const numero = x =>
  typeof x === 'number' ? { n: x } : typeof x === 'string' ? { v: x } : x

/* la N: un numero ancora da scegliere */
export const N = () => ({ vuoto: true })

export const piu = (a, b) => ({ op: '+', a: numero(a), b: numero(b) })
export const meno = (a, b) => ({ op: '-', a: numero(a), b: numero(b) })
export const per = (a, b) => ({ op: '×', a: numero(a), b: numero(b) })

export const guarda = (dove, cosa, c = true, colore = null) =>
  (colore ? { tipo: 'guarda', dove, cosa, c, colore } : { tipo: 'guarda', dove, cosa, c })

/* il nome di un colore che sta in una misura o in una lavagnetta: `metti(tinta('t'))` */
export const tinta = nome => ({ v: nome })
export const confronta = (a, cmp, b) => ({ tipo: 'confronta', a: numero(a), cmp, b: numero(b) })

/* quello che il robot legge di fianco (o in mano): `leggi('sinistra')` */
export const leggi = lato => ({ leggi: lato })

export const fai = {
  vai: (verso, quanto = 1) => ({ tipo: 'vai', verso, quanto: numero(quanto) }),
  metti: (colore, dove = 'sotto') => ({ tipo: 'metti', dove, colore }),
  prendi: lato => ({ tipo: 'prendi', lato }),
  posa: lato => ({ tipo: 'posa', lato }),
  aspetta: cond => ({ tipo: 'aspetta', cond }),
  sempre: (corpo = []) => ({ tipo: 'sempre', corpo }),
  ripeti: (volte, corpo = []) => ({ tipo: 'ripeti', volte: numero(volte), corpo }),
  finche: (cond, corpo = []) => ({ tipo: 'finche', cond, corpo }),
  se: (cond, allora = [], altrimenti = null) => ({ tipo: 'se', cond, allora, altrimenti }),
  /* nel porto una lavagnetta può tenere anche un colore: il nome di un
     colore resta un colore, ogni altra stringa è una lavagnetta */
  assegna: (nome, valore) => ({ tipo: 'assegna', nome,
    valore: typeof valore === 'string' && CHIAVI_COLORI.includes(valore) ? valore : numero(valore) }),
  /* un argomento che è il nome di un colore resta una stringa (è un
     colore scritto per esteso); ogni altra stringa è il nome di una
     misura o di una lavagnetta */
  chiama: (progetto, ...argomenti) => ({ tipo: 'chiama', progetto,
    argomenti: argomenti.map(a => (typeof a === 'string' && CHIAVI_COLORI.includes(a) ? a : numero(a))) }),
}

export const progetto = (id, { nome = id, icona = '🧱', misure = [], tipi = null } = {}, corpo = []) =>
  (tipi ? { id, nome, icona, misure, tipi, corpo } : { id, nome, icona, misure, corpo })

export const programma = ({ principale = [], progetti = [], lavagnette = [] } = {}) =>
  numera({ principale, progetti, lavagnette })

/* ── gli id ──
   Ogni istruzione ne ha uno, unico nel programma: `n1`, `n2`, … Il
   contatore sta nel programma (`prossimo`) perché chi inserisce una riga
   nuova deve poter chiedere un numero mai usato anche dopo un
   salvataggio e una riapertura. Chi ha già un id lo tiene. */
export function numera(prog) {
  let max = 0
  for (const i of istruzioni(prog)) {
    const m = /^n(\d+)$/.exec(i.id || '')
    if (m) max = Math.max(max, Number(m[1]))
  }
  for (const i of istruzioni(prog)) if (!i.id) i.id = 'n' + (++max)
  prog.prossimo = Math.max(prog.prossimo || 0, max + 1)
  return prog
}

/* Tutte le istruzioni di un programma, dentro i corpi compresi: la
   principale e ogni progetto. È il giro che serve a numerare, a cercare
   e a controllare, e sta scritto una volta sola. */
export function* istruzioni(prog) {
  const corpi = [prog.principale || [], ...(prog.progetti || []).map(p => p.corpo || [])]
  for (const c of corpi) yield* dentro(c)
}

export function* dentro(corpo) {
  for (const i of corpo || []) {
    yield i
    if (i.corpo) yield* dentro(i.corpo)
    if (i.allora) yield* dentro(i.allora)
    if (i.altrimenti) yield* dentro(i.altrimenti)
  }
}

/* una copia profonda: un programma salvato non deve cambiare sotto i
   piedi di chi lo sta eseguendo, e il programma di un livello regalato
   al bambino non deve essere il dato del livello */
export const copia = prog => JSON.parse(JSON.stringify(prog))
