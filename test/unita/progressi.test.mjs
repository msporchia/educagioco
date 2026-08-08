/* Prova il motore dei progressi senza browser:
     node progressi-test.mjs
   Livelli, giorni di fila, padronanza di una materia e traguardi. */
import { livelloDa, xpPerLivello, titoloDi, segnaGiorno, serieViva, giornoDi,
         abilita, difficolta, misure, statoTraguardi, riscuotiTraguardi,
         progressoArea, livelloTotale, tabellineIntereDi, allineaMate,
         MATERIE, TRAGUARDI, AREE, XP_AREA } from '../../src/store/progressi.js'
import { CAMPAGNA, calcoliTabellina } from '../../src/data/tabelline.js'
import { SRS, MAX_S } from '../../src/store/srs.js'
import { WORDS } from '../../src/data/words.js'
import { BISOGNI } from '../../src/data/pets.js'
import { SERIE } from '../../src/data/capsule.js'

const GIORNO = 86400000
let falliti = 0
function ok(cond, testo) {
  if (!cond) { falliti++; console.log('  ✗ ' + testo) }
  else console.log('  ✓ ' + testo)
}
const titolo = t => console.log('\n' + t)

/* profilo finto, la stessa forma di store/profile.js */
const nuovo = () => ({
  coins: 0, owned: [], items: {}, pets: {}, dispensa: {},
  accessori: [], serie: 0,
  totals: { math: 0, en: 0, verbi: 0, td: 0, pasti: 0, partiteMath: 0, torri: 0,
            perfette: 0, ondate: 0, preferiti: 0, monete: 0, cure: 0, capsule: 0 },
  best: { math: 0, serieMath: 0, onda: 0, serieGiorni: 0 },
  td: { tappa: 0, libera: false },
  mate: { tappa: 0, libera: false },
  giorni: { ultimo: '', serie: 0, record: 0, totali: 0 },
  badge: {}, badgeInit: 1,
})
/* un elemento imparato di fresco: forza al massimo, visto adesso */
const sicuro = (now) => ({ s: MAX_S, ok: 9, err: 0, last: now, seen: 9, t: 0 })

/* ═══════════ livelli ═══════════ */
titolo('Livelli ed esperienza')
{
  ok(livelloDa(0).n === 1, 'a zero esperienza si è al livello 1')
  ok(livelloDa(xpPerLivello(1)).n === 2, 'la prima soglia porta al livello 2')
  ok(livelloDa(xpPerLivello(1) - 1).n === 1, 'un punto prima si è ancora al livello 1')
  ok(livelloDa(xpPerLivello(4)).n === 5, 'le soglie successive tornano')
  const l = livelloDa(xpPerLivello(1) + (xpPerLivello(2) - xpPerLivello(1)) / 2)
  ok(Math.abs(l.quota - 0.5) < 1e-9, 'a metà strada la barra segna metà')
  let cresce = true
  for (let n = 2; n < 20; n++)
    if (xpPerLivello(n) - xpPerLivello(n - 1) <= xpPerLivello(n - 1) - xpPerLivello(n - 2)) cresce = false
  ok(cresce, 'ogni livello costa più del precedente')
  ok(titoloDi(1) === 'Novellino' && titoloDi(99) === 'Leggenda', 'i titoli non escono dai bordi')
}

/* ═══════════ giorni di fila ═══════════ */
titolo('I giorni di fila')
{
  const p = nuovo()
  const t0 = new Date(2026, 2, 10, 15, 0, 0).getTime()
  ok(segnaGiorno(p, t0) === true, 'il primo giorno conta')
  ok(p.giorni.serie === 1, 'la serie parte da 1')
  ok(segnaGiorno(p, t0 + 3600e3) === false, 'due partite lo stesso giorno contano una volta')
  ok(p.giorni.serie === 1, 'e la serie non si muove')
  segnaGiorno(p, t0 + GIORNO)
  segnaGiorno(p, t0 + 2 * GIORNO)
  ok(p.giorni.serie === 3, 'tre giorni di fila fanno serie 3')
  ok(p.giorni.totali === 3, 'e tre giorni giocati in tutto')
  segnaGiorno(p, t0 + 5 * GIORNO)
  ok(p.giorni.serie === 1, 'saltare un giorno rompe la serie')
  ok(p.giorni.record === 3, 'ma il record resta')
  ok(serieViva(p, t0 + 5 * GIORNO) === 1, 'la serie è viva il giorno stesso')
  ok(serieViva(p, t0 + 6 * GIORNO) === 1, 'ed è ancora viva il giorno dopo')
  ok(serieViva(p, t0 + 7 * GIORNO) === 0, 'due giorni di assenza e la serie è finita')
  ok(giornoDi(new Date(2026, 0, 5, 23, 59).getTime()) === '2026-01-05', 'il giorno è quello locale')
}

/* ═══════════ quanto so adesso ═══════════ */
titolo('Padronanza di una materia')
{
  const now = Date.now()
  const p = nuovo()
  const a0 = abilita(p, 'mate', now)
  ok(a0.padronanza === 0 && a0.difficolta === 1, 'chi non ha mai giocato parte dal gradino 1')

  for (let i = 1; i <= 20; i++) p.items['math:' + i + 'x7'] = sicuro(now)
  const a1 = abilita(p, 'mate', now)
  ok(a1.imparati === 20, 'venti calcoli sicuri sono venti')
  ok(a1.padronanza > 0.3 && a1.padronanza < 0.45, 'venti su 55 valgono circa un terzo')
  ok(a1.difficolta > 1, 'e la difficoltà suggerita sale')

  /* la stessa roba, un anno dopo: il decadimento del motore la smonta */
  const a2 = abilita(p, 'mate', now + 365 * GIORNO)
  ok(a2.padronanza < a1.padronanza, 'quello che non si ripassa vale di meno')
  ok(a2.difficolta <= a1.difficolta, 'e il gioco torna a proporre cose più facili')

  const tutte = nuovo()
  for (let a = 1; a <= 10; a++) for (let b = a; b <= 10; b++) tutte.items['math:' + a + 'x' + b] = sicuro(now)
  const a3 = abilita(tutte, 'mate', now)
  ok(a3.padronanza === 1, 'sapendo tutte le tabelline la padronanza è piena')
  ok(a3.difficolta === 5, 'e la difficoltà è al massimo')
  ok(difficolta(tutte, 'mate', now) === 5, 'difficolta() dice la stessa cosa')
  ok(MATERIE.every(m => abilita(tutte, m.id, now)), 'ogni materia sa rispondere')
}

/* ═══════════ traguardi ═══════════ */
titolo('Traguardi')
{
  const now = Date.now()
  const p = nuovo()
  ok(new Set(TRAGUARDI.map(t => t.id)).size === TRAGUARDI.length, 'nessun traguardo ha un id doppio')
  ok(TRAGUARDI.every(t => t.soglie.length >= 1 && t.soglie.length <= 3), 'da uno a tre gradi ciascuno')
  ok(TRAGUARDI.every(t => t.soglie.every((s, i) => i === 0 || s > t.soglie[i - 1])),
     'le soglie di ogni traguardo salgono')

  /* I giochi nuovi portano la loro famiglia di traguardi dal manifesto
     (`src/giochi/albo.js`): questi due controlli valgono per tutti, e
     sono quelli che si romperebbero in silenzio — un traguardo in
     un'area che non c'è non si vede da nessuna parte, e un'area senza
     formula dell'esperienza resta a zero per sempre. */
  ok(TRAGUARDI.every(t => AREE.some(a => a.id === t.area)),
     'ogni traguardo sta in una famiglia che esiste')
  ok(AREE.every(a => a.id === 'tutti' || typeof XP_AREA[a.id] === 'function'),
     'ogni famiglia di gioco dice quanto vale in esperienza')
  ok(AREE.every(a => TRAGUARDI.some(t => t.area === a.id)),
     'nessuna famiglia resta senza traguardi')
  ok(new Set(AREE.map(a => a.id)).size === AREE.length, 'nessuna famiglia ha un id doppio')

  const s0 = statoTraguardi(p, now)
  ok(s0.every(t => t.grado === 0), 'a profilo vuoto non se ne ha nessuno')
  ok(s0.every(t => t.quota === 0 || t.valore > 0), 'e nessuna barra parte già piena')

  p.totals.math = 60
  const t1 = statoTraguardi(p, now).find(t => t.id === 'mate-giuste')
  ok(t1.grado === 1 && t1.medaglia === '🥉', '60 risposte danno il bronzo')
  ok(t1.meta === 250, 'e il prossimo obiettivo è 250')
  ok(t1.quota > 0 && t1.quota < 1, 'la barra è a metà strada')

  const r1 = riscuotiTraguardi(p, now)
  ok(r1.nuovi.length === 1 && r1.nuovi[0].id === 'mate-giuste', 'si riscuote una volta sola')
  ok(r1.monete === 15, 'il bronzo porta 15 monete')
  ok(riscuotiTraguardi(p, now).nuovi.length === 0, 'e non si riscuote due volte')

  /* 1200 risposte saltano argento e oro in un colpo solo — e per strada
     fanno salire anche il livello, quindi si guarda il traguardo giusto */
  p.totals.math = 1200
  const r2 = riscuotiTraguardi(p, now)
  const salto = r2.nuovi.find(t => t.id === 'mate-giuste')
  ok(salto && salto.grado === 3 && salto.gradoPrima === 1, 'saltando avanti si arriva all\'oro')
  ok(r2.monete >= 40 + 100, 'e si pagano tutti i gradini saltati')
  ok(statoTraguardi(p, now).find(t => t.id === 'mate-giuste').finito, 'l\'oro chiude il traguardo')

  /* le categorie inglesi: tre parole in una categoria la fanno contare */
  const q = nuovo()
  const animali = WORDS.filter(w => w[3] === 'a').slice(0, 3)
  for (const w of animali) q.items['en:' + w[0]] = sicuro(now)
  ok(misure(q, now).categorieEn(3) === 1, 'tre animali fanno una categoria')
  q.items['en:' + WORDS.filter(w => w[3] === 'f')[0][0]] = sicuro(now)
  ok(misure(q, now).categorieEn(3) === 1, 'una parola sparsa non ne fa un\'altra')

  /* i bisogni degli animali */
  const pieno = (quando, k) => {
    const a = { adottato: quando, val: {}, t: {}, pasti: 1, addosso: {} }
    for (const b of BISOGNI) { a.val[b.k] = 100; a.t[b.k] = quando }
    if (k) a.val[k] = 0
    return a
  }
  const casa = nuovo()
  ok(misure(casa, now).tuttiSazi() === 0, 'senza animali non è un traguardo')
  ok(misure(casa, now).tuttiContenti() === 0, 'e nemmeno l\'altro')
  casa.pets.watson = pieno(now)
  ok(misure(casa, now).tuttiSazi() === 1, 'un animale appena nutrito è sazio')
  ok(misure(casa, now).tuttiContenti() === 1, 'ed è contento su tutto')
  ok(misure(casa, now + 8 * 3600e3).tuttiSazi() === 0, 'dopo otto ore ha fame')

  /* la pancia piena non basta per "Al settimo cielo": è il senso di
     avere quattro barre invece di una */
  const trascurato = nuovo()
  trascurato.pets.watson = pieno(now, 'gioco')
  ok(misure(trascurato, now).tuttiSazi() === 1, 'la pancia può essere piena')
  ok(misure(trascurato, now).tuttiContenti() === 0, 'e l\'animale non essere contento lo stesso')

  /* la collezione delle sorprese */
  const collezione = nuovo()
  ok(misure(collezione, now).accessori() === 0, 'si parte senza accessori')
  ok(misure(collezione, now).serieComplete() === 0, 'e senza serie finite')
  collezione.accessori = SERIE[0].pezzi.map(x => x.e)
  collezione.serie = 1
  ok(misure(collezione, now).accessori() === 12, 'gli accessori si contano')
  ok(misure(collezione, now).serieComplete() === 1, 'e la serie finita pure')
  collezione.serie = 99
  ok(misure(collezione, now).serieComplete() === SERIE.length,
     'ma non si possono finire più serie di quante ne esistono')
  collezione.pets.watson = pieno(now)
  ok(misure(collezione, now).vestiti() === 0, 'un accessorio in casa non è addosso')
  collezione.pets.watson.addosso = { testa: SERIE[0].pezzi[0].e }
  ok(misure(collezione, now).vestiti() === 1, 'addosso invece sì')

  /* i giochi provati */
  const giro = nuovo()
  giro.totals.math = 1; giro.totals.en = 1; giro.totals.torri = 1
  ok(misure(giro, now).giochiProvati() === 3, 'si contano i giochi toccati davvero')
}

/* ═══════════ esperienza per gioco ═══════════ */
titolo('Esperienza per gioco')
{
  const now = Date.now()
  const p = nuovo()
  ok(progressoArea(p, 'mate', now).xp === 0, 'chi non gioca non ha esperienza')
  ok(livelloTotale(p, now).n === 1, 'e il livello totale è 1')
  p.totals.math = 300
  p.totals.torri = 20
  p.td.tappa = 2
  const mate = progressoArea(p, 'mate', now)
  const torri = progressoArea(p, 'torri', now)
  ok(mate.xp === 300, 'le risposte giuste diventano esperienza')
  ok(torri.xp === 20 * 3 + 2 * 40, 'torri e tappe pesano di più di una risposta')
  ok(livelloTotale(p, now).xp === mate.xp + torri.xp, 'il totale è la somma dei giochi')
  ok(livelloTotale(p, now).n > 1, 'e porta oltre il primo livello')
  ok(typeof progressoArea(p, 'mate', now).titolo === 'string', 'ogni gioco ha il suo titolo')
}

/* ═══════════ la campagna delle tabelline ═══════════ */
titolo('Campagna delle tabelline')
{
  const now = Date.now()
  const impara = (p, n, quando = now) =>
    calcoliTabellina(n).forEach(k => { p.items[k] = sicuro(quando) })

  const p = nuovo()
  ok(tabellineIntereDi(p, now).length === 0, 'chi non ha giocato non sa nessuna tabellina')

  impara(p, 2)
  ok(tabellineIntereDi(p, now).join() === '2', 'imparate le dieci caselle, la tabellina è intera')

  // 1×2 e 2×1 sono la stessa chiave: la tabellina del 2 regala una casella
  // alla tabellina dell'1, ma non basta a farla contare
  ok(!tabellineIntereDi(p, now).includes(1), 'una casella in comune non fa una tabellina')

  /* Una casella che decade porta indietro tutta la tabellina: è il punto
     della stella. Qui la tabellina è imparata di fresco (forza appena
     sopra la soglia), che è il caso normale: chi la ripassa da mesi
     resiste più a lungo, ed è giusto così. */
  const vecchio = nuovo()
  calcoliTabellina(5).forEach(k => {
    vecchio.items[k] = { s: SRS.masterS, ok: 4, err: 0, last: now - 30 * GIORNO, seen: 4, t: 0 }
  })
  ok(tabellineIntereDi(vecchio, now - 30 * GIORNO).length === 1, 'appena imparata, è intera')
  ok(tabellineIntereDi(vecchio, now).length === 0,
     'ma un mese senza ripassarla e non è più intera')

  // il traguardo che il bambino racconta a voce
  const q = nuovo()
  for (const n of [2, 10, 5, 3, 4]) impara(q, n)
  const st = statoTraguardi(q, now).find(t => t.id === 'mate-tabelline')
  ok(misure(q, now).tabellineIntere() === 5, 'cinque tabelline intere si contano')
  ok(st.grado === 2 && st.medaglia === '🥈', 'e portano l\'argento')

  // le tappe già meritate si aprono da sole: chi giocava prima della
  // campagna non deve rifare il pianeta del 2
  const r = nuovo()
  for (const n of [2, 10, 5]) impara(r, n)
  allineaMate(r, now)
  ok(r.mate.tappa === 3, 'le prime tre tappe si aprono da sole')
  ok(!r.mate.libera, 'ma il volo libero resta chiuso: la campagna va superata')
  ok(CAMPAGNA[r.mate.tappa].nuova === 3, 'e la prossima è il pianeta del 3')

  const avanti = nuovo()
  avanti.mate.tappa = 6
  allineaMate(avanti, now)
  ok(avanti.mate.tappa === 6, 'chi è già più avanti non torna indietro')

  // la campagna in sé: tappe coerenti fra loro
  ok(CAMPAGNA.length === 10, 'dieci tappe, una per tabellina')
  ok(CAMPAGNA.every((T, i) => i === 0 || T.tabelle.length >= CAMPAGNA[i - 1].tabelle.length),
     'le tabelline si accumulano: nessuna sparisce strada facendo')
  ok(CAMPAGNA.every(T => !T.nuova || T.tabelle.includes(T.nuova)),
     'la tabellina nuova è sempre in gioco nella sua tappa')
  ok(CAMPAGNA.every(T => T.mirate <= T.bersaglio),
     'il bersaglio mirato non può superare quello totale')
  ok(CAMPAGNA[CAMPAGNA.length - 1].tabelle.length === 10, 'l\'ultima tappa le ha tutte')

  // le tappe superate valgono esperienza, come quelle del castello
  const g = nuovo()
  g.totals.math = 100
  const senza = progressoArea(g, 'mate', now).xp
  g.mate.tappa = 3
  ok(progressoArea(g, 'mate', now).xp === senza + 120, 'ogni pianeta superato vale esperienza')
}

console.log(falliti ? `\n${falliti} PROVE FALLITE` : '\nTutto a posto.')
process.exit(falliti ? 1 : 0)
