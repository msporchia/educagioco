/* Le coppie di mostri (docs/sotterraneo/mostri.md): ogni discesa ha la sua coppia, scelta per ambientazione, e per strada ci sono
   solo quei due; una zona (la discesa dopo la storia, con un volto nuovo) tiene la sua coppia per sempre; l'abisso ha la coppia
   del suo tratto. La forza viene dal livello e non dalla specie: dentro una coppia i due costano più o meno lo stesso in
   risposte (entro il 15%), e il guardiano della chiave è un caporale della specie più dura.
   `node test/esegui.mjs sotterraneo-coppie --niente-build` */
import { CAMPAGNA, L_ABISSO, TRATTI_DELL_ABISSO, PIANI_PER_TRATTO, brancoDi, guardianoDi, guastiDellaCampagna, guastiDellaCoppia }
  from '../../src/giochi/sotterraneo/dati/campagna.js'
import { MOSTRI, CAPORALE, duraDellaCoppia, costoInRisposte, guastiDeiMostri } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { zonaPotenziata, ORDINE_DELLE_ZONE } from '../../src/giochi/sotterraneo/dati/zone.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { numeriAttesi } from '../../src/giochi/sotterraneo/motore/storia.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

controlla('i mostri non hanno guasti', guastiDeiMostri().length === 0, guastiDeiMostri().join(' · '))
controlla('le discese non hanno guasti', guastiDellaCampagna().length === 0, guastiDellaCampagna().join(' · '))

/* ══════════ 1. le sette coppie, per ambientazione ══════════ */
const ATTESE = {
  altare: ['scheletro', 'fantasma'], cantine: ['ratto', 'melma'], torre: ['pipistrello', 'vespa'], gallerie: ['lupo', 'fungo'],
  cisterna: ['granchio', 'serpente'], labirinto: ['orco', 'goblin'], fondo: ['golem', 'ratto'],
}
for (const t of CAMPAGNA) {
  stessaLista(`${t.chiave}: la sua coppia`, t.mostri, ATTESE[t.chiave])
  stessaLista(`${t.chiave}: brancoDi dice la stessa coppia a ogni piano`, [0, 1, 2].map(p => brancoDi(t, p).join()).filter((x, i, v) => v.indexOf(x) === i), [t.mostri.join()])
}
stessaLista('l\'abisso, per tratto', TRATTI_DELL_ABISSO.map(t => t.mostri), [['ratto', 'melma'], ['scheletro', 'fantasma'], ['golem', 'pipistrello']])
controlla('una specie può stare in due discese (il ratto nella scalinata e nella miniera), ma ogni discesa ha la sua coppia',
          new Set(CAMPAGNA.map(t => t.mostri.join())).size === CAMPAGNA.length)
controlla('nessun capo per strada', CAMPAGNA.every(t => t.mostri.every(k => !MOSTRI[k].capo)))
controlla('una coppia che non va è un guasto: un capo, una specie che non esiste, tre specie',
          guastiDellaCoppia('x', ['gigante', 'ratto']).length > 0 && guastiDellaCoppia('x', ['unicorno']).length > 0 &&
          guastiDellaCoppia('x', ['ratto', 'melma', 'goblin']).length > 0)

/* ══════════ 2. per strada ci sono solo loro ══════════
   Mostri di strada, branchi, appostati, caporali e il guardiano: nessun altro. Il grosso e quelli delle missioni hanno il loro nome */
const stradaDi = (tappa, semi = [3, 8, 21], piani = null) => {
  const visti = new Set()
  for (const seme of semi) {
    const c = new Corsa(tappa, { seme, rnd: seminato(seme) })
    for (let p = 0; p < (piani || Math.min(tappa.piani, 6)); p++) {
      c.piano = p
      c.nuovoPiano()
      for (const r of c.livello.robe) if (r.che === 'mostro' && !r.grosso && !r.missione) visti.add(r.tipo)
    }
  }
  return [...visti].sort()
}
for (const t of CAMPAGNA)
  stessaLista(`${t.chiave}: per strada solo la sua coppia`, stradaDi(t), [...t.mostri].sort())

/* ══════════ 3. una zona tiene la sua coppia, rinascendo ══════════ */
for (const [k, t] of CAMPAGNA.entries())
  for (const L of [6, 12, 20, 34, 61]) {
    const z = zonaPotenziata(k, L)
    stessaLista(`${t.chiave} zona al ${L}: la stessa coppia della discesa`, z.mostri, t.mostri)
  }
controlla('e le sette zone hanno sette coppie diverse', new Set(ORDINE_DELLE_ZONE.map(ch => CAMPAGNA.find(t => t.chiave === ch).mostri.join())).size === 7)
for (const k of [1, 4]) for (const L of [12, 40])
  stessaLista(`${CAMPAGNA[k].chiave} al ${L}, giocata: per strada solo la sua coppia`, stradaDi(zonaPotenziata(k, L), [5, 9], 5), [...CAMPAGNA[k].mostri].sort())

/* ══════════ 4. l'abisso: la coppia del tratto ══════════ */
{
  const fuori = []
  for (const seme of [7, 41]) {
    const c = new Corsa(L_ABISSO, { seme, rnd: seminato(seme) })
    for (let p = 0; p < PIANI_PER_TRATTO * TRATTI_DELL_ABISSO.length + 4; p++) {
      c.piano = p
      c.nuovoPiano()
      const coppia = brancoDi(L_ABISSO, p)
      for (const r of c.livello.robe)
        if (r.che === 'mostro' && !r.grosso && !coppia.includes(r.tipo)) fuori.push(`${r.tipo} al piano ${p + 1} (${coppia.join(' e ')})`)
    }
  }
  controlla('nell\'abisso per strada solo la coppia del tratto', !fuori.length, fuori.slice(0, 3).join(' · '))
}

/* ══════════ 5. la forza viene dal livello: il costo in risposte dentro una discesa ══════════
   Con la roba attesa di ogni eroe, i mostri di strada di una discesa costano entro il 15% uno dall'altro (ossa diviso quello che
   passa della difesa, `costoInRisposte`), a ogni piano. Sono i caporali e il grosso i picchi, non la specie */
{
  const male = []
  for (const [k, t] of CAMPAGNA.entries()) {
    if (t.mostri.length < 2 || k === 0) continue   // la cripta si scende a mani nude: la difesa pesa sull'attacco di 3
    for (const e of EROI) {
      const att = numeriAttesi(e.chiave, k).att
      const a = costoInRisposte(MOSTRI[t.mostri[0]], att), b = costoInRisposte(MOSTRI[t.mostri[1]], att)
      if (Math.max(a, b) / Math.min(a, b) > 1.15) male.push(`${t.chiave} ${e.chiave}: ${a.toFixed(2)} contro ${b.toFixed(2)}`)
    }
  }
  controlla('dentro una discesa le due specie costano entro il 15%, con la roba attesa di ogni eroe', !male.length, male.slice(0, 3).join(' · '))
  // e nel piano vero, con le ossa che crescono col livello: lo stesso rapporto, specie per specie
  const peggio = []
  for (const t of CAMPAGNA) {
    if (t.mostri.length < 2) continue
    const c = new Corsa(t, { seme: 11, rnd: seminato(11) })
    const media = {}
    for (const p of [0, t.piani - 1]) {
      c.piano = p; c.nuovoPiano()
      for (const r of c.livello.robe) if (r.che === 'mostro' && !r.grosso && !r.caporale && !r.chiave && t.mostri.includes(r.tipo))
        (media[`${p}|${r.tipo}`] = media[`${p}|${r.tipo}`] || []).push(r.ossa / MOSTRI[r.tipo].ossa)
    }
    for (const [chiave, v] of Object.entries(media)) if (new Set(v.map(x => x.toFixed(3))).size > 1) peggio.push(`${t.chiave} ${chiave}`)
  }
  controlla('a ogni piano tutti i mostri della stessa specie hanno le stesse ossa (la forza è del piano, non del singolo)', !peggio.length, peggio.slice(0, 3).join(' · '))
}

/* ══════════ 6. il guardiano e i caporali ══════════ */
for (const t of CAMPAGNA) {
  const dura = duraDellaCoppia(t.mostri)
  uguale(`${t.chiave}: il guardiano dei primi piani è la specie più dura della coppia`, guardianoDi(t, 0), t.piani > 1 ? dura : t.capo)
  controlla(`${t.chiave}: la più dura è una delle due`, t.mostri.includes(dura))
}
{
  const c = new Corsa(CAMPAGNA[3], { seme: 6, rnd: seminato(6) })
  const g = c.livello.robe.find(r => r.che === 'mostro' && r.chiave)
  const base = c.livello.mostro(g.tipo, 0, 0)
  controlla('il guardiano è un caporale: più ossa, un colpo in più, un nome', g.caporale && g.ossa === Math.round(base.ossa * CAPORALE.ossa) &&
            g.att === base.att + CAPORALE.att && /caporale$/.test(g.nome), JSON.stringify([g.caporale, g.ossa, base.ossa, g.att, g.nome]))
}

riassunto('le coppie di mostri')
