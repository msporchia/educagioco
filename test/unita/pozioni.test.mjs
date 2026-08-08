/* ═══════════════════════════════════════════════════════════════════
   IL LABORATORIO DELLE POZIONI, SENZA BROWSER

   Le ricette sono generate, quindi non basta guardarne una: si guarda
   che la macchina che le fa non possa produrne una impossibile. Le
   promesse da mantenere sono cinque:

     1. la conversione torna, ed è un numero intero di unità piccole
     2. ESISTE sempre un attrezzo che sa segnare quella dose
     3. scegliere l'attrezzo è una scelta vera: qualcuno non va bene
     4. la dose non cade sempre nello stesso punto della scala — se
        finisse sempre in cima, la boccia darebbe via la risposta
     5. le polveri si compongono coi pesi disponibili, e in pochi pezzi

   È aritmetica, quindi gira in un lampo: giocarci davvero serve a
   un'altra cosa.
   ═══════════════════════════════════════════════════════════════════ */
import { generaRicetta, taratura, scomponi, scaffale, vaBene, capienza, mescola,
         laboratorioLibero, esigenteAl, passoAl, passoPer, passiDi, faticaDi,
         costoDi, dosatureDi, premioTappa, scaleDi, PAZIENZA_MINIMA,
         TAPPE, PASSI, SCALE, STRUMENTI, SCALINI, INGREDIENTI } from '../../src/data/pozioni.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const GIRI = 300            // ricette per tappa: bastano a pescare ogni scala

/* tutti i banchi di prova: le otto tappe della campagna più il laboratorio
   libero ai suoi cinque gradi di strizzatura */
const BANCHI = [...TAPPE, ...[1, 2, 3, 4, 5].map(laboratorioLibero)]

/* ── si rigenera tanto e si guarda che nessuna promessa cada ── */
const guasti = new Set()
const conta = { liquido: 0, polvere: 0, radice: 0 }
const chiavi = new Set()
const quote = []            // dove cade la dose sulla scala dell'attrezzo, 0..1
let ingredienti = 0, scelteVere = 0

for (const t of BANCHI) {
  for (let n = 0; n < GIRI; n++) {
    const r = generaRicetta(t, { n: n % (t.clienti === Infinity ? 1 : t.clienti) })
    const base = Array.isArray(t.ingredienti) ? t.ingredienti : [t.ingredienti, t.ingredienti]
    // il cliente esigente ne chiede uno in più: è la sua ragione d'essere
    const quanti = [base[0], base[1] + (r.esigente ? 1 : 0)]
    if (r.ingredienti.length < quanti[0] || r.ingredienti.length > quanti[1])
      guasti.add(`${t.id}: ricetta da ${r.ingredienti.length} ingredienti`)
    if (new Set(r.ingredienti.map(i => i.nome)).size !== r.ingredienti.length)
      guasti.add(`${t.id}: ingrediente ripetuto nella stessa ricetta`)
    if (!t.libero && r.ingredienti.some(i => !t.scale.includes(i.scala.id)))
      guasti.add(`${t.id}: conversione fuori tappa`)
    if (r.pazienza < PAZIENZA_MINIMA) guasti.add(`${t.id}: pazienza da ${r.pazienza}s`)

    for (const i of r.ingredienti) {
      ingredienti++
      conta[i.scala.tipo]++
      chiavi.add(i.chiave)

      // la conversione deve tornare, ed essere un numero intero di unità piccole
      if (Math.abs(i.grande * i.scala.k - i.piccolo) > 1e-6)
        guasti.add(`${i.testo} non fa ${i.piccolo} ${i.scala.a}`)
      if (!Number.isInteger(i.piccolo)) guasti.add(`dose non intera: ${i.piccolo} ${i.scala.a}`)
      if (i.piccolo <= 0) guasti.add(`dose nulla: ${i.testo}`)
      // la ricetta la legge un bambino: mai più di due decimali
      if (/,\d{3}/.test(i.testo)) guasti.add(`troppi decimali: ${i.testo}`)

      const buoni = i.attrezzi.filter(a => vaBene(a, i.piccolo))
      if (!buoni.length) guasti.add(`nessun attrezzo per ${i.piccolo} ${i.scala.a}`)
      if (buoni.length < i.attrezzi.length) scelteVere++
      for (const a of buoni) quote.push(i.piccolo / a.cap)

      for (const a of i.attrezzi) {
        if (i.scala.tipo !== 'polvere' && (a.tacche < 8 || a.tacche > 40))
          guasti.add(`${a.nome}: ${a.tacche} tacche`)
        if (!Number.isInteger(a.grana) || !Number.isInteger(a.cap))
          guasti.add(`${a.nome}: taratura non intera ${a.cap}/${a.grana}`)
      }

      if (i.scala.tipo === 'polvere') {
        const b = buoni[0]
        const pesi = scomponi(i.piccolo, b.pesi)
        if (pesi.reduce((x, y) => x + y, 0) !== i.piccolo)
          guasti.add(`${i.piccolo} ${i.scala.a} non si compone con [${b.pesi}]`)
        if (pesi.length > 8) guasti.add(`servono ${pesi.length} pesi per ${i.piccolo}`)
      }
    }
  }
}

controlla('nessuna ricetta impossibile', guasti.size === 0, [...guasti].slice(0, 6).join(' · '))
nota(`${ingredienti} ingredienti generati · attrezzi usati:`,
     Object.entries(conta).map(([k, v]) => `${k} ${v}`).join(' · '))

/* ── le nove conversioni escono davvero tutte ── */
uguale('tutte le conversioni della tabella vengono giocate', chiavi.size, SCALE.length)
controlla('le chiavi sono quelle che il motore si aspetta',
          [...chiavi].every(k => k.startsWith('pozioni:')), [...chiavi][0])

/* ── scegliere l'attrezzo deve essere una scelta ──
   Se andassero sempre bene tutti, lo scaffale sarebbe scenografia. */
const quotaScelte = scelteVere / ingredienti
controlla('quasi sempre c\'è almeno un attrezzo sbagliato', quotaScelte > 0.8,
          `solo nel ${(quotaScelte * 100).toFixed(0)}% dei casi`)
nota(`scelte vere: ${(quotaScelte * 100).toFixed(0)}% degli ingredienti`)

/* ── la dose non deve cadere sempre in cima ──
   È il difetto che rendeva la boccia una risposta gratis: bastava
   riempire fino all'orlo. */
quote.sort((a, b) => a - b)
const q = p => quote[Math.floor(quote.length * p)]
dentro('la dose mediana sta a mezza scala o sotto', q(0.5), 0.05, 0.55)
controlla('meno di un quarto delle dosi arriva quasi in cima',
          quote.filter(x => x > 0.9).length / quote.length < 0.25,
          `${(quote.filter(x => x > 0.9).length / quote.length * 100).toFixed(0)}% sopra il 90%`)
nota(`dove cade la dose: 25% a ${(q(0.25) * 100).toFixed(0)}% · ` +
     `mediana ${(q(0.5) * 100).toFixed(0)}% · 75% a ${(q(0.75) * 100).toFixed(0)}%`)

/* ── l'intestazione non deve dare via l'attrezzo ──
   Se in cima ci fosse una ⚖️ si sceglierebbe la bilancia accoppiando i
   simboli, senza ragionare sulle unità. */
const simboli = new Set(Object.values(STRUMENTI).flat().map(s => s.emoji))
const spie = []
for (const t of BANCHI)
  for (let n = 0; n < 60; n++)
    for (const i of generaRicetta(t, { n }).ingredienti)
      if ([...simboli].some(e => i.testo.includes(e) || i.nome.includes(e)))
        spie.push(`${i.testo} ${i.nome}`)
controlla('la ricetta non nomina nessuno degli attrezzi', spie.length === 0, spie[0])

/* ── e nemmeno il disegno dell'ingrediente può essere un attrezzo ──
   L'essenza di rana era 🧪 e lo sciroppo 🍯: sulla pergamena, accanto alla
   dose, comparivano gli stessi disegni del cilindro e del misurino, e
   l'attrezzo si sceglieva accoppiando le figure invece di convertire. */
const doppioni = INGREDIENTI.filter(i => simboli.has(i.emoji))
controlla('nessun ingrediente ha il disegno di un attrezzo', doppioni.length === 0,
          doppioni.map(i => `${i.emoji} ${i.nome}`).join(' · '))

/* ── il cartellino dell'attrezzo dice una capienza da persona ──
   «fino a 100 cm» non lo dice nessuno: si dice 1 m. La capienza sta in unità
   grandi e le tacche in unità piccole, ed è lì che sta il ×100 da fare — ma
   le unità in gioco restano due, quelle della scala, mai una terza. */
const brutte = [], terze = []
for (const s of SCALE)
  for (const a of scaffale(s)) {
    const q = capienza(a, s)
    if (!Number.isInteger(q.v) || q.v < 1 || q.v > 999) brutte.push(`${a.nome}: ${q.v} ${q.u}`)
    if (q.u !== s.da && q.u !== s.a) terze.push(`${s.da}→${s.a} ${a.nome}: ${q.v} ${q.u}`)
  }
controlla('ogni attrezzo si legge con un numero tondo', brutte.length === 0, brutte.join(' · '))
controlla('e in una delle due unità della scala, non in una terza',
          terze.length === 0, terze.join(' · '))
nota('capienze: ' + SCALE.map(s => `${s.da}→${s.a}: ` +
     scaffale(s).map(a => `${a.nome} ${a.quanto.v} ${a.quanto.u}`).join(', ')).join(' | '))

/* ── il colore del calderone: si mescola come i colori veri ── */
const verde = mescola(['#ffd85e', '#4aa3ff'])          // giallo + blu
const canali = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const [r, g, b] = canali(verde)
controlla('giallo e blu nel calderone fanno verde', g > r && g > b, verde)
controlla('il calderone vuoto ha comunque un colore', /^#[0-9a-f]{6}$/.test(mescola([])), mescola([]))
controlla('tre ingredienti non fanno il nero',
          Math.max(...canali(mescola(['#d0455e', '#4f9e4a', '#8b5cc4']))) > 70,
          mescola(['#d0455e', '#4f9e4a', '#8b5cc4']))

/* ── nel laboratorio libero la strizzatura la dà il motore ── */
const passi = [1, 2, 3, 4, 5].map(lv => taratura(lv).passo)
controlla('nel libero il passo si fa sempre più fine',
          passi.every((p, i) => i === 0 || p <= passi[i - 1]), passi.join(' → '))

/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA
   Le tappe sono scritte a mano, quindi l'unica cosa che si può
   sbagliare è il disegno: una conversione che non arriva mai, una
   tappa più molle della precedente, un tempo che non basta.
   ═══════════════════════════════════════════════════════════════════ */

/* ── ogni conversione entra in campagna, e nell'ordine giusto ── */
const inCampagna = new Set(TAPPE.flatMap(t => t.scale))
uguale('le nove conversioni entrano tutte in campagna', inCampagna.size, SCALE.length)
const primaVolta = {}
TAPPE.forEach((t, i) => t.scale.forEach(s => { if (!(s in primaVolta)) primaVolta[s] = i }))
controlla('le conversioni di casa vengono prima di quelle scolastiche',
          primaVolta['kg-g'] < primaVolta['hg-g'] &&
          primaVolta['m-cm'] < primaVolta['cm-mm'] &&
          primaVolta['l-ml'] < primaVolta['l-cl'],
          JSON.stringify(primaVolta))
nota('entrano alla tappa: ' + Object.entries(primaVolta)
     .sort((a, b) => a[1] - b[1]).map(([s, i]) => `${s}→${i + 1}`).join(' · '))

/* ── un gesto per volta, e mai tre famiglie prima della fine ── */
const famiglieDi = t => new Set(scaleDi(t).map(s => s.tipo))
const famiglie = TAPPE.map(famiglieDi)
controlla('le prime sei tappe chiedono un gesto solo',
          famiglie.slice(0, 6).every(f => f.size === 1),
          famiglie.map(f => f.size).join(''))
controlla('il gesto nuovo arriva sempre da solo, con la conversione più facile',
          TAPPE.every((t, i) => i === 0 || famiglie[i].size > 1 ||
                      [...famiglie[i]][0] === [...famiglie[i - 1]][0] || t.scale.length === 1),
          TAPPE.map(t => t.scale.length).join(''))
uguale('l\'ultima tappa le mette tutte insieme', famiglie[famiglie.length - 1].size, 3)

/* ── la campagna sale, ma a coppie ──
   La tappa che porta un gesto nuovo riparte coi numeri facili: la sua
   fatica SCENDE apposta, e a stringere è la seconda della coppia. */
const fatiche = TAPPE.map(faticaDi)
const COPPIE = [[0, 1], [2, 3], [4, 5]]
controlla('dentro ogni coppia la seconda tappa stringe',
          COPPIE.every(([a, b]) => fatiche[b] > fatiche[a]),
          fatiche.map(f => f.toFixed(1)).join(' · '))
controlla('il gesto nuovo dà respiro rispetto alla tappa prima',
          fatiche[2] < fatiche[1] && fatiche[4] < fatiche[3],
          `${fatiche[1].toFixed(1)} → ${fatiche[2].toFixed(1)} · ${fatiche[3].toFixed(1)} → ${fatiche[4].toFixed(1)}`)
controlla('le due tappe finali sono più dure di tutte le altre',
          fatiche[6] > Math.max(...fatiche.slice(0, 6)) && fatiche[7] > fatiche[6],
          fatiche.map(f => f.toFixed(1)).join(' · '))
nota('fatica: ' + TAPPE.map((t, i) => `${i + 1} ${faticaDi(t).toFixed(1)}`).join(' · '))

/* ── il lavoro cresce, e le monete lo seguono ── */
const dosature = TAPPE.map(dosatureDi)
controlla('ogni tappa chiede almeno tanto lavoro quanto la precedente',
          dosature.every((d, i) => i === 0 || d >= dosature[i - 1]), dosature.join(' → '))
controlla('nessuna tappa paga più di quanto lavora',
          TAPPE.every((t, i) => premioTappa(i) <= Math.ceil(dosatureDi(t) / 10)),
          TAPPE.map((t, i) => premioTappa(i)).join(' · '))
nota('dosature: ' + dosature.join(' → ') + ' · monete: ' + TAPPE.map((t, i) => premioTappa(i)).join(' '))

/* ── il passo è un tetto, non un obbligo ──
   0,05 dm sarebbero mezzo millimetro: le scale ×10 non li reggono, e una
   tappa fine che le contiene deve degradare invece di restare senza
   conversioni giocabili. */
const senzaPasso = []
for (const t of TAPPE)
  for (const s of scaleDi(t)) {
    const p = passoPer(s, passoAl(t, t.clienti - 1))
    if (!passiDi(s).includes(p)) senzaPasso.push(`${t.id}/${s.id}`)
  }
controlla('ogni conversione ha un passo giocabile in ogni tappa che la usa',
          senzaPasso.length === 0, senzaPasso.join(' · '))
controlla('il grande calderone stringe il passo strada facendo',
          passoAl(TAPPE[7], 0) > passoAl(TAPPE[7], TAPPE[7].clienti - 1),
          [...Array(TAPPE[7].clienti)].map((_, n) => passoAl(TAPPE[7], n)).join(' '))

/* ── i clienti esigenti: quanti sono e dove cadono ── */
for (const t of TAPPE) {
  const quali = [...Array(t.clienti)].map((_, n) => esigenteAl(t, n))
  uguale(`${t.nome}: ${t.esigenti} clienti esigenti`, quali.filter(Boolean).length, t.esigenti)
  if (t.esigenti)
    controlla(`${t.nome}: l'ultimo cliente è esigente`, quali[quali.length - 1],
              quali.map(q => (q ? '👑' : '·')).join(''))
}

/* ── il tempo basta a chi sa quello che fa ──
   È la promessa della campagna: chi converte e non sbaglia consegna con
   metà tempo ancora in mano. Il conto del lavoro sta in `costoDi`, e il
   margine scende tappa dopo tappa senza mai scendere sotto il minimo. */
const stretti = []
const margini = []
for (const t of TAPPE)
  for (let n = 0; n < t.clienti; n++)
    for (let g = 0; g < 40; g++) {
      const r = generaRicetta(t, { n })
      const lavoro = r.ingredienti.reduce((s, i) => s + costoDi(i), 0)
      margini.push(r.pazienza / lavoro)
      if (r.pazienza < lavoro * 1.4) stretti.push(`${t.id}: ${r.pazienza}s per ${Math.round(lavoro)}s di lavoro`)
    }
controlla('chi sa convertire consegna con tempo di avanzo', stretti.length === 0,
          stretti.slice(0, 3).join(' · '))
dentro('e il margine non è nemmeno una passeggiata',
       margini.reduce((a, b) => a + b, 0) / margini.length, 1.5, 2.8)
nota('margine sul lavoro: da ' + Math.min(...margini).toFixed(1) + '× a ' +
     Math.max(...margini).toFixed(1) + '×')

/* ── lo scaffale è un catalogo fisso, non una taratura sulla dose ── */
for (const s of SCALE) {
  const attrezzi = scaffale(s)
  controlla(`${s.da}→${s.a}: lo scaffale ha almeno due attrezzi`, attrezzi.length >= 2,
            `${attrezzi.length} attrezzo`)
  controlla(`${s.da}→${s.a}: gli attrezzi sono sempre gli stessi`,
            JSON.stringify(scaffale(s)) === JSON.stringify(attrezzi))
}

/* ── la dispensa e il cartellone al muro ── */
for (const tipo of ['liquido', 'polvere', 'radice'])
  controlla(`c'è abbastanza roba di tipo ${tipo}`,
            INGREDIENTI.filter(i => i.tipo === tipo).length >= 5,
            `${INGREDIENTI.filter(i => i.tipo === tipo).length} ingredienti`)
const emoji = INGREDIENTI.map(i => i.emoji)
uguale('nessun ingrediente ripetuto nella dispensa', new Set(emoji).size, emoji.length)
uguale('il cartellone ha le tre famiglie di unità', SCALINI.length, 3)
controlla('ogni famiglia va da kilo a milli', SCALINI.every(r => r.unita.length === 7),
          SCALINI.map(r => r.unita.length).join(' · '))

/* ── la scomposizione coi pesi è davvero la più corta ── */
const PESI = [1, 2, 5, 10, 20, 50, 100, 200, 500]
for (const v of [3, 7, 38, 99, 176, 645]) {
  const avido = scomponi(v, PESI)
  // programmazione dinamica: il minimo vero, per confronto
  const dp = new Array(v + 1).fill(Infinity); dp[0] = 0
  for (let x = 1; x <= v; x++)
    for (const p of PESI) if (p <= x) dp[x] = Math.min(dp[x], dp[x - p] + 1)
  uguale(`${v} g si compone col minimo di pesi`, avido.length, dp[v])
  uguale(`${v} g: i pesi scelti fanno ${v}`, avido.reduce((a, b) => a + b, 0), v)
}

riassunto('il laboratorio delle pozioni')
