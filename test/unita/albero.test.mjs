/* ═══════════════════════════════════════════════════════════════════
   L'ALBERO DI UNA MERCE — IL CONSIGLIO SROTOLATO, SENZA BROWSER

   `dati/albero.js` compone la strada intera da una merce giù fino ai
   campi, per la pagina che la disegna. Qui si difendono le tre cose
   che garantisce: la profondità è finita, le foglie sono colture (o
   «arriva»), la strada scelta è quella del mercato — e il tasto di
   ogni riga ambra è lo stesso del consiglio.
   `node test/esegui.mjs albero --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { Fattoria } from '../../src/giochi/fattoria/motore/fattoria.js'
import { alberoDi, righeDi, foglieDi, profonditaDellAlbero }
  from '../../src/giochi/fattoria/dati/albero.js'
import { comeAvere } from '../../src/giochi/fattoria/motore/consiglio.js'
import { PRODOTTI, COLTURE, PER_RICETTA, PROFONDITA, MINUTO }
  from '../../src/giochi/fattoria/dati/coltivazioni.js'
import { valoreDi } from '../../src/giochi/fattoria/dati/mercato.js'
import { sogliaDi, ULTIMO, livelloDelProdotto } from '../../src/giochi/fattoria/dati/livelli.js'

const T0 = 1700000000000
const fra = min => T0 + min * MINUTO
const AZIONI = new Set(['apri', 'compra', 'premio', 'ingrandisci'])

function fattoria(liv = 30) {
  let m = 9000
  const f = new Fattoria({ borsa: { quante: () => m, paga: n => { m -= n; return true } } })
  f.speso = sogliaDi(liv)
  f.reclamaTutto()
  return f
}
const posa = (f, id, x, y) => {
  const r = f.posa(id, x, y)
  if (!r.ok) throw new Error(`la prova non riesce a posare ${id}: ${r.motivo}`)
  return r.cosa
}

/* ══════════ 1. per ogni merce e per ogni livello ══════════
   Solo ricette e macchine aperte a quel livello; profondità sotto il
   tetto; foglie che sono colture o «arriva»; il tasto di ogni riga
   ambra è uno dei quattro che `Gioco.vue` sa eseguire. */
{
  let alberi = 0, storti = []
  for (let liv = 1; liv <= ULTIMO; liv += 3) {
    const f = fattoria(liv)
    for (const p of Object.keys(PRODOTTI)) {
      const a = alberoDi(f, p, T0)
      if (!a) { storti.push(`${p}@${liv}: nessun albero`); continue }
      alberi++
      if (profonditaDellAlbero(a) > PROFONDITA) storti.push(`${p}@${liv}: troppo profondo`)
      for (const n of righeDi(a)) {
        if (n.via && n.via.che === 'ricetta' && (PER_RICETTA[n.via.id].liv || 1) > liv)
          storti.push(`${p}@${liv}: la ricetta ${n.via.id} non è ancora arrivata`)
        if (n.via && n.via.azione && !AZIONI.has(n.via.azione.che))
          storti.push(`${p}@${liv}: azione sconosciuta «${n.via.azione.che}»`)
        if (n.stato === 'ok' && n.via && n.via.azione)
          storti.push(`${p}@${liv}: una riga verde con un tasto`)
      }
      for (const foglia of foglieDi(a))
        if (!(foglia.stato === 'arriva' || (foglia.via && foglia.via.che === 'coltura')))
          storti.push(`${p}@${liv}: la foglia ${foglia.prodotto} non è né coltura né «arriva»`)
      /* la radice di una merce non ottenibile dice il livello giusto */
      if (a.stato === 'arriva' && a.arriva !== null &&
          a.arriva !== livelloDelProdotto(p))
        storti.push(`${p}@${liv}: dice «arriva al ${a.arriva}» e non al ${livelloDelProdotto(p)}`)
    }
  }
  uguale(`${alberi} alberi in regola`, storti.slice(0, 5).join(' · '), '')
}

/* ══════════ 2. la strada è quella del mercato ══════════
   Fra due strade aperte per la stessa merce vince la più economica
   (`valoreDi`), e le altre si elencano come alternative. */
{
  const f = fattoria(30)
  posa(f, 'silo', 20, 14); posa(f, 'silo_bianco', 20, 17)
  posa(f, 'fienile', 14, 14)
  const a = alberoDi(f, 'foraggio', T0)
  uguale('il foraggio prende la strada dell\'erba, che costa meno',
         a.via.id, 'foraggio')
  controlla('e sa che c\'è anche quella delle carote',
            a.via.alternative.some(v => v.id === 'foraggio_carote'))
  controlla('con dentro dove si fa, che è quello che si può scrivere',
            a.via.alternative.every(v => v.nome && (!v.dove || v.dove.nome)))
  const [erba] = a.rami
  uguale('sotto c\'è l\'erba, che è una coltura', erba.via.che, 'coltura')
  uguale('e ne servono due', erba.servono, PER_RICETTA.foraggio.prende.fieno)
  /* il costo scelto è quello che il mercato paga */
  uguale('il valore del mercato passa dalla stessa strada',
         valoreDi('foraggio'), 2)
}

/* ══════════ 3. il granaio si legge, e gli stati tornano ══════════ */
{
  const f = fattoria(30)
  posa(f, 'silo', 20, 14); posa(f, 'silo_bianco', 20, 17)
  const fienile = posa(f, 'fienile', 14, 14)
  const campo = posa(f, 'orto', 14, 20)
  f.metti('fieno', 1)

  let a = alberoDi(f, 'foraggio', T0)
  uguale('la radice manca', a.stato, 'manca')
  uguale('e la macchina c\'è', a.via.macchina.stato, 'ok')
  const erba = a.rami[0]
  uguale('l\'erba dice quanti ne ho', erba.ho, 1)
  uguale('contro quanti ne servono', erba.servono, 2)
  uguale('e il campo è libero', erba.via.campo.stato, 'libero')
  uguale('la riga ambra porta il tasto del consiglio',
         erba.via.azione.che, 'apri')
  uguale('ed è il campo libero', erba.via.azione.cosa, campo)

  f.seminaCampo(campo, 'erba', T0)
  a = alberoDi(f, 'foraggio', fra(1))
  uguale('seminato, il campo cresce', a.rami[0].via.campo.stato, 'cresce')
  controlla('e dice fra quanto', a.rami[0].via.campo.manca > 0)

  f.metti('fieno', 1)
  a = alberoDi(f, 'foraggio', fra(1))
  uguale('con due fieni l\'erba è verde', a.rami[0].stato, 'ok')
  uguale('e non ha nessun tasto', a.rami[0].via.azione, null)
  uguale('mentre il foraggio manda al fienile', a.via.azione.cosa, fienile)

  f.avvia(fienile, 'foraggio', fra(1))
  a = alberoDi(f, 'foraggio', fra(2))
  uguale('col fienile al lavoro la macchina lo dice', a.via.macchina.stato, 'lavora')
  controlla('coi minuti', a.via.macchina.manca > 0)
}

/* ══════════ 4. le macchine che mancano: da comprare, o nei premi ══════════ */
{
  const f = fattoria(30)
  posa(f, 'silo', 20, 14); posa(f, 'silo_bianco', 20, 17)
  let a = alberoDi(f, 'foraggio', T0)
  uguale('senza fienile la macchina è da comprare', a.via.macchina.stato, 'compra')
  controlla('col prezzo', a.via.macchina.prezzo > 0)
  uguale('e il tasto apre il baule sul fienile', a.via.azione.voce, 'fienile')

  delete f.reclamati['cosa:fienile']
  a = alberoDi(f, 'foraggio', T0)
  uguale('arrivato e non preso, aspetta nei premi', a.via.macchina.stato, 'premio')
  uguale('e il tasto porta lì', a.via.azione.che, 'premio')

  /* Una merce che arriva dopo: la riga dice quando e si ferma. */
  const bassa = fattoria(3)
  const z = alberoDi(bassa, 'zuppa', T0)
  uguale('la zuppa al 3 dice che arriva', z.stato, 'arriva')
  uguale('e a quale livello', z.arriva, livelloDelProdotto('zuppa'))
  uguale('senza rami sotto', z.rami.length, 0)
}

/* ══════════ 5. la prima riga ambra e il consiglio dicono lo stesso ══════════
   Per ogni merce, in una fattoria avviata: il tasto della radice
   dell'albero è quello che `comeAvere` propone.

   E a **ogni** livello, non solo a trenta: le due regole coincidevano
   finché di una merce era arrivata una strada sola, e si scostavano
   appena ne arrivava la seconda. La lana è il caso: esce dall'ovile
   (12), dalla conigliera (5) e dal recinto degli alpaca (41), e a
   sessanta la colonna mostrava il recinto degli alpaca con sotto un
   tasto che apriva il baule sull'ovile. Non è un errore, è una riga
   che mostra una macchina e ne compra un'altra — e il modo di vederla
   è guardare **che il tasto parli della macchina della riga**. */
{
  const diversi = [], altrove = []
  for (const liv of [10, 20, 30, 40, 50, 60, ULTIMO]) {
    const f = fattoria(liv)
    posa(f, 'silo', 20, 14); posa(f, 'silo_bianco', 20, 17)
    posa(f, 'mulino', 14, 14); posa(f, 'orto', 14, 20)
    for (const p of Object.keys(PRODOTTI)) {
      const a = alberoDi(f, p, T0)
      if (!a.via) continue
      const c = comeAvere(f, p, T0)
      if (JSON.stringify(a.via.azione) !== JSON.stringify(c.azione))
        diversi.push(`${p}@${liv}`)
      /* il tasto «compra» di una riga compra la macchina di quella
         riga, mai un'altra che fa la stessa merce */
      for (const n of righeDi(a)) {
        const v = n.via, az = v && v.azione
        if (!az || az.che !== 'compra' || !v.macchina) continue
        if (v.macchina.stato === 'compra' && az.voce !== v.macchina.id)
          altrove.push(`${n.prodotto}@${liv}: mostra ${v.macchina.id}, compra ${az.voce}`)
      }
    }
  }
  uguale('la radice e il consiglio propongono la stessa azione', diversi.slice(0, 5).join(', '), '')
  uguale('e nessuna riga compra una macchina diversa da quella che mostra',
         altrove.slice(0, 5).join(' · '), '')
}

/* Le righe in fila, con la profondità: quello che la colonna disegna. */
{
  const f = fattoria(40)
  posa(f, 'silo', 20, 14); posa(f, 'silo_bianco', 20, 17)
  const a = alberoDi(f, 'stoffa', T0)
  const righe = righeDi(a)
  uguale('la stoffa sta in cima', righe[0].prodotto, 'stoffa')
  uguale('a livello zero', righe[0].livello, 0)
  controlla('e sotto c\'è la lana rientrata di uno',
            righe.some(r => r.prodotto === 'lana' && r.livello === 1))
  controlla('e l\'erba in fondo, rientrata di tre',
            righe.some(r => r.prodotto === 'fieno' && r.livello === 3))
  nota(`la stoffa: ${righe.map(r => '  '.repeat(r.livello) + r.emoji + r.nome).join(' · ')}`)
  uguale('una merce che non esiste non ha albero', alberoDi(f, 'polvere', T0), null)
}

nota(`${Object.keys(PRODOTTI).length} merci, ${COLTURE.length} colture · PROFONDITA ${PROFONDITA}`)
riassunto('l\'albero di una merce')
