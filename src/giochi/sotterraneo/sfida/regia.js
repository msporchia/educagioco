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

/* una mossa dell'alleato `i`: quello che il dito ha chiesto, se adesso si può ancora */
export function eseguiMossa(corsa, i, [azione, a, b, c]) {
  corsa.come(i, () => {
    const f = corsa.foglio
    const che = f && f.che
    switch (azione) {
      case 'vai': if (!f) corsa.vaiVerso({ x: a, y: b }, !!c); break
      case 'rispondi': if (corsa.chiesta && corsa.chiesta.id === a) corsa.rispondi(!!b); break
      case 'scendi': if (che === 'scala') corsa.scendi(); break
      case 'sali': if (che === 'scala-su') corsa.sali(); break
      case 'nonAspetto': corsa.nonAspettoPiu(); break
      case 'chiudi': if (f && !['scontro', 'aspetta', 'svenuto'].includes(che)) corsa.chiudi(); break
      case 'riprendi': if (che === 'svenuto') corsa.riprendi(); break
      case 'continua': if (che === 'scontro' && !corsa.nonTocca(f)) corsa.continua(); break
      case 'bersaglio': if (che === 'scontro' && f.campo[a]) corsa.scegliBersaglio(f.campo[a]); break
      case 'prepara': if (che === 'scontro' && !corsa.nonTocca(f)) corsa.prepara(a || null); break
      case 'bevi': if (che === 'scontro') { if (!corsa.nonTocca(f)) corsa.beviNelloScontro(a) } else if (!f) corsa.usa(a); break
      case 'usa': if (!f) corsa.usa(a, b || null); break
      case 'butta': if (!f) corsa.butta(a); break
      case 'pergamena': if (!f) corsa.apriLaPergamena(a); break
    }
  })
}

/* il motore del lockstep attorno alla discesa; `guarda(ruolo)`: l'alleato che la vista di questo telefono legge */
export function motoreDi(corsa) {
  let locale = 0
  return {
    partita: corsa,
    passo: FETTA,
    avanza: () => corsa.passo(FETTA),
    applica: (ruolo, mossa) => eseguiMossa(corsa, alleatoDi(ruolo), mossa),
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
