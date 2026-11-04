/* Dentro la casa della fattoria 3D, senza browser: i dati (mobili, colori, trame, prezzi nella fascia), le stanze che si comprano una
   attaccata all'altra fino a sei, i mobili che stanno solo dentro una stanza tua, senza coprire le porte che ci sono né un altro mobile (il
   tappeto sotto sì, le cose appese solo sulla parete di fondo), le porte nuove che fanno spostare chi sta davanti, l'armadio che c'è sempre e
   non si mette via, i gesti gratis (spostare, girare, colorare), pavimento e pareti che si pagano, la spesa che conta come esperienza, e lo
   stato rotto o di prima che si rimette in forma.
   `node test/esegui.mjs fattoria3d-casa`
   tempo: 1 */
import { MOBILI, STANZE, MAX_STANZE, PREZZI_STANZE, PREZZI_FINITURE, ARMADIO, INGRESSO, PORTA_DI_CASA, origine, stanzaDi, soglieDi, portaFra, guastiDegliInterni } from '../../src/giochi/fattoria3d/dati/interni.js'
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
  uguale('davanti alla porta di casa no', f.compraMobile('sedia', INGRESSO.i, INGRESSO.j).motivo, 'porta')
  uguale('un quadro va sulla parete di fondo', f.compraMobile('quadro', i0 + 3, j0 + 2).motivo, 'muro')
  controlla('sulla parete di fondo sì, anche sopra un mobile', f.compraMobile('quadro', i0, j0).ok)
  uguale('l\'armadio non si compra', f.compraMobile(ARMADIO, i0 + 4, j0 + 4).motivo, 'di-serie')
  controlla('un mobile per terra non si cammina', !f.calpestabileInCasa(i0 + 1, j0 + 3))
}

/* ══════════ 5. le porte: tiene libero solo quella che c'è; quella nuova fa spostare chi sta davanti ══════════ */
{
  const { f } = nuova()
  const { i0, j0 } = origine(STANZE[0]), ovest = portaFra(STANZE[0], STANZE[1])
  uguale('una stanza sola ha una soglia sola, la porta di casa', soglieDi(STANZE[0], [0]), [[INGRESSO.i, INGRESSO.j]])
  const divano = f.compraMobile('divano', i0, j0 + 1, 1)
  controlla('il divano girato sta lungo il muro, dove un giorno ci sarà una porta', divano.ok)
  const quadro = f.compraMobile('quadro', i0 + 3, j0)
  controlla('un quadro sta sulla parete di fondo dove la porta ancora non c\'è', quadro.ok)
  const r = f.compraStanza(1), d = f.s.interni.mobili.find(m => m.id === divano.id)
  uguale('comprando la stanza accanto il divano si sposta e lo si dice', r.spostati, ['divano'])
  controlla('resta girato com\'era e nella sua stanza', d.rot === 1 && stanzaDi(d.i, d.j) === STANZE[0])
  controlla('si passa dalla porta nuova', !!percorso((i, j) => f.calpestabileInCasa(i, j), () => false, [INGRESSO.i, INGRESSO.j], [[ovest.i - 1, ovest.j]]))
  uguale('adesso lì davanti non ci sta', f.spostaMobile(d.id, i0, j0 + 1, 1).motivo, 'porta')
  uguale('comprando la stanza dietro il quadro si sposta', f.compraStanza(3).spostati, ['quadro'])
  uguale('sulla porta di fondo non si appende niente', f.compraMobile('quadro', i0 + 3, j0).motivo, 'porta')
  const piena = nuova().f
  const lungo = piena.compraMobile('divano', i0, j0 + 1, 1)
  for (let p; (p = piena.postoPerMobile('sedia', 0)) && stanzaDi(p.i, p.j) === STANZE[0];) piena.compraMobile('sedia', p.i, p.j, p.rot)
  uguale('in una stanza piena il mobile finisce in quella nuova', [piena.compraStanza(1).spostati, stanzaDi(piena.s.interni.mobili.find(m => m.id === lungo.id).i, piena.s.interni.mobili.find(m => m.id === lungo.id).j).id], [['divano'], 1])
}

/* ══════════ 6. i gesti gratis: spostare, girare, colorare, metti via e rimetti ══════════ */
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
  uguale('niente di tutto questo costa né dà esperienza', [b.monete, f.esperienza()], [prima, xp])
  const arm = f.s.interni.mobili.find(m => m.tipo === ARMADIO)
  uguale('l\'armadio non si mette via', f.mettiViaMobile(arm.id).motivo, 'di-serie')
  uguale('un colore che non c\'è torna quello di serie', (f.tingiMobile(id, 'oro'), f.s.interni.mobili.find(m => m.id === id).colore), MOBILI.letto.colore)
}

/* ══════════ 7. pavimento e pareti si pagano: solo quello che cambia, ed è esperienza ══════════ */
{
  const { f, b } = nuova()
  const xp = f.esperienza(), r = f.rifiniStanza(0, { pavimento: 'scacchi' })
  controlla('il pavimento costa e conta come esperienza', r.ok && r.costo === PREZZI_FINITURE.pavimento && b.monete === 5000 - r.costo && f.esperienza() === xp + r.costo)
  uguale('si paga solo quello che cambia', f.rifiniStanza(0, { pavimento: 'scacchi', pareti: 'rosa', carta: 'cuori' }).costo, PREZZI_FINITURE.pareti + PREZZI_FINITURE.carta)
  uguale('lo stesso colore non costa', f.rifiniStanza(0, { pareti: 'rosa' }).costo, 0)
  uguale('la finitura è cambiata', f.s.interni.finiture[0], { pavimento: 'scacchi', pareti: 'rosa', carta: 'cuori' })
  uguale('una stanza non tua no', f.rifiniStanza(3, { pareti: 'rosa' }).motivo, 'non-esiste')
  const povera = nuova(5).f
  uguale('senza monete no, e niente cambia', [povera.rifiniStanza(0, { pareti: 'rosa' }).motivo, povera.s.interni.finiture[0].pareti], ['poche-monete', 'crema'])
}

/* ══════════ 8. lo stato: si salva e si rilegge, quello di prima nasce, quello rotto si rimette in forma ══════════ */
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
