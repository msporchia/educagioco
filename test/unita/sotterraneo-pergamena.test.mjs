/* La pergamena del portale (docs/sotterraneo/portale-e-sosta.md, «La pergamena del portale»): la cosa (impilabile, al più
   cinque, cinque torce di prezzo), la missione dell'incantatrice che la regala e dopo la quale la vende (prima no, né in
   bottega né per terra), il consumo dal campo (mai nello scontro, una per piano, accanto all'eroe), il portale che resta
   gratis sul piano e torna con la sosta, che se ne va lasciando il piano, l'abisso senza gemello e l'ultimo posto sicuro.
   `node test/esegui.mjs sotterraneo-pergamena --niente-build` */
import { CAMPAGNA, L_ABISSO, INDICE_ABISSO } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { COSE, IN_VENDITA, A_SORTE, PREZZO_PERGAMENA, PERGAMENE_MASSIME } from '../../src/giochi/sotterraneo/dati/cose.js'
import { mercanteDi, schedeDi, guastiDeiMercanti } from '../../src/giochi/sotterraneo/dati/mercanti.js'
import { missioneDi, guastiDelleMissioni, personaDi } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { eroeDi } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { Bottega } from '../../src/giochi/sotterraneo/motore/bottega.js'
import { tascheDello } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { scrivi, leggi, PORTALE as VIA_PORTALE } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { offerte, prendi, fatte, consegna, dopoLaMissione, presePer, FATTA, CONSEGNATA } from '../../src/giochi/sotterraneo/motore/missioni.js'
import { pergamenaCade, PROBABILITA_PERGAMENA } from '../../src/giochi/sotterraneo/motore/bottino.js'
import { ultimoPostoSicuro } from '../../src/giochi/sotterraneo/motore/posto-sicuro.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const P = 'pergamena-portale'
const tappeAl = n => CAMPAGNA.map((t, i) => ({ chiave: t.chiave, nome: t.nome, aperta: i <= n, fatta: i < n }))
const roba = (zaino = [], gemme = 0) => ({ v: 1, gemme, zaino, mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 })

/* ── la cosa ── */
{
  const c = COSE[P]
  controlla('c\'è, si usa per aprire il portale, ha un prezzo e la sua emoji', c && c.usa === 'portale' && c.prezzo === PREZZO_PERGAMENA && c.em === '📜')
  controlla('costa una scelta: da quattro a sei torce', PREZZO_PERGAMENA >= 4 * COSE.torcia.prezzo && PREZZO_PERGAMENA <= 6 * COSE.torcia.prezzo, String(PREZZO_PERGAMENA))
  controlla('si vende, ma non si pesca a caso sui banchi', IN_VENDITA.includes(P) && !A_SORTE.includes(P))
  uguale('tre pergamene stanno in una tasca sola', tascheDello([P, P, P]).length, 1)
  uguale('i mercanti stanno in piedi', guastiDeiMercanti().join(' · '), '')
  uguale('le missioni stanno in piedi', guastiDelleMissioni().join(' · '), '')
}

/* ── la missione dell'incantatrice, e la bottega prima e dopo ── */
{
  const q = missioneDi('quaderno')
  controlla('la dà l\'incantatrice, nella cripta, al primo piano: è da trovare', q && q.da === 'incantatrice' && q.discesa === 'altare' && q.piano === 0 && q.tipo === 'trova')
  uguale('l\'incantatrice si nomina nel diario', personaDi('incantatrice').nome, 'L\'incantatrice')
  uguale('il premio è la prima pergamena', q.premio.cosa, P)
  controlla('c\'è dall\'inizio, e non toglie posto alle altre tre', offerte({}, tappeAl(0)).some(m => m.id === 'quaderno') && offerte({}, tappeAl(0)).some(m => m.id === 'badessa'))

  // presa, il quaderno sta in un forziere della cripta al primo piano
  const giu = new Corsa(CAMPAGNA[0], { seme: 3, rnd: seminato(3), roba: roba(), missioni: presePer({ quaderno: 'presa' }, 'altare') })
  const f = giu.livello.robe.find(r => r.missione === 'quaderno')
  controlla('presa, il quaderno aspetta in un forziere del primo piano della cripta', f && f.che === 'forziere', JSON.stringify(f))

  const m = mercanteDi('incantatrice')
  const prima = new Bottega({ eroe: 'mago', roba: roba([], 200), finite: 1, missioni: {} })
  controlla('prima della missione l\'incantatrice non la vende', !prima.banco('incantatrice').sempre.includes(P))
  controlla('e la linguetta delle pergamene non c\'è', !schedeDi(m, eroeDi('mago'), {}).some(s => s.chiave === 'pergamene'))
  uguale('e non dovrebbe comprarla', prima.compra(P, prima.banco('incantatrice')), null)
  controlla('nessun altro la vende', ['armaiolo', 'erborista', 'rigattiere'].every(k => !new Bottega({ eroe: 'mago', finite: 3, missioni: { quaderno: CONSEGNATA } }).banco(k).sempre.includes(P)))

  // il giro intero: presa, fatta, consegnata col premio in tasca
  let stati = prendi({}, 'quaderno', tappeAl(0))
  uguale('si prende', stati.quaderno, 'presa')
  stati = fatte(stati, ['quaderno'])
  uguale('trovato il quaderno è fatta', stati.quaderno, FATTA)
  const io = new Bottega({ eroe: 'mago', roba: roba([], 200), finite: 1 })
  const e = consegna(stati, 'quaderno', io)
  uguale('consegnata', e.esito, 'consegnata')
  uguale('e la pergamena è nello zaino', io.zaino.filter(k => k === P).length, 1)
  controlla('da qui si vende', dopoLaMissione('quaderno', e.stati))

  const dopo = new Bottega({ eroe: 'mago', roba: roba([], 1000), finite: 1, missioni: e.stati })
  const banco = dopo.banco('incantatrice')
  controlla('dopo la missione sta in cima al banco dell\'incantatrice', banco.sempre.includes(P))
  controlla('con la sua linguetta', schedeDi(m, eroeDi('mago'), e.stati).some(s => s.chiave === 'pergamene'))
  for (let i = 0; i < PERGAMENE_MASSIME; i++) dopo.compra(P, banco)
  uguale(`se ne comprano ${PERGAMENE_MASSIME}`, dopo.zaino.filter(k => k === P).length, PERGAMENE_MASSIME)
  uguale('costano il loro prezzo', dopo.gemme, 1000 - PERGAMENE_MASSIME * PREZZO_PERGAMENA)
  uguale('la sesta no: al tetto', dopo.compra(P, banco).che, 'pieno')
  uguale('e restano cinque, in una tasca', tascheDello(dopo.zaino).filter(t => t.k === P).map(t => t.n).join(), String(PERGAMENE_MASSIME))
}

/* ── per terra: rara, solo dopo la missione, da forzieri e curiosità e mai dai mostri ── */
{
  let cadute = 0, tiri = 0
  for (let s = 1; s <= 400; s++) for (let x = 3; x < 13; x++) { tiri++; if (pergamenaCade('forziere', s, 0, x, 5)) cadute++ }
  const q = cadute / tiri
  controlla('da un forziere cade di rado (vicino a quanto dichiara)', Math.abs(q - PROBABILITA_PERGAMENA.forziere) < 0.01, q.toFixed(4))
  controlla('dai mostri mai', !PROBABILITA_PERGAMENA.mostro && !PROBABILITA_PERGAMENA.grosso && !PROBABILITA_PERGAMENA.caporale)
  // un forziere che la farebbe cadere: senza la missione resta il bottino di sempre
  // un forziere posato apposta in una cella che la farebbe cadere: senza la missione resta il bottino di sempre
  const apri = trovabili => {
    const c = new Corsa(CAMPAGNA[2], { seme: 5, rnd: seminato(5), roba: roba() })
    c.pergameneTrovabili = trovabili
    for (let y = 1; y < c.livello.alto - 1; y++) for (let x = 1; x < c.livello.largo - 1; x++) {
      if (!c.libera(x, y) || !pergamenaCade('forziere', c.seme, c.piano, x, y)) continue
      const f = { che: 'forziere', x, y, em: '🎁' }
      c.livello.robe.push(f)
      c.foglio = { che: 'forziere', chi: f }
      c.rispostaForziere(f, true)
      return c.livello.robe.some(r => r.che === 'cosa' && r.cosa === P)
    }
    return null
  }
  uguale('senza la missione, il forziere fortunato non la dà', apri(false), false)
  uguale('dopo la missione sì', apri(true), true)
}

/* ── usarla dal campo ── */
function scesa(tappa = CAMPAGNA[1], zaino = [P, P]) {
  for (let seme = 1; seme < 200; seme++) {
    const c = new Corsa(tappa, { seme, rnd: seminato(seme), roba: roba(zaino) })
    for (const r of c.livello.robe) if (r.che === 'mostro') r.morto = true
    const e = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
    if (c.libera(e.x + 1, e.y)) { c.verso = { dx: 1, dy: 0 }; c.aggiornaLuce(); return c }
  }
  return null
}
{
  const c = scesa()
  const i = c.zaino.indexOf(P)
  const e = c.usa(i)
  uguale('si apre un portale', e.che, 'portale')
  const r = c.portaleDellaPergamena
  controlla('nella cella davanti all\'eroe, libera', r && r.x === Math.floor(c.eroe.x) + 1 && r.y === Math.floor(c.eroe.y), JSON.stringify(r))
  uguale('e la pergamena è spesa', c.zaino.filter(k => k === P).length, 1)
  controlla('si tocca come il portale fisso', c.toccabile(r))
  c.interagisci(r)
  uguale('e apre il suo foglio', c.foglio && c.foglio.che, 'portale')
  c.chiudi()
  uguale('un secondo portale non si apre, e la pergamena non si spreca', c.usa(c.zaino.indexOf(P)).che, 'niente')
  uguale('l\'altra resta', c.zaino.filter(k => k === P).length, 1)

  // nello scontro no
  const s = scesa()
  const m = s.livello.robe.find(q => q.che === 'mostro')
  m.morto = false; m.sveglio = true
  s.scontro(m, { solo: true })
  uguale('nello scontro non si apre', s.usa(s.zaino.indexOf(P)).che, 'niente')
  uguale('e non si spende', s.zaino.filter(k => k === P).length, 2)
}

/* ── il gemello gratis: la sosta lo tiene, lasciare il piano lo chiude ── */
{
  const c = scesa(CAMPAGNA[1])
  c.usa(c.zaino.indexOf(P))
  const r = c.portaleDellaPergamena
  const io = { x: c.eroe.x, y: c.eroe.y }
  const dato = scrivi(c, 1, { via: VIA_PORTALE })
  const giu = leggi(dato, CAMPAGNA[1], roba([P]), presePer({}, CAMPAGNA[1].chiave))
  controlla('tornando giù dal gemello si è nel punto di prima', giu && giu.eroe.x === io.x && giu.eroe.y === io.y)
  const ancora = giu.portaleDellaPergamena
  controlla('e il portale della pergamena è ancora lì, aperto, gratis', ancora && ancora.x === r.x && ancora.y === r.y)
  uguale('nello zaino la pergamena non è tornata', giu.zaino.filter(k => k === P).length, 1)
  giu.interagisci(ancora)
  uguale('si risale da lì senza un\'altra pergamena', giu.foglio && giu.foglio.che, 'portale')
  giu.chiudi()
  // lasciando il piano il portale si chiude, e tornandoci non c'è più
  giu.lasciaIlPiano()
  uguale('lasciato il piano, il portale della pergamena se ne va', giu.portaleDellaPergamena, null)
  controlla('quello fisso del piano no', giu.livello.robe.filter(q => q.che === 'portale').every(q => !q.pergamena))
}

/* ── nell'abisso: porta su, senza gemello ── */
{
  const c = scesa(L_ABISSO)
  c.usa(c.zaino.indexOf(P))
  controlla('nell\'abisso il portale della pergamena non lascia il gemello', c.portaleDellaPergamena && c.portaleDellaPergamena.senzaGemello === true)
  const d = scesa(CAMPAGNA[2])
  d.usa(d.zaino.indexOf(P))
  controlla('nelle discese sì', d.portaleDellaPergamena && !d.portaleDellaPergamena.senzaGemello)
  uguale('(l\'abisso è la sua tappa)', INDICE_ABISSO, -1)
}

/* ── l'ultimo posto sicuro ── */
{
  const v = ultimoPostoSicuro({})
  uguale('oggi è il villaggio', v.chiave, 'villaggio')
  controlla('e nel mondo in 3D al portale', v.mondo.portale === true)
  const n = ultimoPostoSicuro({ mondo: { sicuro: { chiave: 'roccalta' } } })
  controlla('quando il mondo nuovo scrive la città toccata, la si legge (col portale di ripiego)', n.chiave === 'roccalta' && n.mondo.sicuro === 'roccalta' && n.mondo.portale)
  uguale('un dato storto è il villaggio', ultimoPostoSicuro({ mondo: { sicuro: 3 } }).chiave, 'villaggio')
}

riassunto('la pergamena del portale')
