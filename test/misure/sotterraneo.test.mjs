/* La tabella della grande storia sotto il banco (docs/sotterraneo/la-grande-storia.md e livelli.md), misurata col curioso.
   tempo: 900
   Il metro è il curioso (docs/sotterraneo/giocatori-tipo.md): gira tutte le stanze, risponde giusto nove volte su dieci e spende il meglio che
   può; i mostri e la roba sono tarati su di lui. Ogni discesa si gioca venti volte per eroe dall'ingresso che la storia del curioso gli ha
   dato (roba, livello, pozioni: `giocaDalCurioso`, motore/storie.js), cambiando solo le risposte giuste o una cosa dell'ingresso
   (test/aiuto/misure-curioso.mjs):

   - a nove su dieci si arriva in fondo quasi sempre, a quattro quasi mai: la cripta perdona (si impara), la scalinata un po' (il primo
     avvio, vedi sotto); a sei su dieci in mezzo;
   - il primo avvio: la scalinata a mani nude (senza roba) a nove su dieci si vince di rado e meno che con la prima arma, e con le gemme con
     cui si esce dalla cripta c'è sempre un'arma da comprare (o l'ha già data il guardiano);
   - con la roba di una discesa prima si fatica, ma si arriva ancora più di metà delle volte; con quella di due discese dopo, a quattro
     su dieci, non è una passeggiata;
   - due livelli sotto si fatica, tre sopra a quattro su dieci non è una passeggiata: il livello e la roba si sommano, e la tabella lo misura;
   - chi arriva con molte gemme da parte e compra il meglio che può non fa passeggiate.
   Chi va dritto (il bravo, 19 su 20) può stare un po' sotto il curioso purché non trovi un muro (due sconfitte di fila nella stessa discesa).
   Il «chi gira tutto» di una volta è il curioso stesso: non ha più un blocco suo.
   `node test/misure/sotterraneo.test.mjs` (il lanciatore, `node test/esegui.mjs sotterraneo`, prende anche le unità)
   Infine le zone, a ogni livello, l'esperienza che danno, e i colori del pallino: con la roba attesa a quel livello, dritti alla scala. */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { inParallelo } from '../aiuto/parallelo.mjs'
import { crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { ROBA_VUOTA } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { Bottega } from '../../src/giochi/sotterraneo/motore/bottega.js'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

const SEMI = 20
const PROVE = [0.9, 0.6, 0.4]   // il curioso: nove giuste su dieci, e le stesse mani più storte
const corto = t => t.chiave.slice(0, 8).padStart(9)
const fila = v => CAMPAGNA.map((_, k) => String(v[k]).padStart(9)).join('')
const media = (tutte, chiave, j, k) => tutte.reduce((n, m) => n + m.vinte[chiave][j][k], 0) / (tutte.length * SEMI)
const cento = x => `${Math.round(x * 100)}%`

/* Le misure giocano ventimila discese: su più processi (test/aiuto/parallelo.mjs), tutte insieme, come il banco da riga di comando.
   L'ordine dei compiti è quello con cui si leggono sotto. */
const SEMI_ZONE = 10
const BANCO = 'src/giochi/sotterraneo/motore/banco.js'
const CURIOSO = 'test/aiuto/misure-curioso.mjs'
const compito = (funzione, opz) => ({ modulo: BANCO, funzione, args: [opz] })
const CONFIGURAZIONI_ZONE = [[12], [16], [20], [30], [24], [27], [16, 11], [16, 12], [16, 15], [16, 20]]
const compiti = [
  ...EROI.map(e => ({ modulo: CURIOSO, funzione: 'misuraDelCurioso', args: [{ eroe: e.chiave, semi: SEMI, prove: PROVE }] })),
  ...EROI.map(e => ({ modulo: CURIOSO, funzione: 'misuraDelBravo', args: [{ eroe: e.chiave, semi: SEMI }] })),
  ...CONFIGURAZIONI_ZONE.flatMap(([L, A]) => EROI.map(e => compito('misuraLeZone', { eroe: e.chiave, livello: L, eroeA: A ?? L, semi: SEMI_ZONE }))),
]
const risultati = await inParallelo(compiti)
let letti = 0
const prossimi = n => { const r = risultati.slice(letti, letti + n); letti += n; return r }

const tutte = prossimi(EROI.length)
const bravi = prossimi(EROI.length)
for (const [i, e] of EROI.entries()) {
  const m = tutte[i]
  nota(`${e.chiave}, venti storie, dall'ingresso del curioso${' '.repeat(6)}${CAMPAGNA.map(corto).join('')}`)
  for (const [chiave, nome] of [['curioso', 'sua roba'], ['prima', 'roba -1'], ['avanti', 'roba +2'], ['L-2', 'due livelli −'], ['L+3', 'tre livelli +'],
                                ['gemme100', '+100 gemme'], ['gemme250', '+250 gemme']])
    for (const j of m.quali[chiave]) nota(`  ${nome.padEnd(14)} a ${m.prove[j] * 10}/10: ${' '.repeat(15)}${fila(m.vinte[chiave][j])}`)
  nota(`  gemme con cui si esce dalla cripta, prima di spendere: ${Math.round(m.uscita)}`)

  for (const [k, t] of CAMPAGNA.entries()) {
    const [nove, , quattro] = m.vinte.curioso.map(v => v[k])
    controlla(`${e.chiave}, ${t.chiave}: dal suo ingresso a 9/10 si arriva in fondo quasi sempre`, nove >= SEMI * 0.75, `${nove}/${SEMI}`)
    // a testa le classi non sono uguali (l'elfa è la più veloce, e a quattro su dieci vince più delle altre): a testa non sempre,
    // e in media «quasi mai» (sotto, nel ciclo delle discese)
    if (k) controlla(`${e.chiave}, ${t.chiave}: a 4/10 non si vince quasi sempre`, quattro <= SEMI * (k === 1 ? 0.7 : 0.6), `${quattro}/${SEMI}`)
    else controlla(`${e.chiave}, la prima perdona: a 4/10 si arriva in fondo spesso`, quattro >= SEMI * 0.6, `${quattro}/${SEMI}`)
  }
}

for (const [k, t] of CAMPAGNA.entries()) {
  if (!k) continue
  const nove = media(tutte, 'curioso', 0, k), sei = media(tutte, 'curioso', 1, k), quattro = media(tutte, 'curioso', 2, k)
  controlla(`${t.chiave}: a 9/10 dal suo ingresso quasi sempre, fra i quattro eroi`, nove >= 0.85, cento(nove))
  controlla(`${t.chiave}: a 6/10 in mezzo: meno che a 9/10`, sei <= nove, `${cento(sei)} contro ${cento(nove)}`)
  controlla(`${t.chiave}: a 4/10 quasi mai, fra i quattro eroi${k === 1 ? ' (la scalinata, di più: il primo avvio)' : ''}`,
            quattro <= (k === 1 ? 0.45 : 0.3), cento(quattro))
  const prima9 = media(tutte, 'prima', 0, k), prima6 = media(tutte, 'prima', 1, k)
  if (k >= 3) controlla(`${t.chiave}: con la roba di una discesa prima, a 9/10 ci si arriva ancora`, prima9 >= 0.5, cento(prima9))
  controlla(`${t.chiave}: e non va meglio che con la sua roba (a 6/10, a meno del caso)`, prima6 <= sei + 0.15, `${cento(prima6)} contro ${cento(sei)}`)
  const avanti4 = media(tutte, 'avanti', 2, k)
  if (k >= 2) controlla(`${t.chiave}: con la roba di due discese dopo, a 4/10 non è una passeggiata`, avanti4 <= 0.7, cento(avanti4))
  const sotto9 = media(tutte, 'L-2', 0, k), sotto6 = media(tutte, 'L-2', 1, k)
  controlla(`${t.chiave}: due livelli sotto, a 9/10 ci si arriva ancora`, sotto9 >= 0.5, cento(sotto9))
  controlla(`${t.chiave}: ma si fatica`, sotto6 <= sei, `${cento(sotto6)} contro ${cento(sei)}`)
  const sopra4 = media(tutte, 'L+3', 2, k)
  // con le abilità tre livelli pesano molto (punti, righe nuove dell'albero, gradi): a quattro su dieci si vince spesso, ma non sempre
  // la scalinata è la discesa dei primi passi: con tre livelli in più (cinque, nei suoi mostri da una o due ossa) a quattro su dieci si passa quasi sempre
  controlla(`${t.chiave}: tre livelli sopra, a 4/10 non si vince sempre`, sopra4 <= (k === 1 ? 0.98 : 0.9), cento(sopra4))
}

/* Il primo avvio (docs/sotterraneo/la-grande-storia.md, «Il primo avvio»): chi entra nella scalinata senza aver
   comprato niente e risponde bene la vince di rado, e meno che con la prima arma; e con le gemme con cui si esce dalla cripta c'è sempre
   una prima arma da comprare, se il guardiano non l'ha data */
{
  const nuda = EROI.map((e, i) => ({ eroe: e.chiave, vinte: tutte[i].vinte.nuda[0][1] }))
  const tutteNude = nuda.reduce((n, x) => n + x.vinte, 0) / (EROI.length * SEMI)
  nota(`la scalinata a mani nude a 9/10: ${nuda.map(x => `${x.eroe} ${x.vinte}/${SEMI}`).join(' · ')}`)
  // coi branchi (13 ottobre, sera) la scalinata nuda si vince di rado: una volta su dieci, e meno dell'attesa; il guardiano della cripta lascia la prima arma
  // per terra e l'armaiolo la vende a 9 💎 (sotto), quindi nudi non si arriva (docs/sotterraneo/la-grande-storia.md, «Il primo avvio»)
  controlla('scalinata a mani nude a 9/10: si vince di rado, una volta su dieci almeno, fra i quattro eroi', tutteNude >= 0.1, cento(tutteNude))
  controlla('e meno che con la prima arma', tutteNude < media(tutte, 'curioso', 0, 1), `${cento(tutteNude)} contro ${cento(media(tutte, 'curioso', 0, 1))}`)
  /* le gemme con cui si esce dalla cripta (in media, il curioso) bastano alla prima arma dell'armaiolo che a questo
     eroe serve. Il guardiano dell'ultima stanza la lascia anche per terra: qui si conta solo la spesa */
  EROI.forEach((e, i) => {
    const gemme = Math.floor(tutte[i].uscita)
    const b = new Bottega({ eroe: e.chiave, roba: { ...ROBA_VUOTA(), gemme }, finite: 1, crescita: crescitaAttesa(e.chiave, 1) })
    const armi = b.mercanzia('armaiolo').filter(r => r.avanti === 0 && ['mano', 'mancina'].includes(COSE[r.chiave].dove) && b.vaAddosso(r.chiave))
    const prezzo = armi.length ? Math.min(...armi.map(r => b.quantoCosta(r.chiave))) : Infinity
    controlla(`${e.chiave}: con le ${gemme} 💎 con cui si esce dalla cripta si compra la prima arma (${prezzo} 💎)`, prezzo <= gemme, `${prezzo} contro ${gemme}`)
  })
}

/* Chi va dritto, il bravo (19 su 20): la sua storia di fila. Può stare un po' sotto il curioso, purché non trovi un muro (due sconfitte
   di fila nella stessa discesa): giocatori-tipo.md, «Il metro è il curioso» */
{
  const alla = k => bravi.reduce((n, m) => n + m.alla[k], 0) / (bravi.length * SEMI)
  const muri = k => bravi.reduce((n, m) => n + m.muri[k], 0) / (bravi.length * SEMI)
  nota(`chi va dritto (il bravo), vinte alla prima ${CAMPAGNA.map((_, k) => cento(alla(k)).padStart(5)).join('')}`)
  nota(`chi va dritto (il bravo), muri            ${CAMPAGNA.map((_, k) => cento(muri(k)).padStart(5)).join('')}`)
  for (const [k, t] of CAMPAGNA.entries())
    controlla(`${t.chiave}, chi va dritto: non trova un muro`, muri(k) <= 0.1, cento(muri(k)))
}

/* chi arriva con molte gemme da parte e compra il meglio che può, anche i pezzi avanti (a un prezzo più alto). Con 250
   gemme a 6/10 si passa quasi sempre: è il premio di averle messe da parte; a 4/10 resta difficile */
const ultime = CAMPAGNA.length - 2
for (const gemme of [100, 250]) {
  for (const [j, bravura] of [[1, 6], [2, 4]])
    nota(`con ${gemme} gemme da parte: a ${bravura}/10 ${CAMPAGNA.map((_, k) => cento(media(tutte, `gemme${gemme}`, j, k)).padStart(5)).join('')}`)
  for (const k of [ultime, ultime + 1]) {
    const t = CAMPAGNA[k].chiave
    controlla(`${t}: con ${gemme} gemme da parte, a 6/10 non è una passeggiata`, media(tutte, `gemme${gemme}`, 1, k) <= (gemme > 100 ? 0.95 : 0.9), cento(media(tutte, `gemme${gemme}`, 1, k)))
    controlla(`${t}: con ${gemme} gemme da parte, a 4/10 di rado`, media(tutte, `gemme${gemme}`, 2, k) <= 0.4, cento(media(tutte, `gemme${gemme}`, 2, k)))
  }
}

/* Le zone (docs/sotterraneo/zone.md): finita la storia ogni discesa ha una fascia di quattro livelli. Chi sta in fondo
   alla fascia (il livello dove comincia: la verde più dura) con la roba attesa a quel livello (motore/zone.js) a 8/10
   arriva in fondo quasi sempre, a 6/10 più o meno due volte su tre ma non sempre, a 4/10 di rado: come una discesa della
   storia, a ogni livello. Vinta, vale più o meno un livello. E i colori del pallino si misurano qui, su una fascia
   16–19: l'eroe del 11 (rosso) non passa rispondendo sei su dieci, del 12 (l'arancio più duro) a otto si può tentare,
   del 15 (l'arancio più facile) a otto quasi sempre; dal 20 (grigio) è una passeggiata, e rende un quarto */
const zonePronte = CONFIGURAZIONI_ZONE.map(() => prossimi(EROI.length))
const nelleZone = (livello, eroeA = livello) => {
  const tutte = zonePronte[CONFIGURAZIONI_ZONE.findIndex(([L, A]) => L === livello && (A ?? L) === eroeA)]
  return { tutte, quota: (j, k) => tutte.reduce((n, m) => n + m.vinte[j][k], 0) / (tutte.length * SEMI_ZONE),
           livelli: k => tutte.reduce((n, m) => n + m.livelli[k], 0) / tutte.length }
}
const mediaZone = f => CAMPAGNA.reduce((n, _, k) => n + f(k), 0) / CAMPAGNA.length
for (const L of [12, 16, 20, 30]) {
  const { tutte, quota, livelli } = nelleZone(L)
  for (const [j, b] of [[0, 8], [1, 6], [2, 4]])
    nota(`zone al livello ${L}, a ${b}/10: ${CAMPAGNA.map((_, k) => cento(quota(j, k)).padStart(5)).join('')}`)
  nota(`  domande (a 8/10): ${CAMPAGNA.map((_, k) => Math.round(tutte.reduce((n, m) => n + m.domande[k], 0) / tutte.length)).join(' · ')}` +
       `, livelli presi: ${CAMPAGNA.map((_, k) => livelli(k).toFixed(1)).join(' · ')}`)
  for (const [k, t] of CAMPAGNA.entries()) {
    controlla(`zona ${t.chiave} al ${L}: a 8/10 si arriva in fondo quasi sempre`, quota(0, k) >= 0.85, cento(quota(0, k)))
    controlla(`zona ${t.chiave} al ${L}: a 6/10 si vince, ma non sempre`, quota(1, k) >= 0.4 && quota(1, k) <= 0.92, cento(quota(1, k)))
    controlla(`zona ${t.chiave} al ${L}: a 4/10 di rado`, quota(2, k) <= 0.4, cento(quota(2, k)))
  }
  const sei = mediaZone(k => quota(1, k))
  controlla(`zone al ${L}: a 6/10 in media fra metà e quattro volte su cinque`, sei >= 0.5 && sei <= 0.8, cento(sei))
  // l'esperienza tiene il passo: una zona verde vinta vale più o meno un livello, a ogni altezza
  const presi = mediaZone(livelli)
  controlla(`zone al ${L}: una verde vinta vale più o meno un livello`, presi >= 0.8 && presi <= 2, presi.toFixed(2))
}
// fra il 24 e il 28 la roba attesa resta indietro (la difesa sale a scalini, al 30): a 6/10 si scende verso il 40%,
// ma si vince ancora (docs/sotterraneo/zone.md, «Le misure»)
for (const L of [24, 27]) {
  const { quota, livelli } = nelleZone(L)
  const sei = mediaZone(k => quota(1, k)), otto = mediaZone(k => quota(0, k))
  nota(`zone al livello ${L}: a 8/10 ${cento(otto)}, a 6/10 ${cento(sei)}, livelli presi ${mediaZone(livelli).toFixed(2)}`)
  controlla(`zone al ${L}: a 8/10 quasi sempre`, otto >= 0.9, cento(otto))
  controlla(`zone al ${L}: a 6/10 almeno una volta su tre`, sei >= 0.33, cento(sei))
}
{
  const media = (q, j) => mediaZone(k => q(j, k))
  const rosso = nelleZone(16, 11).quota, duro = nelleZone(16, 12).quota, arancio = nelleZone(16, 15).quota
  const grigia = nelleZone(16, 20)
  const grigio = grigia.quota
  nota(`una zona 16–19: eroe del 11 (rosso) ${cento(media(rosso, 0))} · ${cento(media(rosso, 1))}, del 12 (arancio) ` +
       `${cento(media(duro, 0))} · ${cento(media(duro, 1))}, del 15 (arancio) ${cento(media(arancio, 0))} · ${cento(media(arancio, 1))}, ` +
       `del 20 (grigio) ${cento(media(grigio, 1))} · ${cento(media(grigio, 2))} (a 8 · 6, a 6 · 4)`)
  controlla('rossa: a 6/10 non si passa', media(rosso, 1) <= 0.15, cento(media(rosso, 1)))
  controlla('rossa: e a 8/10 nemmeno sempre', media(rosso, 0) <= 0.8, cento(media(rosso, 0)))
  // quattro livelli sotto la zona, con le abilità, valgono molto: si può tentare ma di rado (era la metà delle volte)
  controlla('l\'arancio più duro: a 8/10 si può tentare, di rado', media(duro, 0) >= 0.1, cento(media(duro, 0)))
  controlla('ma a 6/10 è dura', media(duro, 1) <= 0.5, cento(media(duro, 1)))
  controlla('l\'arancio più facile: a 8/10 quasi sempre', media(arancio, 0) >= 0.85, cento(media(arancio, 0)))
  controlla('grigia: a 6/10 è una passeggiata', media(grigio, 1) >= 0.95, cento(media(grigio, 1)))
  const poco = mediaZone(grigia.livelli)
  nota(`  la grigia (eroe del 20) rende ${poco.toFixed(2)} livelli`)
  controlla('grigia: e rende poco', poco <= 0.5, poco.toFixed(2))
}

riassunto('la tabella della grande storia')
