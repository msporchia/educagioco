/* Il degrado adattivo della Fattoria 3D (dati/degrado.js, senza three): scende a 25 fps, non scende sotto il massimo, sale solo dopo
   dieci secondi a 60, non oscilla, e la scelta dell'utente non si tocca. `node test/esegui.mjs fattoria3d-degrado`
   tempo: 1 */
import { SOGLIE, LIVELLI, LIVELLO_MAX, scalaPer, nuovoDegrado, passoDegrado, descriviDegrado } from '../../src/giochi/fattoria3d/dati/degrado.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

/** Fa girare il controllore per `secondi`, una lettura ogni mezzo secondo; `fpsDi(livello, t)` dice a quanto va la macchina. */
function corri(stato, da, secondi, fpsDi, attivo = () => true) {
  let st = stato, cambi = [], t = da
  for (let k = 0; k < secondi * 2; k++) {
    t = da + (k + 1) * 0.5
    const r = passoDegrado(st, { t, fps: fpsDi(st.livello, t), attivo: attivo(t) })
    st = r.stato
    if (r.cambio) cambi.push({ t, cambio: r.cambio, livello: st.livello })
  }
  return { st, cambi, t }
}

// ── scende a 25 fps, ma non nei primi secondi né per un singolo fotogramma lento ──
{
  const a = corri(nuovoDegrado(0), 0, 2.5, () => 25)
  uguale('nella grazia dei primi secondi non si decide', a.cambi.length, 0)
  const b = corri(nuovoDegrado(0), 0, 8, () => 25)
  controlla('a 25 fps scende di un livello dopo la grazia', b.cambi.length >= 1 && b.cambi[0].cambio === -1 && b.cambi[0].t <= 5.5, JSON.stringify(b.cambi))
  const c = corri(nuovoDegrado(0), 0, 20, () => 50)
  uguale('a 50 fps non scende mai', c.st.livello, 0)
  const d = corri(nuovoDegrado(0), 0, 20, (_, t) => (Math.floor(t) % 5 === 0 ? 15 : 55))
  uguale('un calo di mezzo secondo ogni tanto non fa scendere', d.st.livello, 0)
}

// ── non scende sotto il massimo, e la risoluzione non va sotto il minimo ──
{
  const a = corri(nuovoDegrado(0), 0, 600, () => 10)
  uguale('a 10 fps scende fino all\'ultimo livello e si ferma', a.st.livello, LIVELLO_MAX)
  uguale('i cambi sono tutte discese', a.cambi.every(x => x.cambio === -1), true)
  for (const dpr of [1, 1.25, 2, 3]) for (const scelta of [0.75, 1, 1.5, 3]) for (let l = 0; l <= LIVELLO_MAX; l++) {
    const s = scalaPer(dpr, scelta, l), base = Math.min(dpr, scelta)
    if (s > base + 1e-9 || s < Math.min(base, SOGLIE.scalaMin) - 1e-9) controlla(`scalaPer(${dpr}, ${scelta}, ${l}) = ${s} fuori dai limiti`, false)
  }
  controlla('scalaPer: il livello 0 è la scelta (o lo schermo)', scalaPer(2, 1.5, 0) === 1.5 && scalaPer(1, 3, 0) === 1)
  controlla('scalaPer non scende mai sotto 0,75 (se la base era più alta)', scalaPer(1, 1, LIVELLO_MAX) >= 0.75 - 1e-9 && scalaPer(3, 3, LIVELLO_MAX) >= 0.75)
  controlla('scalaPer: una base già sotto il minimo resta com\'è', scalaPer(0.5, 3, LIVELLO_MAX) === 0.5)
  let su = 99; for (let l = 0; l <= LIVELLO_MAX; l++) { const s = scalaPer(2, 2, l); controlla(`scalaPer non sale col livello (${l})`, s <= su + 1e-9); su = s }
}

// ── sale dopo dieci secondi a 60, non prima ──
{
  let st = corri(nuovoDegrado(0), 0, 5, () => 20).st                   // scende al livello 1
  controlla('parte dal livello 1', st.livello === 1, 'livello ' + st.livello)
  const t0 = 5
  const poco = corri(st, t0, 8, () => 60)
  uguale('dopo 8 s a 60 non è ancora salito', poco.st.livello, 1)
  const molto = corri(st, t0, 14, () => 60)
  uguale('dopo 14 s a 60 è tornato a 0', molto.st.livello, 0)
  controlla('e ci è tornato dopo dieci secondi', molto.cambi.length === 1 && molto.cambi[0].t - t0 >= 9.4 && molto.cambi[0].t - t0 <= 11.6, JSON.stringify(molto.cambi))
  const scosso = corri(st, t0, 30, (_, t) => (Math.floor(t) === 14 ? 40 : 60))
  controlla('un secondo a 40 dentro i dieci rimanda la salita', scosso.cambi.length === 0 || scosso.cambi[0].t >= 14 + 9, JSON.stringify(scosso.cambi))
  const cinquanta = corri(st, t0, 40, () => 52)
  uguale('a 52 fps (né male né 60) resta dov\'è', cinquanta.st.livello, 1)
}

// ── non oscilla: una macchina che a livello 0 fa 25 fps e a livello 1 ne fa 60 ──
{
  const fpsDi = l => (l === 0 ? 25 : 60)
  const r = corri(nuovoDegrado(0), 0, 300, fpsDi)
  const scese = r.cambi.filter(x => x.cambio === -1).length
  controlla(`in cinque minuti i cambi sono pochi (${r.cambi.length})`, r.cambi.length <= 9, JSON.stringify(r.cambi.map(x => Math.round(x.t) + ':' + x.cambio)))
  const gap = r.cambi.slice(2).map((x, k) => x.t - r.cambi[k + 1].t)
  controlla('e ogni ricaduta aspetta di più della precedente (le salite si diradano)', r.cambi.filter(x => x.cambio === 1).every((x, k, a) => k === 0 || x.t - a[k - 1].t >= 20), String(gap))
  controlla('resta sul livello che regge a fine corsa', r.st.livello === 1 || scese > 0)
  const attesaMax = corri(nuovoDegrado(0), 0, 3000, fpsDi)
  controlla('l\'attesa non supera mai il tetto', attesaMax.st.attesa <= SOGLIE.attesaMax, 'attesa ' + attesaMax.st.attesa)
}

// ── scheda nascosta o in pausa: non si giudica ──
{
  const r = corri(nuovoDegrado(0), 0, 30, () => 2, () => false)
  uguale('a scheda nascosta nessun cambio, anche a 2 fps', r.cambi.length, 0)
  const s = corri(r.st, 30, 1.5, () => 20)
  uguale('appena torna visibile c\'è di nuovo la grazia', s.cambi.length, 0)
}

// ── la descrizione per le opzioni ──
uguale('livello 0: nessuna riga', descriviDegrado(0), '')
controlla('livello 2 dice risoluzione e ombre', /risoluzione ridotta di 1 gradino/.test(descriviDegrado(2)) && /ogni 2 fotogrammi/.test(descriviDegrado(2)), descriviDegrado(2))
controlla('i livelli sono ordinati (mai più leggeri scendendo)', LIVELLI.every((l, k) => k === 0 || (l.gradini >= LIVELLI[k - 1].gradini && l.ombraOgni >= LIVELLI[k - 1].ombraOgni)))
controlla('lo stato non si muta', (() => { const a = nuovoDegrado(0), copia = JSON.stringify(a); passoDegrado(a, { t: 5, fps: 10 }); return JSON.stringify(a) === copia })())

riassunto()
