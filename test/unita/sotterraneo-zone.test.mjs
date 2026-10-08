/* Le zone che si potenziano (docs/sotterraneo/zone.md): finita la
   storia una discesa già fatta si sveglia al livello dell'eroe, la
   racconta il minatore, si vince il suo mostro grosso e se ne sveglia
   un'altra, a giro. Qui: quale zona, quando e a che livello; com'è fatta
   una zona potenziata (più piani, la stessa forma, i mostri e il bottino
   del suo livello); la sosta che la rifà uguale; i gradini e il colore
   del pallino.
   `node test/esegui.mjs sotterraneo-zone --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { ORDINE_DELLE_ZONE, POTENZIATE, zonaPotenziata, zonaDi, forzaDellaZona, spintaDellaZona,
         guastiDelleZone, DETTI_DEL_COLORE, PIANI_DELLA_ZONA } from '../../src/giochi/sotterraneo/dati/zone.js'
import { svegliaDi, potenzaDi, livelloDellaZona, vintaLaZona, zoneDi, annuncioDi, gradinoDi, coloreDi, COLORI,
         robaAttesaA, crescitaAttesaA } from '../../src/giochi/sotterraneo/motore/zone.js'
import { LIVELLI_ATTESI } from '../../src/giochi/sotterraneo/dati/storia.js'
import { scenarioDi } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Corredo } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { scrivi, leggi, dice } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const indiceDi = k => CAMPAGNA.findIndex(t => t.chiave === k)

/* ══════════ 1. i dati stanno in piedi ══════════ */
uguale('nessun guasto nelle zone', guastiDelleZone().join(' · '), '')
uguale('il giro passa da ogni discesa una volta', [...ORDINE_DELLE_ZONE].sort().join(), CAMPAGNA.map(t => t.chiave).sort().join())
{
  // lo scenario resta fisso per qualche zona di fila: tre blocchi, non sette cambi
  const scenari = ORDINE_DELLE_ZONE.map(k => CAMPAGNA[indiceDi(k)].scenario)
  const cambi = scenari.filter((s, i) => i && s !== scenari[i - 1]).length
  uguale('lo scenario cambia due volte nel giro (cantine, fornace, cripta)', cambi, 2)
  uguale('le prime sono le cantine', scenari.slice(0, 3).join(), 'cantine,cantine,cantine')
}

/* ══════════ 2. quale zona si sveglia, quando, a che livello ══════════ */
{
  const storia = { tappa: 4, libera: false, stelle: {} }
  uguale('finché la storia non è finita non si sveglia niente', svegliaDi(storia, 9), null)
  uguale('e nessuna discesa è potenziata', CAMPAGNA.map((_, k) => potenzaDi(storia, k, 9)).filter(Boolean).length, 0)
  uguale('il livello di una discesa della storia è quello atteso', livelloDellaZona(storia, 3, 9), LIVELLI_ATTESI[3])

  const finita = { tappa: 7, libera: true, stelle: {} }
  const s = svegliaDi(finita, 13)
  uguale('finita la storia la prima si sveglia da sé: la scalinata', s.chiave, 'cantine')
  uguale('al livello dell\'eroe', s.livello, 13)
  uguale('e il minatore non l\'ha ancora raccontata', s.sentita, false)
  uguale('il livello la segue finché non ci si scende', svegliaDi(finita, 15).livello, 15)
  uguale('potenzaDi la dice uguale', potenzaDi(finita, indiceDi('cantine'), 15), 15)
  uguale('le altre restano come nella storia', potenzaDi(finita, indiceDi('torre'), 15), null)
  controlla('l\'annuncio è la sua storia', annuncioDi(s).startsWith(POTENZIATE.cantine.annuncio), annuncioDi(s))

  // scesi dentro: la sosta tiene il livello di quando si è scesi
  const giu = { ...finita, sosta: { tappa: indiceDi('cantine'), potenza: 13 } }
  uguale('lasciata a metà, la zona resta al livello di quando si è scesi', svegliaDi(giu, 15).livello, 13)

  // vinta: si segna, e si sveglia la dopo
  const z = vintaLaZona(finita, 'cantine', 13)
  uguale('vinta la sveglia, se ne sveglia un\'altra', z.n, 2)
  uguale('la vinta resta al suo livello', z.livelli.cantine, 13)
  uguale('e la nuova va raccontata', z.sentita, false)
  const dopo = { ...finita, zone: z }
  uguale('la seconda è la grotta', svegliaDi(dopo, 14).chiave, 'gallerie')
  uguale('la scalinata resta potenziata al livello di allora', potenzaDi(dopo, indiceDi('cantine'), 14), 13)
  uguale('e il colore lo dice: per un eroe del 14 è ancora verde', coloreDi(livelloDellaZona(dopo, indiceDi('cantine'), 14), 14), 'verde')
  uguale('una zona vinta prima, rifatta, non sveglia niente', vintaLaZona(dopo, 'cantine', 14), null)

  // il giro: dopo l'ultima si ricomincia dalla prima
  const giro = { ...finita, zone: { n: ORDINE_DELLE_ZONE.length + 1, livelli: { cantine: 13 } } }
  uguale('finito il giro si ricomincia dalla scalinata', svegliaDi(giro, 20).chiave, 'cantine')
  uguale('al livello di adesso, non a quello di allora', svegliaDi(giro, 20).livello, 20)
  uguale('uno stato storto vale come nuovo', zoneDi({ zone: { n: 'x', livelli: { boh: 3, torre: -1 } } }).n, 1)
  uguale('e non inventa livelli', Object.keys(zoneDi({ zone: { livelli: { boh: 3, torre: -1 } } }).livelli).length, 0)
}

/* ══════════ 3. com'è fatta una zona potenziata ══════════ */
for (const [k, t] of CAMPAGNA.entries()) {
  const z = zonaPotenziata(k, 16)
  controlla(`${t.chiave}: zona corta, cinque o sei piani`, z.piani >= PIANI_DELLA_ZONA && z.piani <= 6, String(z.piani))
  uguale(`${t.chiave}: la stessa discesa (chiave e scenario)`, `${z.chiave}|${scenarioDi(z, 3)}`, `${t.chiave}|${scenarioDi(t, 0)}`)
  uguale(`${t.chiave}: col suo nome`, z.nome, POTENZIATE[t.chiave].nome)
  uguale(`${t.chiave}: il livello del posto è la potenza`, `${z.livello}|${z.potenza}`, '16|16')
  controlla(`${t.chiave}: più forte che al 12`, forzaDellaZona(16, t.chiave) > forzaDellaZona(12, t.chiave) &&
            spintaDellaZona(16) > spintaDellaZona(12))
}
uguale('zonaDi senza potenza è la discesa della storia', zonaDi(2), CAMPAGNA[2])
uguale('e l\'abisso resta l\'abisso', zonaDi(-1).abisso, true)
{
  const k = indiceDi('torre')
  const z = zonaPotenziata(k, 16)
  const c = new Corsa(z, { seme: 31, eroe: 'cavaliere', roba: robaAttesaA('cavaliere', 16), crescita: crescitaAttesaA('cavaliere', 16) })
  uguale('una zona potenziata pesca il bottino come l\'abisso, non la riga della storia', c.indice, -1)
  uguale('il bottino è del suo livello', c.livelloDelBottino, 16)
  const storia = new Corsa(CAMPAGNA[k], { seme: 31, eroe: 'cavaliere', roba: robaAttesa('cavaliere', k) })
  const ossa = cc => Math.max(...cc.livello.robe.filter(r => r.che === 'mostro').map(r => r.ossa))
  controlla('i mostri hanno più ossa che nella storia', ossa(c) > 2 * ossa(storia), `${ossa(c)} contro ${ossa(storia)}`)
  c.piano = z.piani - 1
  c.nuovoPiano()
  const g = c.livello.robe.find(r => r.grosso)
  uguale('in fondo c\'è il suo mostro grosso', g && g.grosso, 'fiammetta')
  controlla('e porta la chiave', !!(g && g.chiave))
  const domande = c.colpiPer(g)
  controlla('il grosso potenziato si batte in poche risposte, non in un compito', domande >= 5 && domande <= 16, String(domande))
}

/* ══════════ 4. la sosta rifà la stessa zona ══════════ */
{
  const k = indiceDi('labirinto')
  const z = zonaPotenziata(k, 18)
  const roba = robaAttesaA('nano', 18)
  const c = new Corsa(z, { seme: 77, eroe: 'nano', roba, crescita: crescitaAttesaA('nano', 18) })
  c.piano = 2
  c.nuovoPiano()
  const s = scrivi(c, k)
  uguale('la sosta scrive la potenza', s.potenza, 18)
  const d = leggi(s, zonaDi(s.tappa, s.potenza), roba, [], crescitaAttesaA('nano', 18))
  controlla('e si rilegge', !!d)
  uguale('nello stesso piano, con le stesse cose', d && JSON.stringify(d.livello.robe.map(r => [r.che, r.x, r.y, r.ossa])),
         JSON.stringify(c.livello.robe.map(r => [r.che, r.x, r.y, r.ossa])))
  uguale('cinque piani, non tre', d && d.quantiPiani, 5)
  uguale('la carta «riprendi» dice il nome della zona', dice(s, CAMPAGNA).nome, POTENZIATE.labirinto.nome)
  uguale('e i suoi piani', dice(s, CAMPAGNA).piani, 5)
  const vecchia = { ...s }
  delete vecchia.potenza
  uguale('una sosta senza potenza resta la discesa della storia', dice(vecchia, CAMPAGNA).nome, CAMPAGNA[k].nome)
}

/* ══════════ 5. i gradini e i colori ══════════
   Un gradino è il passo fra due discese di fila della storia (1 · 2 · 3 · 5 · 7 · 8 · 10 · 12), oltre il 12 uno ogni
   due livelli. Due sopra rosso, uno sopra arancio, due sotto grigio, il resto verde */
uguale('i gradini della storia', [1, 2, 3, 4, 5, 7, 8, 10, 12].map(gradinoDi).join(), '0,1,2,2,3,4,5,6,7')
uguale('oltre il 12, uno ogni due livelli', [12, 13, 14, 16, 20].map(gradinoDi).join(), '7,7,8,9,11')
for (const [zona, eroe, colore, perche] of [
  [1, 1, 'verde', 'la cripta per chi comincia'],
  [2, 1, 'arancio', 'la scalinata al livello 1: un gradino sopra'],
  [3, 1, 'rosso', 'la torre al livello 1: due gradini sopra'],
  [7, 5, 'arancio', 'la scala sommersa al 5'],
  [7, 4, 'rosso', 'la scala sommersa al 4'],
  [8, 12, 'grigio', 'la botola per chi ha finito la storia'],
  [10, 12, 'verde', 'la miniera, appena finita'],
  [16, 16, 'verde', 'la zona sveglia'],
  [16, 14, 'arancio', 'una zona del 16 al 14'],
  [16, 12, 'rosso', 'una zona del 16 al 12'],
  [16, 20, 'grigio', 'una zona del 16 al 20'],
]) uguale(`${perche}: ${colore}`, coloreDi(zona, eroe), colore)
uguale('ogni colore che non è verde ha chi lo dice', COLORI.filter(c => c !== 'verde' && !DETTI_DEL_COLORE[c]).join(), '')
controlla('la guardia della rossa non fa passare', /non ti faccio passare/.test(DETTI_DEL_COLORE.rosso.detto))

/* ══════════ 6. la roba attesa oltre la storia ══════════ */
{
  const a = new Corredo({ eroe: 'elfa', roba: robaAttesaA('elfa', 12), crescita: crescitaAttesaA('elfa', 12) })
  const b = new Corredo({ eroe: 'elfa', roba: robaAttesaA('elfa', 20), crescita: crescitaAttesaA('elfa', 20) })
  controlla('al 20 si picchia e si regge più che al 12', b.att > a.att && b.vitaConLaRoba > a.vitaConLaRoba,
            `${a.att}/${a.vitaConLaRoba} → ${b.att}/${b.vitaConLaRoba}`)
  uguale('con le pozioni dell\'abisso', robaAttesaA('elfa', 20).zaino.length, 6)
  nota(`elfa attesa: al 12 ⚔️${a.att} 🛡️${a.dif} ❤️${a.vitaConLaRoba}, al 20 ⚔️${b.att} 🛡️${b.dif} ❤️${b.vitaConLaRoba}`)
}

riassunto('le zone che si potenziano')
