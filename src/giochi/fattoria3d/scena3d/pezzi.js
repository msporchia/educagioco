// I pezzi in scena: un gruppo per ogni cosa del motore (anche gli edifici: sono pezzi liberi), tenuti allineati a quello che il motore dice e
// animati ogni fotogramma (il grano che cresce, le pecore che vagano, la fontana, il fumo del forno, il pallone che parte).
// Non sa le regole: legge lo stato e disegna. I cartelli sugli edifici (cottura, casse pronte) sono qui; un edificio non comprato non si vede.
import * as THREE from 'three'
import { segna } from '../../../grafica/elementi3d.js'
import { creaCampo, aggiornaCampo, campoMosso, creaPasticceria, creaMongolfiera, creaBancarella, creaBacheca, creaFontana, creaRecinto, muoviPecore,
         sincronizzaPecore, creaPecora, creaGallina, creaMucca, creaMulino, creaPanificio, creaConserviera, creaGelateria, creaAiuola, creaPanchina,
         creaPozzo, creaSpaventapasseri, creaTrattore, creaSegnaposto, creaPollaio, creaStalla, creaCaseificio, sincronizzaBestie, muoviBestie } from './modelli.js'
import { creaPonte, creaPasserella, creaTavolo } from './modelli-passaggi.js'
import { creaStagno } from './modelli-acqua.js'
import { creaZuccherificio, creaTelaio, creaSartoria, creaTintoria, creaFienileMacchina, creaFriggitoria, creaSushiBar } from './modelli-macchine.js'
import { creaMolo, creaPorticciolo } from './modelli-pesca.js'
import { creaBottegaPasticceria, creaBottegaOsteria, creaBottegaMensa, creaBottegaMerceria } from './modelli-botteghe.js'
import { eBottega } from '../dati/botteghe.js'
import { creaStagnoAnatre, creaPorcile, creaRecintoCapre, creaPentolone, creaAnatra, creaMaiale, creaCapra } from './modelli-cortile.js'
import { creaConigliera, creaRecintoAlpaca, creaRecintoAsini, creaApiario } from './modelli-cortile2.js'
import { creaZucca, creaZucche, creaPupazzo } from './modelli-feste.js'
import { DECORI_CREA } from './modelli-decori.js'
import { NATALE_CREA } from './modelli-natale.js'
import { EDIFICI, PEZZI } from '../dati/catalogo.js'
import { RICETTE, MACCHINE, merceDi } from '../dati/ricette.js'
import { SALITA_MS } from '../dati/mongolfiera.js'
import { ANIMALI, CORTILE, prodottoDelleBestie } from '../dati/animali.js'
import { alleggeriOmbre } from './ottimizza.js'
import { BancoCampi } from './campi-istanze.js'
import { BancoStatici, STATICI } from './statici-istanze.js'
import { tempoBreve } from '../dati/tempo.js'

import { creaSiloRosso, creaSiloBianco, creaDispensa, cresciMagazzino } from './modelli-magazzini.js'

const CREA = {
  campo: () => creaCampo(Math.random() * 99 + 1),
  recinto: c => creaRecinto(c && c.pecore),
  pollaio: c => creaPollaio(c && c.bestie),
  stalla: c => creaStalla(c && c.bestie),
  anatre: c => creaStagnoAnatre(c && c.bestie),
  porcile: c => creaPorcile(c && c.bestie),
  capre: c => creaRecintoCapre(c && c.bestie),
  conigliera: c => creaConigliera(c && c.bestie),      // il secondo cortile (giro G5): scena3d/modelli-cortile2.js
  alpaca: c => creaRecintoAlpaca(c && c.bestie),
  asini: c => creaRecintoAsini(c && c.bestie),
  arnie: c => creaApiario(c && c.bestie),
  bancarella: () => creaBancarella(),
  bacheca: () => creaBacheca(),
  fontana: () => creaFontana(),
  aiuola: () => creaAiuola(),
  panchina: () => creaPanchina(),
  pozzo: () => creaPozzo(),
  spaventapasseri: () => creaSpaventapasseri(),
  trattore: () => creaTrattore(),
  silo: () => creaSiloRosso(), silo_bianco: () => creaSiloBianco(), dispensa: () => creaDispensa(),      // i magazzini, che crescono (modelli-magazzini.js)
  ponte: () => creaPonte(),
  passerella: () => creaPasserella(),
  tavolo: () => creaTavolo(),
  stagno: () => creaStagno(PEZZI.stagno.w, PEZZI.stagno.d),
  laghetto: () => creaStagno(PEZZI.laghetto.w, PEZZI.laghetto.d),
  molo: () => creaMolo(PEZZI.molo.w, PEZZI.molo.d),
  molo_v: () => creaMolo(PEZZI.molo_v.w, PEZZI.molo_v.d),
  porticciolo: () => creaPorticciolo(),
  zucca_intagliata: () => creaZucca(),
  zucche_mucchio: () => creaZucche(),
  pupazzo_neve: () => creaPupazzo(),
  ...NATALE_CREA,                    // gli alberi grandi e le feste di Natale (modelli-natale.js)
  ...DECORI_CREA,                    // le decorazioni portate dalla 2D (giro G8): verde, recinti, raccolto, case, bestiole (modelli-decori*.js)
}
const CREA_EDIFICIO = {
  pasticceria: creaPasticceria, mongolfiera: creaMongolfiera,
  mulino: creaMulino, panificio: creaPanificio, conserviera: creaConserviera, gelateria: creaGelateria, caseificio: creaCaseificio,
  telaio: creaTelaio, zuccherificio: creaZuccherificio, sartoria: creaSartoria, tintoria: creaTintoria,
  friggitoria: creaFriggitoria, sushi_bar: creaSushiBar,
  pentolone: creaPentolone,
  bottega_pasticceria: creaBottegaPasticceria, bottega_osteria: creaBottegaOsteria, bottega_mensa: creaBottegaMensa, bottega_merceria: creaBottegaMerceria,      // le botteghe del paese (docs/fattoria3d/botteghe.md)
  fienile: creaFienileMacchina,                       // la macchina del mangime (l'unico fienile: quello di scena è stato tolto)
}
/** Un tipo senza disegno non rompe la scena: una scatola grigia della sua misura. */
const modelloDi = (tipo, d, c) => (CREA[tipo] ? CREA[tipo](c) : CREA_EDIFICIO[tipo] ? CREA_EDIFICIO[tipo]() : creaSegnaposto(d.w, d.d))

export const centroDi = (c, d) => new THREE.Vector3(c.i + d.w / 2, 0, c.j + d.d / 2)

export class Pezzi {
  constructor(scena, motore, effetti, vista, qualita) {
    this.scena = scena; this.m = motore; this.fx = effetti; this.vista = vista; this.q = qualita
    this.voci = new Map()           // id (numero) o tipo (edificio) → voce
    this.tFumo = 0
    this.usaBanchi = true       // falso (poi `via()` e `sincronizza()`) rifà le istanze sciolte come prima, per i confronti (docs/fattoria3d/scena.md, «Misura»)
    this.statici = new BancoStatici(scena)  // i pezzi fermi (aiuole, panchine…): una mesh per geometria e materiale (statici-istanze.js)
    this.banco = new BancoCampi(scena)    // le piante di tutti i campi: una mesh per forma (campi-istanze.js)
    this.sulCompraBestia = null     // la porta verso il pulsante «＋» dei cartelli: la mette il mondo (scena3d/azioni.js `compraBestia`)
    this.sincronizza()
  }

  /** Allinea i gruppi alle cose del motore: ne crea di nuovi, toglie quelli spariti. Un edificio è una cosa come le altre. */
  sincronizza() {
    const vivi = new Set()
    for (const c of this.m.cose) {
      vivi.add(c.id)
      if (!this.voci.has(c.id)) this._creaCosa(c)
      else if (c.pecore) sincronizzaPecore(this.voci.get(c.id).grp, c.pecore)
      else if (c.bestie) sincronizzaBestie(this.voci.get(c.id).grp, c.bestie)
    }
    for (const id of [...this.voci.keys()]) if (!vivi.has(id)) this._togli(id)
    // ciò che si è mosso: la posizione la dice il motore
    for (const c of this.m.cose) {
      const v = this.voci.get(c.id); if (!v) continue
      const rot = c.rot || 0
      if (v.rot !== rot) { v.rot = rot; v.d = this.m.misureCosa(c); v.grp.rotation.y = rot * Math.PI / 2 }          // girata: il disegno gira attorno al centro dell'impronta
      if (!v.nasce) v.grp.position.copy(centroDi(c, v.d))
    }
  }

  _creaCosa(c) {
    const d = this.m.misureCosa(c), edificio = !!EDIFICI[c.tipo], grp = modelloDi(c.tipo, d, c)
    alleggeriOmbre(grp)
    if (this.usaBanchi && c.tipo === 'campo') this.banco.adotta(grp)
    grp.userData.bersaglio = { kind: 'cosa', id: c.id }
    grp.position.copy(centroDi(c, d)); grp.rotation.y = (c.rot || 0) * Math.PI / 2; this.scena.add(segna(grp, edificio ? 'edifici' : c.tipo === 'campo' ? 'campi' : 'pezzi'))
    if (this.usaBanchi && STATICI.has(c.tipo)) this.statici.adotta(grp)
    const badge = edificio || c.tipo === 'bacheca' ? this.fx.nuovoBadge() : c.bestie || c.pecore ? this.fx.nuovoCartello(() => this.sulCompraBestia && this.sulCompraBestia(c.id), c.tipo) : null
    this.voci.set(c.id, { id: c.id, kind: 'cosa', edificio, tipo: c.tipo, c, d, rot: c.rot || 0, grp, badge, anello: null, salto: 0, nasce: undefined, richiamo: null, chiave: '' })
  }
  _togli(id) {
    const v = this.voci.get(id); if (!v) return
    this.scena.remove(v.grp); v.badge?.togli(); this.banco.lascia(v.grp); this.statici.lascia(v.grp)
    if (v.anello) this.scena.remove(v.anello)
    this.voci.delete(id)
  }

  /** I compiti del riscaldamento (scaldo-puro.js): costruire in tempo morto i modelli che servono presto e non sono ancora in scena. I più
      urgenti per primi: il campo, il recinto, il pollaio e la stalla con le loro bestie, poi il resto dei pezzi e dei creatori di
      bestie, infine gli edifici (non sono in scena finché non si comprano: il primo costruito non deve pagare il modello). Una fila di funzioni, ognuna costruisce e butta un'istanza. */
  compitiScaldo() {
    const pezzi = ['campo', 'recinto', 'pollaio', 'stalla', 'anatre', 'porcile', 'capre', 'aiuola', 'panchina', 'pozzo', 'fontana', 'spaventapasseri', 'ponte', 'passerella', 'tavolo', 'bancarella', 'bacheca', 'stagno', 'laghetto', 'molo', 'molo_v', 'porticciolo', 'zucca_intagliata', 'zucche_mucchio', 'pupazzo_neve']
    const fai = tipo => ({ nome: tipo, fai: () => { if (PEZZI[tipo]) modelloDi(tipo, PEZZI[tipo], CORTILE[tipo] ? { pecore: [], bestie: [] } : undefined) } })
    return [...pezzi.slice(0, 4).map(fai), { nome: 'pecora', fai: () => creaPecora() }, { nome: 'gallina', fai: () => { creaGallina(0); creaGallina(1) } },
            { nome: 'mucca', fai: () => { creaMucca(0); creaMucca(1) } },
            { nome: 'anatra', fai: () => { creaAnatra(0); creaAnatra(1) } }, { nome: 'maiale', fai: () => { creaMaiale(0); creaMaiale(1) } }, { nome: 'capra', fai: () => { creaCapra(0); creaCapra(1) } }, ...pezzi.slice(4).map(fai), ...Object.keys(EDIFICI).filter(t => CREA_EDIFICIO[t]).map(t => ({ nome: t, fai: () => CREA_EDIFICIO[t]() }))]
  }

  /** Il modello di un pezzo di quel tipo, per il fantasma di chi lo sta trascinando. */
  modello(tipo, c) { return modelloDi(tipo, this.m.misure(tipo), c) }

  /** Il modello per l'anteprima del menu (anteprime.js): un pezzo o un edificio, disposto com'è «a regime» — il campo maturo, il
      recinto con due pecore, pollaio e stalla con due bestie. Fermo a un istante: niente animazione. */
  modelloAnteprima(tipo) {
    const d = PEZZI[tipo]
    if (d) {
      const adulte = [{ eta: 'adulta', t0: 0 }, { eta: 'adulta', t0: 0 }], bestie = [{ fine: null }, { fine: null }]
      const g = tipo === 'campo' ? creaCampo(7) : modelloDi(tipo, d, { pecore: adulte, bestie })
      if (tipo === 'campo') aggiornaCampo(g, [1, 1, 1, 1], 0, 'grano', false)
      return g
    }
    const e = EDIFICI[tipo]; if (!e) return null
    return CREA_EDIFICIO[tipo] ? CREA_EDIFICIO[tipo]() : creaSegnaposto(e.w, e.d)
  }

  /** Un pezzo appena messo: compare con un piccolo rimbalzo. */
  fanNascere(id) { const v = this.voci.get(id); if (v) { v.nasce = 0; v.grp.scale.setScalar(0.01) } }
  salta(id) { const v = this.voci.get(id); if (v) v.salto = 0.5 }
  richiama(id, verso) { const v = this.voci.get(id); if (v) v.richiamo = verso }
  nascondi(id, si) { const v = this.voci.get(id); if (v) v.grp.visible = !si }
  gruppi() { return [...this.voci.values()].map(v => v.grp) }
  voce(id) { return this.voci.get(id) }
  centroDi(bersaglio) {
    const c = bersaglio.kind === 'cosa' ? this.voci.get(bersaglio.id).c : this.m.cosaDi(bersaglio.tipo)      // `{ kind: 'edificio', tipo }`: l'edificio di quel tipo
    return centroDi(c, this.m.misureCosa(c))
  }

  /** L'anello giallo attorno a ciò che è in coda: sta sul terreno, non gira per lo schermo. */
  segnaCoda(id, si) {
    const v = this.voci.get(id); if (!v) return
    if (si && !v.anello) {
      const r = Math.max(v.d.w, v.d.d) * 0.62
      v.anello = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.12, 28), new THREE.MeshBasicMaterial({ color: 0xffc830, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }))
      v.anello.rotation.x = -Math.PI / 2; v.anello.position.y = 0.2; v.grp.add(v.anello)
    }
    if (v.anello) v.anello.visible = !!si
  }

  aggiorna(dt, tt) {
    const adesso = this.m.ora()
    for (const v of this.voci.values()) {
      const g = v.grp
      this._nasceESalta(v, g, dt)
      if (v.edificio) this._edificio(v, g, dt, tt, adesso)
      else this._cosa(v, g, dt, tt, adesso)
      if (v.badge && !v.badge.el.hidden && g.visible) {
        const [x, y, visto] = this.vista.proietta(g.position, g.userData.altezza || 1.6)
        v.badge.metti(x, y, visto)
      } else if (v.badge && !g.visible) { v.badge.el.style.visibility = 'hidden'; v.badge.visto = false }      // un pezzo sollevato non lascia il suo cartello (e il suo «＋») a mezz'aria
    }
    const f = this.vista.frustum ? this.vista.frustum() : null            // ciò che sta fuori dall'inquadratura (con un margine) non si disegna: un'istanza non si taglia da sola
    this.banco.aggiorna(f); this.statici.aggiorna(f)
  }

  /** Il campo che il raggio colpisce con una sua pianta (le piante non sono più figlie del gruppo del campo): `{ distance, bersaglio }` o null. */
  colpisciPiante(raggio) {
    const hit = raggio.intersectObjects(this.banco.meshes(), false)[0]
    const g = hit && this.banco.campoDi(hit.object, hit.instanceId)
    return g ? { distance: hit.distance, bersaglio: g.userData.bersaglio } : null
  }

  /** Il rimbalzo di un pezzo appena messo e il saltello di un tocco: per ogni cosa, edifici compresi. */
  _nasceESalta(v, g, dt) {
    if (v.nasce !== undefined) {
      v.nasce = Math.min(1, v.nasce + dt * 3); const s = 1 + Math.sin(v.nasce * Math.PI) * 0.15
      g.scale.setScalar(Math.max(0.01, v.nasce * s))
      if (v.nasce >= 1) { g.scale.setScalar(1); v.nasce = undefined }
    }
    if (v.salto) { v.salto -= dt * 1.2; g.position.y = Math.max(0, Math.sin(v.salto * Math.PI * 2)) * 0.18; if (v.salto <= 0) { v.salto = 0; g.position.y = 0 } }
  }

  _cosa(v, g, dt, tt, adesso) {
    const c = v.c
    if (g.userData.altezzaPiena) return void cresciMagazzino(g, this.m.tagliaDi(c))          // un magazzino: grande quanto è stato ingrandito
    if (c.tipo === 'campo') {
      if (!this.banco.visto(g)) { v.chiave = null; return }          // fuori dall'inquadratura (o sollevato): non si ripone, e al ritorno si rifà
      const cr = this.m.crescita(c), chiave = cr.map(x => x.toFixed(2)).join(), col = c.coltura || 'grano'
      if (this.q.vento || chiave !== v.chiave || campoMosso(g)) { v.chiave = chiave; aggiornaCampo(g, cr, tt, col, this.q.vento) }
    } else if (c.tipo === 'recinto') {
      muoviPecore(g, dt, tt, v.richiamo, c.pecore, adesso); v.richiamo = null
      const lana = this.m.lanaPronta(c).length
      const fame = c.pecore.some(p => p.eta === 'adulta' && p.t0 == null)
      v.badge.imposta(lana ? `🧶 ${lana} pront${lana === 1 ? 'a' : 'e'}!` : fame ? '🐑 ha fame' : '', lana ? 'pronto' : '')
      this._conto(v, c)
    } else if (c.bestie) {
      muoviBestie(g, dt, tt, c.bestie, adesso)
      // il cartello del cortile: quanto c'è da raccogliere, oppure i secondi che mancano, oppure che hanno fame
      const A = ANIMALI[c.tipo], pronte = c.bestie.filter(b => b.fine !== null && b.fine <= adesso).length
      const lavora = c.bestie.filter(b => b.fine !== null && b.fine > adesso).map(b => b.fine - adesso)
      const fame = c.bestie.some(b => b.fine === null)
      v.badge.imposta(pronte ? `${prodottoDelleBestie(A.prodotto).emoji} ${pronte} pront${pronte === 1 ? 'o' : 'i'}!`
        : fame ? `${A.emoji} ha fame` : lavora.length ? `⏳ ${tempoBreve(Math.min(...lavora))}` : '', pronte ? 'pronto' : '')
      this._conto(v, c)
    } else if (c.tipo === 'bacheca') {
      // i foglietti sono gli ordini aperti; sul cartello quelli che si possono consegnare adesso (come le macchine, i pronti)
      if (tt - (v.tOrdini ?? -9) > 0.5) {
        v.tOrdini = tt
        const aperti = this.m.ordini().filter(o => !o.attesa), pronti = aperti.filter(o => o.pronto).length
        g.userData.mostraFogli(Math.min(aperti.length, g.userData.fogli.length), aperti.map(o => o.tipo))
        v.badge.imposta(pronti ? `🧺 ${pronti} pront${pronti === 1 ? 'o' : 'i'}!` : '', pronti ? 'pronto' : '')
      }
    } else if (g.userData.anima) g.userData.anima(tt)              // fontana, spaventapasseri
  }

  /** Il prezzo sul pulsante del cartello; il pulsante è spento (grigio, ma tocca) se mancano monete. */
  _conto(v, c) {
    const q = this.m.infoBestie(c)
    v.badge.bestie(q, !q.pieno && this.m.monete() < q.prezzo)
  }

  _edificio(v, g, dt, tt, adesso) {
    const s = this.m.s
    if (MACCHINE[v.tipo]) {
      // ogni macchina: pronti da ritirare, oppure la cottura in corso e i posti occupati
      const Q = s.macchine[v.tipo], posti = Math.max(this.m.postiDi(v.tipo), Q.coda.length)
      if (g.userData.gira) g.userData.gira.rotation.y += dt * 0.8
      if (g.userData.anima) g.userData.anima(dt, tt)
      const cuoce = Q.coda.length > 0, cadenza = cuoce ? 0.35 : v.tipo === 'pasticceria' ? Infinity : 0.6   // gli altri fumano anche a riposo
      if (g.userData.fumo && tt - (v.tFumo || 0) > cadenza) { v.tFumo = tt; this.fx.fumata(g.position.clone().add(g.userData.fumo.clone().applyQuaternion(g.quaternion))) }
      const pronti = this.m.prontiIn(v.tipo), prima = Object.keys(Q.pronti).find(k => Q.pronti[k] > 0)
      v.badge.imposta(pronti ? `${merceDi(prima).emoji} ${pronti} pront${pronti === 1 ? 'o' : 'i'}!`
        : cuoce ? `🔥 ${tempoBreve(Math.max(0, (Q.coda[0].fine || adesso) - adesso))} · ${Q.coda.length}/${posti}` : '', pronti ? 'pronto' : '')
    } else if (eBottega(v.tipo)) {
      // una bottega non lavora: un dettaglio che si muove piano, e il cartello coi clienti che hanno già la loro roba
      if (g.userData.anima) g.userData.anima(dt, tt)
      if (tt - (v.tNave ?? -9) > 0.5) {
        v.tNave = tt
        const n = this.m.bottegaPronta(v.tipo)
        v.badge.imposta(n ? `${EDIFICI[v.tipo].emoji} ${n} pront${n === 1 ? 'o' : 'i'}!` : '', n ? 'pronto' : '')
      }
    } else if (v.tipo === 'mongolfiera') {
      // da ferma sale e scende piano; a tutto pieno (o con «Parti!») sale in alto e si allontana, e torna prima della fine del riposo
      const M = s.mongolfiera, volo = g.userData.volo
      let y = Math.sin(tt * 1.3) * 0.08, x = 0
      if (M.riposo !== null) {
        const q = Math.max(0, Math.min(1, (adesso - (M.via ?? adesso)) / SALITA_MS, (M.riposo - adesso) / SALITA_MS))
        const dolce = q * q * (3 - 2 * q); y += dolce * 40; x = dolce * 18
        volo.visible = q < 0.995
      } else volo.visible = true
      volo.position.set(x, y, 0); volo.rotation.z = Math.sin(tt * 0.9) * 0.02 + (M.riposo !== null ? x * 0.004 : 0)
      g.userData.fiamma.scale.set(1, 1.2 + Math.sin(tt * 14) * 0.4, 1)
      if (tt - (v.tNave ?? -9) > 0.5) {                        // il cartello: le casse che si possono riempire adesso, oppure il viaggio
        v.tNave = tt
        const nave = this.m.vistaMongolfiera()
        v.badge.imposta(nave.stato === 'viaggio' ? `🎈 in viaggio · ${Math.floor(Math.ceil(nave.restoMs / 1000) / 60)}:${String(Math.ceil(nave.restoMs / 1000) % 60).padStart(2, '0')}`
          : nave.pronte ? `🎈 ${nave.pronte} cass${nave.pronte === 1 ? 'a pronta' : 'e pronte'}!` : '', nave.stato !== 'viaggio' && nave.pronte ? 'pronto' : '')
      }
    }
  }

  via() { for (const id of [...this.voci.keys()]) this._togli(id); this.banco.via(); this.statici.via() }
}
