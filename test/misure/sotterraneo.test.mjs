/* La tabella della grande storia sotto il banco (docs/sotterraneo/la-grande-storia.md e livelli.md), misurata col curioso.
   tempo: 1500
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
const SEMI_ZONE = 8
const CURIOSO = 'test/aiuto/misure-curioso.mjs'
/* Le discese in cui a 4 giuste su 10 il curioso vince oltre il bersaglio per come sono fatte, e va bene (il proprietario, 15 ottobre: «a memoria oneshotta
   tutti, quindi è difficile perdere; l'idea è dargli alcuni punti dove deve pianificare»): la cripta (che si impara) e la cisterna (45% in media, elfa e nano 65–70%) */
const SENZA_BERSAGLIO_A_4 = ['altare', 'cisterna']
const CONFIGURAZIONI_ZONE = [[12], [16], [20], [24], [30], [16, 11], [16, 12], [16, 15], [16, 20]]
const PROVE_ZONE = [0.9, 0.6]   // a 4/10 il curioso nelle zone non vince quasi mai: non serve giocarle
const compiti = [
  ...EROI.map(e => ({ modulo: CURIOSO, funzione: 'misuraDelCurioso', args: [{ eroe: e.chiave, semi: SEMI, prove: PROVE }] })),
  ...EROI.map(e => ({ modulo: CURIOSO, funzione: 'misuraDelBravo', args: [{ eroe: e.chiave, semi: SEMI }] })),
  ...EROI.map(e => ({ modulo: CURIOSO, funzione: 'misuraLeZoneDelCurioso', args: [{ eroe: e.chiave, semi: SEMI_ZONE, prove: PROVE_ZONE,
                                                                                   configurazioni: CONFIGURAZIONI_ZONE.map(([L, A]) => [L, A ?? L]) }] })),
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
    // dal 30/10 conta quanto costa vincere (docs/sotterraneo/costo-di-vincere.md): anche il curioso ogni tanto sviene troppo e rifà la discesa
    controlla(`${e.chiave}, ${t.chiave}: dal suo ingresso a 9/10 si arriva in fondo quasi sempre`, nove >= SEMI * 0.65, `${nove}/${SEMI}`)
    // a testa le classi non sono uguali (l'elfa è la più veloce, e a quattro su dieci vince più delle altre): a testa non sempre,
    // e in media «quasi mai» (sotto, nel ciclo delle discese). Nelle discese facili (SENZA_BERSAGLIO_A_4) niente
    if (!SENZA_BERSAGLIO_A_4.includes(t.chiave)) controlla(`${e.chiave}, ${t.chiave}: a 4/10 non si vince quasi sempre`, quattro <= SEMI * (k === 1 ? 0.7 : 0.6), `${quattro}/${SEMI}`)
  }
}

for (const [k, t] of CAMPAGNA.entries()) {
  if (!k) continue
  const nove = media(tutte, 'curioso', 0, k), sei = media(tutte, 'curioso', 1, k), quattro = media(tutte, 'curioso', 2, k)
  controlla(`${t.chiave}: a 9/10 dal suo ingresso quasi sempre, fra i quattro eroi`, nove >= 0.8, cento(nove))
  controlla(`${t.chiave}: a 6/10 in mezzo: meno che a 9/10`, sei <= nove, `${cento(sei)} contro ${cento(nove)}`)
  if (!SENZA_BERSAGLIO_A_4.includes(t.chiave))
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
  // dal 30/10 i comuni della scalinata chiedono due risposte: nudi si vince una volta ogni tanto, non più una su dieci
  controlla('scalinata a mani nude a 9/10: si vince di rado, ma ogni tanto, fra i quattro eroi', tutteNude >= 0.02, cento(tutteNude))
  controlla('e meno che con la prima arma', tutteNude < media(tutte, 'curioso', 0, 1), `${cento(tutteNude)} contro ${cento(media(tutte, 'curioso', 0, 1))}`)
  /* le gemme con cui si esce dalla scalinata (in media, il curioso; non subito dalla cripta: anche senza un'arma la scalinata si vince, il proprietario, 15 ottobre)
     bastano alla prima arma dell'armaiolo che a questo eroe serve. Il guardiano dell'ultima stanza la lascia anche per terra: qui si conta solo la spesa */
  nota(`le gemme con cui si esce dalla cripta e dalla scalinata: ${EROI.map((e, i) => `${e.chiave} ${Math.round(tutte[i].uscita[0])} · ${Math.round(tutte[i].uscita[1])}`).join(' · ')}`)
  EROI.forEach((e, i) => {
    const gemme = Math.floor(tutte[i].uscita[1])
    const b = new Bottega({ eroe: e.chiave, roba: { ...ROBA_VUOTA(), gemme }, finite: 2, crescita: crescitaAttesa(e.chiave, 2) })
    const armi = b.mercanzia('armaiolo').filter(r => r.avanti === 0 && ['mano', 'mancina'].includes(COSE[r.chiave].dove) && b.vaAddosso(r.chiave))
    const prezzo = armi.length ? Math.min(...armi.map(r => b.quantoCosta(r.chiave))) : Infinity
    controlla(`${e.chiave}: con le ${gemme} 💎 con cui si esce dalla scalinata si compra un'arma (${prezzo} 💎)`, prezzo <= gemme, `${prezzo} contro ${gemme}`)
  })
}

/* Chi va dritto, il bravo (19 su 20): la sua storia di fila, solo stampata. Può trovare muri (due sconfitte di fila nella stessa discesa) e va bene: non
   sta livellando, il fine è fargli fare più domande possibile, e esplorare è parte del divertimento (il proprietario, 15 ottobre) */
{
  const alla = k => bravi.reduce((n, m) => n + m.alla[k], 0) / (bravi.length * SEMI)
  const muri = k => bravi.reduce((n, m) => n + m.muri[k], 0) / (bravi.length * SEMI)
  nota(`chi va dritto (il bravo), vinte alla prima ${CAMPAGNA.map((_, k) => cento(alla(k)).padStart(5)).join('')}`)
  nota(`chi va dritto (il bravo), muri            ${CAMPAGNA.map((_, k) => cento(muri(k)).padStart(5)).join('')}`)
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
    controlla(`${t}: con ${gemme} gemme da parte, a 4/10 di rado (fino al 45%: può sempre tornare indietro a farmare)`, media(tutte, `gemme${gemme}`, 2, k) <= 0.45, cento(media(tutte, `gemme${gemme}`, 2, k)))
  }
}

/* Le zone (docs/sotterraneo/zone.md): finita la storia ogni discesa ha una fascia di quattro livelli. Qui le gioca il curioso (misuraLeZoneDelCurioso):
   la roba e le pozioni dell'ingresso della sua ultima discesa, il livello della fascia (l'inizio, la verde più dura) con i punti da dare, la spesa fatta
   con le gemme che ha. Una zona troppo dura per lui va bene («uno esce, si ricarica o fa altre zone»): i bersagli sono quello che si misura, arrotondato,
   e si segnala solo ciò che è fuori scala. I colori del pallino sono quelli del gioco (`coloreDellaFascia` sulla forza di `forzaDi`, motore/zone.js e
   forza.js): si misurano su una fascia 16–19, con l'eroe al 11, 12, 15 e 20 */
const zonePronte = prossimi(EROI.length)
const nelleZone = (livello, eroeA = livello) => {
  const tutte = zonePronte.map(m => m.zone[`${livello},${eroeA}`])
  return { tutte, quota: (j, k) => tutte.reduce((n, m) => n + m.vinte[j][k], 0) / (tutte.length * SEMI_ZONE),
           livelli: k => tutte.reduce((n, m) => n + m.livelli[k], 0) / tutte.length,
           forza: tutte.reduce((n, m) => n + m.forza, 0) / tutte.length,
           colori: tutte.reduce((o, m) => { for (const c in m.colori) o[c] = (o[c] || 0) + m.colori[c]; return o }, {}) }
}
const mediaZone = f => CAMPAGNA.reduce((n, _, k) => n + f(k), 0) / CAMPAGNA.length
// quanto il curioso vince in media nelle sette zone, a 9/10 (almeno) e a 6/10 (al più), per livello della fascia: la misura del 15 ottobre arrotondata al 5%
const BERSAGLI_ZONE = { 12: [0.75, 0.45], 16: [0.65, 0.25], 20: [0.55, 0.2], 24: [0.5, 0.15], 30: [0.45, 0.15] }
for (const L of [12, 16, 20, 24, 30]) {
  const { tutte, quota, livelli, forza } = nelleZone(L)
  for (const [j, b] of [[0, 9], [1, 6]])
    nota(`zone al livello ${L}, a ${b}/10: ${CAMPAGNA.map((_, k) => cento(quota(j, k)).padStart(5)).join('')}`)
  nota(`  domande (a 9/10): ${CAMPAGNA.map((_, k) => Math.round(tutte.reduce((n, m) => n + m.domande[k], 0) / tutte.length)).join(' · ')}` +
       `, livelli presi: ${CAMPAGNA.map((_, k) => livelli(k).toFixed(1)).join(' · ')}; forza di ingresso ${forza.toFixed(1)}`)
  const [nove, sei] = BERSAGLI_ZONE[L]
  controlla(`zone al ${L}: a 9/10 in media si vince almeno ${cento(nove)}`, mediaZone(k => quota(0, k)) >= nove, cento(mediaZone(k => quota(0, k))))
  controlla(`zone al ${L}: a 6/10 in media si vince al più ${cento(sei)}`, mediaZone(k => quota(1, k)) <= sei, cento(mediaZone(k => quota(1, k))))
  // il curioso gira tutto, quindi di esperienza ne prende più del dritto di una volta (0,8–2): in media fra uno e quattro livelli e mezzo a zona
  // (quattro e mezzo dal 30/10: i comuni da due o tre risposte hanno più ossa, e un mostro porta quello che è)
  const presi = mediaZone(livelli)
  controlla(`zone al ${L}: una zona vinta vale fra uno e quattro livelli e mezzo`, presi >= 0.8 && presi <= 4.5, presi.toFixed(2))
}
{
  const media = (q, j) => mediaZone(k => q(j, k))
  for (const [A, nome] of [[11, 'rosso'], [12, 'arancio duro'], [15, 'arancio facile'], [16, 'verde'], [20, 'grigio']]) {
    const z = nelleZone(16, A)
    nota(`una zona 16–19, eroe del ${A} (${nome}): a 9/10 ${cento(media(z.quota, 0))}, a 6/10 ${cento(media(z.quota, 1))}; ` +
         `forza ${z.forza.toFixed(1)}, colori ${JSON.stringify(z.colori)}; rende ${mediaZone(z.livelli).toFixed(2)} livelli`)
  }
  /* il colore è quello del gioco (forza di `forzaDi` contro la fascia): più l'eroe è avanti più si vince, e il rosso e l'arancio più duri non si passano a 6/10.
     La forza del curioso resta sotto il suo livello (1–4 livelli: la roba non è al passo), quindi sulla fascia 16–19 il verde e il grigio non si vedono mai: nel
     gioco la zona gli direbbe «più forte» finché non compra a tono */
  const a9 = A => media(nelleZone(16, A).quota, 0), a6 = A => media(nelleZone(16, A).quota, 1)
  // 30 e non 25, e 50 e non 55 qui sotto, dal 30/10: con le zone ritarate sui comuni da due o tre risposte stanno a un punto dal bordo (24–26%, 55%), e otto semi sono pochi
  controlla('rossa/arancio duro (eroe del 11 e del 12): a 9/10 si vince di rado', a9(11) <= 0.3 && a9(12) <= 0.3, `${cento(a9(11))} · ${cento(a9(12))}`)
  controlla('e a 6/10 quasi mai', a6(11) <= 0.1 && a6(12) <= 0.1, `${cento(a6(11))} · ${cento(a6(12))}`)
  controlla('l\'arancio più facile (eroe del 15): a 9/10 una volta su due', a9(15) >= 0.45 && a9(15) <= 0.6, cento(a9(15)))
  controlla('verde (eroe del 16): a 9/10 più spesso che no', a9(16) >= 0.65, cento(a9(16)))
  controlla('eroe del 20: a 9/10 quasi sempre', a9(20) >= 0.8, cento(a9(20)))
  controlla('e a 6/10 circa metà delle volte', a6(20) >= 0.5, cento(a6(20)))
  controlla('più l\'eroe è avanti più si vince (a 9/10, 11 → 12 → 15 → 16 → 20)', [11, 12, 15, 16, 20].every((A, i, v) => !i || a9(A) >= a9(v[i - 1]) - 0.05),
            [11, 12, 15, 16, 20].map(a9).map(cento).join(' · '))
}

riassunto('la tabella della grande storia')
