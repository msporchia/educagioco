/* LE STAGIONI DELLA FATTORIA, SENZA BROWSER

   Le cose che questo file difende:
     1. **le finestre sono in data locale e hanno i bordi giusti** —
        il primo e l'ultimo giorno sono dentro, il giorno prima e il
        giorno dopo fuori, e Natale scavalca il capodanno;
     2. **gli addobbi effimeri sono deterministici nel giorno** — stesse
        celle con lo stesso seme, altre con un altro — e cadono solo su
        celle libere e su tetti di cose alte;
     3. **una voce stagionale non è un premio di livello**: non sta
        nella fila dei due-tre per livello, non si reclama, si posa lo
        stesso, e un salvataggio con dentro una zucca si riapre a marzo.
   `node test/esegui.mjs stagioni --niente-build` */
import {
  FINESTRE, stagioneDi, semeDelGiorno, addobbiStagionali, guastiDelleStagioni,
} from '../../src/giochi/fattoria/dati/stagioni.js'
import { CATALOGO, CATEGORIE, PER_ID } from '../../src/giochi/fattoria/dati/catalogo.js'
import { roba, ULTIMO, livelloDellaVoce } from '../../src/giochi/fattoria/dati/livelli.js'
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. le finestre ══════════ */
uguale('la tabella è pulita', guastiDelleStagioni().join('; '), '')
uguale('un giorno di settembre non è niente', stagioneDi(new Date(2026, 8, 21)), null)

const D = (anno, [m, d]) => new Date(anno, m - 1, d, 23, 30)   // sera tardi, ora locale
const ieri = x => new Date(x.getTime() - 86400e3)
const domani = x => new Date(x.getTime() + 86400e3)
for (const [nome, f] of Object.entries(FINESTRE)) {
  const da = D(2026, f.da)
  /* la fine può stare nell'anno dopo */
  const a = D(f.a[0] < f.da[0] ? 2027 : 2026, f.a)
  uguale(`${nome}: il primo giorno è dentro`, stagioneDi(da), nome)
  uguale(`${nome}: l'ultimo giorno è dentro`, stagioneDi(a), nome)
  uguale(`${nome}: il giorno prima è fuori`, stagioneDi(ieri(da)), null)
  uguale(`${nome}: il giorno dopo è fuori`, stagioneDi(domani(a)), null)
}
uguale('Natale scavalca il capodanno: la notte di San Silvestro',
       stagioneDi(new Date(2026, 11, 31, 23, 59)), 'natale')
uguale('e il primo dell\'anno', stagioneDi(new Date(2027, 0, 1, 0, 1)), 'natale')
/* La data è **locale**: alle 23:30 del 6 gennaio a Roma in UTC è già il
   7 — se `stagioneDi` leggesse in UTC, la Befana sarebbe già finita. */
controlla('il seme del giorno cambia a mezzanotte e non prima',
          semeDelGiorno(new Date(2026, 11, 24, 23, 59)) !== semeDelGiorno(new Date(2026, 11, 25, 0, 1))
          && semeDelGiorno(new Date(2026, 11, 24, 0, 1)) === semeDelGiorno(new Date(2026, 11, 24, 23, 59)))

/* ══════════ 2. gli addobbi effimeri ══════════ */
{
  const libere = []
  for (let x = 0; x < 12; x++) for (let y = 0; y < 12; y++) libere.push([x, y])
  const edifici = [
    { x: 3, y: 3, w: 4, h: 2, alto: 5 },     // una casa
    { x: 8, y: 8, w: 1, h: 1, alto: 1 },     // una panchina: nessun tetto
  ]
  const oggi = addobbiStagionali('halloween', { libere, edifici, seme: 20261025 })
  const ancora = addobbiStagionali('halloween', { libere, edifici, seme: 20261025 })
  const domaniA = addobbiStagionali('halloween', { libere, edifici, seme: 20261026 })
  const chiavi = l => l.map(a => a.testo + '@' + a.x + ',' + a.y).sort().join(' ')
  uguale('stesso giorno, stesse zucche', chiavi(oggi), chiavi(ancora))
  controlla('domani sono in altre celle', chiavi(oggi) !== chiavi(domaniA))
  const zucche = oggi.filter(a => a.testo === '🎃')
  controlla(`ci sono delle zucche (${zucche.length})`, zucche.length >= 2 && zucche.length <= 12)
  const libereK = new Set(libere.map(([x, y]) => x + ',' + y))
  controlla('e stanno tutte su celle libere',
            zucche.every(a => libereK.has(Math.floor(a.x) + ',' + Math.floor(a.y))))
  const suiTetti = oggi.filter(a => a.testo !== '🎃')
  controlla('ragnatele e pipistrelli solo sulla casa, mai sulla panchina',
            suiTetti.every(a => a.x >= 3 && a.x <= 7 && a.y < 3))
  controlla('ogni addobbo ha una misura in pixel dello sprite',
            oggi.every(a => a.misura > 0 && typeof a.testo === 'string'))

  const natale = addobbiStagionali('natale', { libere, edifici, seme: 20261225 })
  controlla('a Natale sul tetto della casa c\'è una stella o una campanella',
            natale.some(a => (a.testo === '⭐' || a.testo === '🔔') && a.y < 3))
  controlla('e un alberello accanto alla casa, per terra',
            natale.some(a => a.testo === '🎄' && (Math.floor(a.x) === 7 || Math.floor(a.x) === 2)
                             && Math.floor(a.y) === 4))
  uguale('senza stagione, niente', addobbiStagionali(null, { libere, edifici, seme: 1 }).length, 0)
  uguale('con una stagione che non esiste, niente',
         addobbiStagionali('pasqua', { libere, edifici, seme: 1 }).length, 0)
  uguale('senza celle libere, niente zucche',
         addobbiStagionali('halloween', { libere: [], edifici: [], seme: 1 }).length, 0)
}

/* ══════════ 3. le voci stagionali del catalogo ══════════ */
{
  const stagionali = CATALOGO.filter(v => v.stagione)
  controlla(`in catalogo ci sono voci stagionali (${stagionali.length})`, stagionali.length >= 3)
  controlla('e ce n\'è per ogni stagione',
            Object.keys(FINESTRE).every(s => stagionali.some(v => v.stagione === s)))
  controlla('costano come una cosetta (🪙6–30, CALIBRAZIONE.md)',
            stagionali.every(v => v.prezzo >= 6 && v.prezzo <= 30))
  /* non entrano nella fila dei due-tre per livello: nessun livello le
     porta come premio */
  const premiate = new Set()
  for (let l = 1; l <= ULTIMO; l++) for (const v of roba(l).cose) premiate.add(v.id)
  controlla('nessun livello le porta come premio', stagionali.every(v => !premiate.has(v.id)))
  const feste = CATEGORIE.find(c => c.stagionale)
  controlla('la linguetta delle feste non è annunciata come scaffale nuovo',
            !!feste && ![...Array(ULTIMO + 1).keys()].some(l => roba(l).schede.includes(feste)))

  /* una fattoria nuova, senza aver preso nessun premio, posa una zucca:
     il cancello è la finestra, e lo tiene il baule */
  const f = new Fattoria({ borsa: borsaInfinita() })
  const zucca = stagionali.find(v => v.stagione === 'halloween')
  controlla('una voce stagionale risulta sbloccata senza premio', f.sbloccata(zucca.id))
  const r = f.posa(zucca.id, 20, 20)
  controlla('e si posa', r.ok, r.motivo)
  uguale('mentre una decorazione di sempre no', f.posa('panchina', 24, 24).motivo, 'non-sbloccato')
  /* e a marzo è ancora lì */
  const marzo = new Fattoria({ borsa: borsaInfinita(), dato: f.serializza() })
  controlla('un salvataggio con la zucca posata si riapre con la zucca',
            marzo.cose.some(c => c.id === zucca.id))
  nota(`stagionali: ${stagionali.map(v => `${v.id} 🪙${v.prezzo} (${v.stagione})`).join(' · ')}`)
  nota(`livelloDellaVoce(zucca) = ${livelloDellaVoce(PER_ID[zucca.id])}`)
}

riassunto()
