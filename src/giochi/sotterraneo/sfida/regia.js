// Il sotterraneo in due, quello che il gioco dà al pezzo comune (src/insieme/, docs/core/insieme.md): la regola dell'incontro (la
// proposta di chi crea, l'eroe di ognuno) e il motore del lockstep attorno alla discesa (docs/sotterraneo/in-due.md). Non sa di rete
// né di schermi.
import { Corsa } from '../motore/corsa.js'
import { Corredo } from '../motore/corredo.js'
import { tappaDelMondo } from '../motore/rigenera.js'
import { livelloDellaCoppia } from '../motore/forza.js'
import { FETTA } from '../motore/banco-in-due.js'
import { VERSIONE_SFIDA, firmaDeiDati, mossaValida, improntaDi, impronteSimili, proponi, accetta, accettaParte, parteDi } from './protocollo.js'
import { fotoDellaDiscesa, rimettiLaDiscesa } from './foto.js'

/* chi ha creato è il primo alleato, l'ospite il secondo: il mondo è uno solo */
export const alleatoDi = ruolo => (ruolo === 'host' ? 0 : 1)

/* il caso della discesa, col suo stato da fotografare (`stato()` lo legge, `stato(s)` lo rimette) */
export function casoConStato(seme) {
  let s = (seme >>> 0) || 1
  const f = () => {
    s ^= s << 13; s >>>= 0
    s ^= s >> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
  f.stato = v => (v === undefined ? s : (s = v >>> 0))
  return f
}

/* la discesa dalla proposta e dagli eroi: il posto al livello della coppia con la difficoltà, il seme di chi crea */
export function discesaDi({ seme, chiave, difficolta }, { host, ospite }) {
  const corredi = [host, ospite].map(p => { const c = new Corredo({ eroe: p.eroe, roba: p.roba, crescita: p.crescita }); c.sistemaIlCorredo(); return c })
  const livello = livelloDellaCoppia(corredi, difficolta)
  const tappa = { ...tappaDelMondo(chiave, { eroe: host.eroe, livello }), seme }
  const corsa = new Corsa(tappa, { seme, rnd: casoConStato(seme * 7 + 3), eroe: host.eroe, roba: host.roba, crescita: host.crescita, botti: true, copricapi: true })
  corsa.persona.nome = host.nome
  corsa.aggiungiAlleato({ eroe: ospite.eroe, roba: ospite.roba, crescita: ospite.crescita, nome: ospite.nome })
  return corsa
}

/* un cambio all'albero o alle tasche: quello che sale col tetto (Cuore saldo, l'intelligenza) arriva subito, come fa la vista da soli */
function sullAlbero(corsa, fai) {
  const vita = corsa.vitaMax, energia = corsa.energiaMax
  const e = fai()
  if (e) {
    corsa.vita = Math.min(corsa.vitaMax, corsa.vita + Math.max(0, corsa.vitaMax - vita))
    corsa.energia = Math.min(corsa.energiaMax, corsa.energia + Math.max(0, corsa.energiaMax - energia))
  }
  return e
}

/* una mossa dell'alleato `i`: quello che il dito ha chiesto, se adesso si può ancora. Torna quello che torna il motore (l'esito di una
   risposta, di un sorso…), che la vista racconta */
export function eseguiMossa(corsa, i, [azione, a, b, c]) {
  return corsa.come(i, () => {
    const f = corsa.foglio
    const che = f && f.che
    const scontro = che === 'scontro', mio = scontro && !corsa.nonTocca(f)
    switch (azione) {
      case 'vai': return f ? null : corsa.vaiVerso({ x: a, y: b }, !!c)
      case 'rispondi': return corsa.chiesta && corsa.chiesta.id === a ? corsa.rispondi(!!b) : null
      case 'scendi': return che === 'scala' ? corsa.scendi() : null
      case 'sali': return che === 'scala-su' ? corsa.sali() : null
      case 'nonAspetto': return corsa.nonAspettoPiu()
      case 'chiudi': return f && !['scontro', 'aspetta', 'svenuto'].includes(che) ? corsa.chiudi() : null
      case 'riprendi': return che === 'svenuto' ? corsa.riprendi() : null
      case 'continua': return mio ? corsa.continua() : null
      case 'bersaglio': return scontro && f.campo[a] ? corsa.scegliBersaglio(f.campo[a]) : null
      case 'prepara': return mio ? corsa.prepara(a || null) : null
      case 'bevi': return scontro ? (mio ? corsa.beviNelloScontro(a) : null) : f ? null : corsa.usa(a)
      case 'beviEnergia': return mio ? corsa.beviEnergiaNelloScontro() : null
      case 'usa': return f ? null : corsa.usa(a, b || null)
      case 'butta': return f ? null : corsa.butta(a)
      case 'riponi': return f ? null : corsa.riponi(a)
      case 'indossa': return f ? null : corsa.indossaDallaTasca(a, b || null)
      case 'pergamena': return f ? null : corsa.apriLaPergamena(a)
      case 'impara': return sullAlbero(corsa, () => corsa.impara(a))
      case 'casella': return sullAlbero(corsa, () => corsa.mettiInCasella(a, b || null))
      case 'punto': return sullAlbero(corsa, () => corsa.daiUnPunto(a))
      case 'tasca': return sullAlbero(corsa, () => corsa.compraTasca())
      case 'riassegna': return sullAlbero(corsa, () => corsa.riassegnaPunti())
      case 'dimentica': return sullAlbero(corsa, () => corsa.dimenticaAlbero())
    }
    return null
  })
}

/* il motore del lockstep attorno alla discesa; `guarda(ruolo)`: l'alleato che la vista di questo telefono legge. Mentre il motore
   lavora `corsa.inMotore` è acceso: le azioni chiamate dalla vista diventano mosse solo quando è spento (sfida/vista.js).
   `osserva({ prima, dopo })`: la vista vuole sapere di ogni mossa fatta, `prima()` appena prima, `dopo(i, mossa, esito, cosaPrima)` */
export function motoreDi(corsa) {
  let locale = 0, occhio = null
  const nelMotore = fai => { corsa.inMotore = (corsa.inMotore || 0) + 1; try { return fai() } finally { corsa.inMotore-- } }
  return {
    partita: corsa,
    passo: FETTA,
    avanza: () => nelMotore(() => corsa.passo(FETTA)),
    applica: (ruolo, mossa) => {
      const prima = occhio && occhio.prima ? occhio.prima() : null
      const esito = nelMotore(() => eseguiMossa(corsa, alleatoDi(ruolo), mossa))
      if (occhio && occhio.dopo) occhio.dopo(alleatoDi(ruolo), mossa, esito, prima)
    },
    osserva: o => { occhio = o },
    valida: mossaValida,
    impronta: () => improntaDi(corsa),
    simili: impronteSimili,
    foto: () => fotoDellaDiscesa(corsa),
    rimetti: f => rimettiLaDiscesa(corsa, f, locale),
    fine: () => (corsa.finita ? (corsa.vinta ? 'vinta' : 'persa') : null),
    finisci: f => { if (!corsa.finita && ['vinta', 'persa'].includes(f)) { corsa.finita = true; corsa.vinta = f === 'vinta' } },
    guarda: ruolo => { locale = alleatoDi(ruolo); corsa.persona = corsa.persone[locale] },
  }
}

/* la regola per l'Incontro: chi crea sceglie `{ chiave, difficolta }`; `eroe()`: l'eroe di chi gioca qui, com'è adesso
   ({ eroe, roba, crescita, nome }); `firma` (per le prove) al posto di quella dei dati */
export const regolaSotterraneo = ({ eroe, firma = firmaDeiDati() }) => ({
  versione: `sotterraneo:${VERSIONE_SFIDA}:${firma}`,
  proponi: ({ chiave, difficolta, seme = (Math.random() * 2 ** 31) | 0 }) => proponi({ seme, chiave, difficolta }),
  accetta,
  presentati: () => parteDi(eroe()),
  accettaParte,
  crea: (proposta, parti) => motoreDi(discesaDi(proposta, parti)),
})
