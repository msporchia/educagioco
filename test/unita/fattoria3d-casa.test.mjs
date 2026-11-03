/* Dentro la casa della fattoria 3D, senza browser: i dati (mobili, colori, trame, prezzi nella fascia), le stanze che si comprano una
   attaccata all'altra fino a sei, i mobili che stanno solo dentro una stanza tua, senza coprire le porte né un altro mobile (il tappeto sotto
   sì, le cose appese solo sulla parete di fondo), l'armadio che c'è sempre e non si mette via, i gesti gratis (spostare, girare, colorare,
   pavimento e pareti), la spesa che conta come esperienza, e lo stato rotto o di prima che si rimette in forma.
   `node test/esegui.mjs fattoria3d-casa`
   tempo: 1 */
import { MOBILI, STANZE, MAX_STANZE, PREZZI_STANZE, ARMADIO, INGRESSO, PORTA_DI_CASA, origine, soglieDi, portaFra, guastiDegliInterni } from '../../src/giochi/fattoria3d/dati/interni.js'
import { interniInForma, interniIniziali } from '../../src/giochi/fattoria3d/motore/interni.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { normalizza } from '../../src/giochi/fattoria3d/motore/stato.js'
import { percorso } from '../../src/giochi/fattoria3d/motore/percorso.js'
import { controlla, stessaLista as uguale, riassunto } from '../aiuto/verifica.mjs'

const borsa = (n = 5000) => { const b = { monete: n, quante: () => b.monete, paga: x => { b.monete -= x; return true } }; return b }
const nuova = (n) => { const b = borsa(n); return { f: new Fattoria3d({ borsa: b }), b } }

/* ══════════ 1. i dati ══════════ */
uguale('nessun guasto nei dati della casa', guastiDegliInterni(), [])
uguale('sei stanze, un prezzo per ognuna', [STANZE.length, PREZZI_STANZE.length], [MAX_STANZE, MAX_STANZE])
controlla('l\'armadio è di serie e non costa', MOBILI[ARMADIO].diSerie && MOBILI[ARMADIO].prezzo === 0)

/* ══════════ 2. si comincia con una stanza e l'armadio ══════════ */
{
  const { f } = nuova()
  uguale('una stanza sola, la 0', f.s.interni.stanze, [0])
  controlla('l\'armadio è in casa, al suo posto', f.s.interni.mobili.some(m => m.tipo === ARMADIO && m.i !== null))
  controlla('l\'ingresso si cammina', f.calpestabileInCasa(INGRESSO.i, INGRESSO.j) && f.calpestabileInCasa(PORTA_DI_CASA.i, PORTA_DI_CASA.j))
}

/* ══════════ 3. le stanze: una attaccata all'altra, fino a sei, sempre più care, ed è esperienza ══════════ */
{
  const { f, b } = nuova()
  uguale('una stanza che non confina non si compra', f.compraStanza(4).motivo, 'non-confina')
  const xp = f.esperienza()
  const r = f.compraStanza(1)
  controlla('la seconda costa 60 e conta come esperienza', r.ok && r.costo === PREZZI_STANZE[1] && f.esperienza() === xp + r.costo && b.monete === 5000 - r.costo)
  uguale('due volte la stessa no', f.compraStanza(1).motivo, 'gia-tua')
  for (const id of [4, 3, 5, 2]) f.compraStanza(id)
  uguale('tutte e sei', f.s.interni.stanze, [0, 1, 2, 3, 4, 5])
  const due = nuova(10).f
  uguale('senza monete no, e niente cambia', [due.compraStanza(1).motivo, due.s.interni.stanze], ['poche-monete', [0]])
  // fra due stanze tue la porta si cammina, e dall'ingresso si arriva in fondo alla casa
  const p = portaFra(STANZE[0], STANZE[3])
  controlla('la porta fra due stanze tue si cammina', f.calpestabileInCasa(p.i, p.j))
  const { i0, j0 } = origine(STANZE[4])
  controlla('dall\'ingresso si arriva nella stanza in fondo a sinistra', !!percorso((i, j) => f.calpestabileInCasa(i, j), () => false, [INGRESSO.i, INGRESSO.j], [[i0, j0]]))
}

/* ══════════ 4. i mobili: dove si mettono ══════════ */
{
  const { f, b } = nuova()
  const { i0, j0 } = origine(STANZE[0])
  const r = f.compraMobile('divano', i0 + 1, j0 + 3, 0, 'rosa', 'fiori')
  controlla('un divano si compra e si mette, col colore e la trama scelti', r.ok && b.monete === 5000 - MOBILI.divano.prezzo)
  const d = f.s.interni.mobili.find(m => m.id === r.id)
  uguale('colore e trama', [d.colore, d.trama], ['rosa', 'fiori'])
  uguale('sopra un altro mobile no', f.compraMobile('poltrona', i0 + 2, j0 + 3).motivo, 'occupato')
  controlla('un tappeto sotto il divano sì', f.compraMobile('tappeto', i0 + 1, j0 + 2).ok)
  uguale('un tappeto sopra un tappeto no', f.compraMobile('tappetino', i0 + 1, j0 + 2).motivo, 'occupato')
  uguale('fuori dalla casa no', f.compraMobile('sedia', -5, -5).motivo, 'fuori')
  uguale('in una stanza non tua no', f.compraMobile('sedia', origine(STANZE[1]).i0, origine(STANZE[1]).j0 + 1).motivo, 'fuori')
  const [si, sj] = soglieDi(STANZE[0])[0]
  uguale('davanti a una porta no', f.compraMobile('sedia', si, sj).motivo, 'porta')
  uguale('un quadro va sulla parete di fondo', f.compraMobile('quadro', i0 + 3, j0 + 2).motivo, 'muro')
  controlla('sulla parete di fondo sì, anche sopra un mobile', f.compraMobile('quadro', i0, j0).ok)
  uguale('l\'armadio non si compra', f.compraMobile(ARMADIO, i0 + 4, j0 + 4).motivo, 'di-serie')
  controlla('un mobile per terra non si cammina', !f.calpestabileInCasa(i0 + 1, j0 + 3))
}

/* ══════════ 5. i gesti gratis: spostare, girare, colorare, metti via e rimetti, pavimento e pareti ══════════ */
{
  const { f, b } = nuova()
  const { i0, j0 } = origine(STANZE[0])
  const id = f.compraMobile('letto', i0 + 3, j0 + 1).id
  const prima = b.monete, xp = f.esperienza()
  controlla('si sposta', f.spostaMobile(id, i0 + 1, j0 + 1).ok)
  controlla('si gira (il letto 2×3 diventa 3×2)', f.giraMobile(id).ok && f.s.interni.mobili.find(m => m.id === id).rot === 1)
  controlla('si colora', f.tingiMobile(id, 'verde', 'stelle').ok)
  controlla('si mette via', f.mettiViaMobile(id).ok && f.s.interni.mobili.find(m => m.id === id).i === null)
  controlla('si rimette', f.spostaMobile(id, i0 + 1, j0 + 1, 0).ok)
  controlla('pavimento e pareti', f.rifiniStanza(0, { pavimento: 'scacchi', pareti: 'rosa', carta: 'cuori' }).ok)
  uguale('niente di tutto questo costa né dà esperienza', [b.monete, f.esperienza()], [prima, xp])
  const arm = f.s.interni.mobili.find(m => m.tipo === ARMADIO)
  uguale('l\'armadio non si mette via', f.mettiViaMobile(arm.id).motivo, 'di-serie')
  uguale('un colore che non c\'è torna quello di serie', (f.tingiMobile(id, 'oro'), f.s.interni.mobili.find(m => m.id === id).colore), MOBILI.letto.colore)
}

/* ══════════ 6. lo stato: si salva e si rilegge, quello di prima nasce, quello rotto si rimette in forma ══════════ */
{
  const { f } = nuova()
  f.compraStanza(1); f.compraMobile('divano', 9, 10, 0, 'blu', 'righe')
  const letto = new Fattoria3d({ stato: JSON.parse(JSON.stringify(f.serializza())), borsa: borsa(0) })
  uguale('salva e rileggi', letto.s.interni, f.s.interni)
  const vecchio = f.serializza(); delete vecchio.interni
  uguale('uno stato di prima della casa nasce con una stanza e l\'armadio', normalizza(vecchio).interni, interniIniziali())
  const rotto = interniInForma({ stanze: [0, 9, 'x'], mobili: [{ id: 3, tipo: 'astronave', i: 9, j: 9 }, { id: 4, tipo: 'sedia', i: -40, j: 2 }, null], finiture: { 0: { pavimento: 'lava' } } })
  uguale('le stanze che non ci sono si buttano', rotto.stanze, [0])
  controlla('un mobile che non c\'è si butta, uno fuori posto va via (resta tuo)', !rotto.mobili.some(m => m.tipo === 'astronave') && rotto.mobili.find(m => m.id === 4).i === null)
  controlla('l\'armadio torna anche se mancava', rotto.mobili.some(m => m.tipo === ARMADIO && m.i !== null))
  uguale('un pavimento che non c\'è torna parquet', rotto.finiture[0].pavimento, 'parquet')
  controlla('l\'id dopo è più grande di tutti', rotto.prossimoId > Math.max(...rotto.mobili.map(m => m.id)))
}

riassunto('Dentro la casa della fattoria 3D')
