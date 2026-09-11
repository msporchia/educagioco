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
import { generaRicetta, taratura, scomponi, scaffale, vaBene, capienza, mescola, tara,
         laboratorioLibero, esigenteAl, passoAl, passoPer, passiDi, faticaDi,
         costoDi, dosatureDi, premioTappa, scaleDi, PAZIENZA_MINIMA,
         assistenzaDi, freschezzaDopo, promemoriaDi, QUANTO_E,
         aiutoDi, spintaDi, senzaFretta, fattoreRespiro, SPINTA_PIENA,
         FRESCA, DIRETTE, ACCANTO,
         TAPPE, PASSI, SCALE, SCALA, STRUMENTI, SCALINI,
         INGREDIENTI } from '../../src/data/pozioni.js'
import { migraLaboratorio, LAB_VERSIONE } from '../../src/store/profile.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const GIRI = 300            // ricette per tappa: bastano a pescare ogni scala

/* tutti i banchi di prova: le tappe della campagna più il laboratorio
   libero ai suoi cinque gradi di strizzatura */
const BANCHI = [...TAPPE, ...[1, 2, 3, 4, 5].map(laboratorioLibero)]

/* ── si rigenera tanto e si guarda che nessuna promessa cada ── */
const guasti = new Set()
const conta = { liquido: 0, polvere: 0, radice: 0 }
const chiavi = new Set()
const quote = []            // dove cade la dose sulla scala dell'attrezzo, 0..1
const perScala = {}         // quanto spesso, su ogni scala, qualche attrezzo è sbagliato
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
      const c = perScala[i.scala.id] || (perScala[i.scala.id] = { tot: 0, vere: 0 })
      c.tot++
      if (buoni.length < i.attrezzi.length) { scelteVere++; c.vere++ }
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

/* ── le conversioni escono davvero tutte ── */
uguale('tutte le conversioni della tabella vengono giocate', chiavi.size, SCALE.length)
controlla('le chiavi sono quelle che il motore si aspetta',
          [...chiavi].every(k => k.startsWith('pozioni:')), [...chiavi][0])

/* ── scegliere l'attrezzo deve essere una scelta ──
   Se andassero sempre bene tutti, lo scaffale sarebbe scenografia.

   La soglia è scesa da 0,8 a 0,75 quando le bilance hanno cominciato a
   contare anche in etti, e non per pigrizia: **su una scala ×10 gli
   attrezzi che sanno contare in quell'unità sono due o tre in tutto**.
   Una bilancia da cucina non conta in etti — le sue tacche sarebbero
   mezzi etti — quindi lo scaffale di kg→hg è corto per forza, e con due
   attrezzi capita spesso che vadano bene tutti e due. Quello che non
   deve succedere è che una conversione diventi scenografia da sola, e
   per questo si guarda anche scala per scala. */
const quotaScelte = scelteVere / ingredienti
controlla('quasi sempre c\'è almeno un attrezzo sbagliato', quotaScelte > 0.75,
          `solo nel ${(quotaScelte * 100).toFixed(0)}% dei casi`)
const scenografia = Object.entries(perScala).filter(([, c]) => c.vere / c.tot < 0.25)
controlla('e su nessuna conversione lo scaffale è scenografia',
          scenografia.length === 0,
          scenografia.map(([k, c]) => `${k} ${(c.vere / c.tot * 100).toFixed(0)}%`).join(' · '))
nota(`scelte vere: ${(quotaScelte * 100).toFixed(0)}% degli ingredienti · ` +
     Object.entries(perScala).map(([k, c]) => `${k} ${(c.vere / c.tot * 100).toFixed(0)}%`).join(' '))

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
   le unità in gioco restano due, quelle della scala, mai una terza.

   Si guarda `quanto`, che è quello che finisce sul cartellino: qui si
   rifaceva il conto con `capienza(a, s)` sull'attrezzo **già tarato**,
   cioè si divideva due volte, e il numero controllato non era quello
   che il bambino legge. Funzionava per caso finché le unità piccole
   erano cinque; alla prima caraffa contata in decilitri («0,2 dl») il
   conto doppio sarebbe venuto fuori da solo. */
const brutte = [], terze = []
for (const s of SCALE)
  for (const a of scaffale(s)) {
    const q = a.quanto
    if (!Number.isInteger(q.v) || q.v < 1 || q.v > 999) brutte.push(`${a.nome}: ${q.v} ${q.u}`)
    if (q.u !== s.da && q.u !== s.a) terze.push(`${s.da}→${s.a} ${a.nome}: ${q.v} ${q.u}`)
  }
/* e `capienza` da sola dice la stessa cosa, se le si dà l'attrezzo crudo */
for (const s of SCALE)
  for (const a of STRUMENTI[s.tipo])
    if (tara(a, s) && capienza(a, s).v !== tara(a, s).quanto.v)
      brutte.push(`${a.nome}: cartellino stantio`)
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
uguale('tutte le conversioni entrano in campagna', inCampagna.size, SCALE.length)
const primaVolta = {}
TAPPE.forEach((t, i) => t.scale.forEach(s => { if (!(s in primaVolta)) primaVolta[s] = i }))
controlla('le conversioni di casa vengono prima di quelle scolastiche',
          primaVolta['kg-g'] < primaVolta['hg-g'] &&
          primaVolta['m-cm'] < primaVolta['cm-mm'] &&
          primaVolta['l-ml'] < primaVolta['l-cl'],
          JSON.stringify(primaVolta))
/* l'unità di mezzo arriva prima come posto in cui si *scende* e poi come
   posto in cui si *conta*: prima `hg→g`, poi la bilancia che conta in
   etti. Il decagrammo, che non nomina nessuno, per ultimo. */
controlla('l\'unità di mezzo si impara scendendoci, prima di contarci',
          primaVolta['hg-g'] < primaVolta['kg-hg'] &&
          primaVolta['m-cm'] < primaVolta['m-dm'] &&
          primaVolta['l-ml'] < primaVolta['l-dl'],
          JSON.stringify(primaVolta))
controlla('il decagrammo arriva per ultimo, che non lo usa nessuno',
          Math.min(primaVolta['kg-dag'], primaVolta['hg-dag']) >
          Math.max(primaVolta['kg-hg'], primaVolta['hg-g']),
          `dag alla ${primaVolta['kg-dag'] + 1}, hg alla ${primaVolta['kg-hg'] + 1}`)
nota('entrano alla tappa: ' + Object.entries(primaVolta)
     .sort((a, b) => a[1] - b[1]).map(([s, i]) => `${s}→${i + 1}`).join(' · '))

/* ── UNA CONVERSIONE NUOVA PER TAPPA, E MAI DUE ──
   È la promessa che ha rifatto la fila, e la sola cosa che la tiene in
   piedi è questo blocco: `introduce` lo calcola `data/pozioni.js`
   guardando la fila, quindi spostare una tappa non può far mentire il
   dato — può però rimettere due conversioni nella stessa tappa, ed è
   quello che qui si conta. Due erano: `boccette` apriva il centilitro
   con tutti e due i suoi scalini, e `pesoemisura` — la tappa in cui si
   cambia attrezzo a metà ricetta — ci teneva dentro anche il decimetro. */
const doppie = TAPPE.filter(t => t.introduce.length > 1)
uguale('nessuna tappa porta due conversioni nuove insieme',
       doppie.map(t => `${t.id}: ${t.introduce.join('+')}`).join(' · '), '')
uguale('e le conversioni entrano una per una',
       TAPPE.reduce((s, t) => s + t.introduce.length, 0), SCALE.length)
controlla('`introduce` è la prima volta di quella conversione, non una lista a mano',
          TAPPE.every((t, i) => t.introduce.every(s => primaVolta[s] === i) &&
                      t.scale.every(s => primaVolta[s] !== i || t.introduce.includes(s))),
          TAPPE.map(t => t.introduce.join('+') || '—').join(' · '))
/* le unità nuove sono due sole alla prima tappa di una famiglia — il chilo
   e il grammo arrivano insieme perché sono i due lati della stessa
   conversione — e da lì in poi una alla volta */
const troppeUnita = TAPPE.filter((t, i) => t.unitaNuove.length > (t.introduce.length ? 2 : 0) ||
                                 (t.unitaNuove.length === 2 && i > 0 && !t.introduce.length))
uguale('e mai più di un\'unità di misura nuova, fuori dall\'apertura di una famiglia',
       troppeUnita.map(t => `${t.id}: ${t.unitaNuove.join('+')}`).join(' · '), '')
nota('portano di nuovo: ' + TAPPE.map((t, i) =>
     `${i + 1} ${t.introduce.join('+') || '—'}`).join(' · '))

/* ── un gesto per volta, e mai tre famiglie prima della fine ── */
const famiglieDi = t => new Set(scaleDi(t).map(s => s.tipo))
const famiglie = TAPPE.map(famiglieDi)
controlla('tutte le tappe che aprono una conversione chiedono un gesto solo',
          TAPPE.every((t, i) => !t.introduce.length || famiglie[i].size === 1),
          famiglie.map(f => f.size).join(''))
/* la prima volta che un attrezzo entra in scena entra da solo, con una
   conversione sola: imparare il gesto e la conversione insieme vuol dire
   non sapere quale delle due non è chiara */
const apertura = {}
TAPPE.forEach((t, i) => famiglie[i].forEach(f => { if (!(f in apertura)) apertura[f] = i }))
controlla('il gesto nuovo arriva da solo, con la conversione più facile della sua famiglia',
          Object.values(apertura).every(i => TAPPE[i].scale.length === 1),
          Object.entries(apertura).map(([f, i]) => `${f}→${TAPPE[i].id}`).join(' · '))
uguale('l\'ultima tappa le mette tutte insieme', famiglie[famiglie.length - 1].size, 3)

/* ── la campagna sale a onde ──
   Quasi ogni tappa apre una conversione, quindi «la coppia» non è più il
   gesto nuovo seguito dai numeri stretti: è un'onda. Chi porta la
   conversione nuova riparte coi numeri larghi — la sua fatica SCENDE
   apposta — e la tappa dopo stringe. */
const fatiche = TAPPE.map(faticaDi)
/* Le onde sono scritte qui e non nel dato, come prima: sono un disegno
   della fila, e il test è il posto dove un disegno si dichiara. La
   prima ne tiene tre — la massa apre il gioco e porta anche il primo
   attrezzo che non conta in grammi — l'ultima sono le due che non
   aprono niente e chiedono tutto insieme. */
const ONDE = [[0, 1, 2], [3, 4], [5, 6], [7, 8], [9, 10], [11, 12], [13, 14], [15, 16]]
uguale('le onde coprono tutta la fila', ONDE.flat().join(','),
       TAPPE.map((t, i) => i).join(','))
controlla('dentro ogni onda la fatica cresce',
          ONDE.every(o => o.every((i, n) => !n || fatiche[i] > fatiche[o[n - 1]])),
          fatiche.map(f => f.toFixed(1)).join(' · '))
/* il finale non dà respiro, ed è il finale: per quello c'è il controllo
   dopo, che lo vuole più duro di tutto quello che c'è stato prima */
controlla('e chi apre un\'onda dà respiro rispetto alla tappa prima',
          ONDE.slice(1, -1).every(([a]) => fatiche[a] < fatiche[a - 1]),
          ONDE.slice(1, -1).map(([a]) => `${fatiche[a - 1].toFixed(1)}→${fatiche[a].toFixed(1)}`).join(' · '))
const [penultima, ultima] = ONDE[ONDE.length - 1]
controlla('le due tappe finali sono più dure di tutte le altre',
          fatiche[penultima] > Math.max(...fatiche.slice(0, penultima)) &&
          fatiche[ultima] > fatiche[penultima],
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
const calderone = TAPPE[TAPPE.length - 1]
controlla('il grande calderone stringe il passo strada facendo',
          passoAl(calderone, 0) > passoAl(calderone, calderone.clienti - 1),
          [...Array(calderone.clienti)].map((_, n) => passoAl(calderone, n)).join(' '))

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

/* ═══════════════════════════════════════════════════════════════════
   LE BILANCE NON CONTANO SEMPRE IN GRAMMI
   Il cuore della faccenda: l'attrezzo dice **in che unità conta lui**, e
   quell'unità non è sempre il fondo della scala. Se lo fosse, tutto il
   gioco chiederebbe una cosa sola — scendi in fondo — e leggere il
   cartellino non servirebbe a niente.
   ═══════════════════════════════════════════════════════════════════ */
const contano = new Set(SCALE.map(s => s.a))
for (const [fam, mezze] of [['massa', ['hg', 'dag']], ['capacità', ['dl', 'cl']],
                            ['lunghezza', ['dm', 'cm']]])
  controlla(`qualche attrezzo di ${fam} conta in unità di mezzo`,
            mezze.every(u => contano.has(u)), [...contano].join(' '))
/* e ogni attrezzo in scaffale conta davvero in quell'unità lì: la tacca
   è la stessa cosa del cartellino, se no il ×10 sarebbero due */
const storte = []
for (const s of SCALE)
  for (const a of scaffale(s)) if (a.unita !== s.a) storte.push(`${a.nome} conta in ${a.unita}`)
controlla('e le tacche sono nell\'unità piccola della scala', storte.length === 0,
          storte.join(' · '))
nota('unità in cui contano gli attrezzi: ' + [...contano].join(' · '))

/* ── e una dose in etti si compone davvero coi pesi da etto ──
   La scomposizione avida trova il minimo solo se il peso più piccolo
   divide tutti gli altri: con una grana da 200 g il peso da 500 resta a
   metà strada e 2,6 kg non si compone più. È il guasto che ha deciso le
   grane delle bilance nuove, e nessun altro controllo lo vedrebbe —
   quelli sopra guardano le dosi che escono, questo le guarda **tutte**,
   bilancia per bilancia. */
const monconi = []
for (const s of SCALE.filter(s => s.tipo === 'polvere'))
  for (const a of scaffale(s))
    for (let v = a.grana; v <= Math.min(a.cap, 60 * a.grana); v += a.grana)
      if (scomponi(v, a.pesi).reduce((x, y) => x + y, 0) !== v)
        monconi.push(`${a.nome}: ${v} ${a.unita}`)
controlla('ogni dose si compone esattamente coi pesi di quella bilancia',
          monconi.length === 0, monconi.slice(0, 3).join(' · '))

/* ═══════════════════════════════════════════════════════════════════
   IL PROCEDIMENTO DELLA VIRGOLA
   Il pezzo che mancava alla scaletta: il cartello diceva l'uguaglianza
   e gli scalini — i fatti — e dava per scontato il gesto. Adesso nei
   primi gradini il conto sta svolto sulla dose in mano, e sfuma insieme
   alla scaletta. Il livello non è un contatore nuovo, è il gradino.
   ═══════════════════════════════════════════════════════════════════ */
uguale('il gradino della scaletta è anche quanto si spiega',
       ['diretta', 'accanto', 'promemoria', ''].map(spintaDi).join(''), '3210')

const dose = (id, piccolo) => ({ scala: SCALA[id], piccolo, grande: piccolo / SCALA[id].k })
const pieno = aiutoDi(dose('kg-g', 1400), SPINTA_PIENA)
uguale('alla prima dosatura il procedimento è svolto fino in fondo',
       pieno.catena.join(' → '), '1,4 → 14 → 140 → 1400 g')
controlla('e dice quanti scalini sono, e da che parte va la virgola',
          /3 scalini in giù/.test(pieno.passi) && /destra di 3 posti/.test(pieno.come),
          pieno.passi + ' · ' + pieno.come)
controlla('su un numero intero si aggiungono gli zeri, che la virgola non si vede',
          /aggiungi 3 zeri/.test(aiutoDi(dose('kg-g', 2000), 3).come),
          aiutoDi(dose('kg-g', 2000), 3).come)
controlla('uno scalino solo si dice al singolare',
          /è uno scalino/.test(aiutoDi(dose('kg-hg', 14), 3).passi) &&
          /un posto/.test(aiutoDi(dose('kg-hg', 14), 3).come),
          aiutoDi(dose('kg-hg', 14), 3).passi)
uguale('al gradino dopo il risultato non c\'è', aiutoDi(dose('kg-g', 1400), 2).catena, undefined)
controlla('col solo promemoria non si spiega più niente: resta l\'uguaglianza',
          aiutoDi(dose('kg-g', 1400), 1) === null)
controlla('e a conversione imparata nemmeno quella',
          aiutoDi(dose('kg-g', 1400), 0) === null)
/* la catena non deve mai mentire: l'ultimo anello è la dose vera */
const catenaBugiarda = []
for (const s of SCALE)
  for (const piccolo of [10, 14, 137, 250]) {
    const a = aiutoDi(dose(s.id, piccolo), SPINTA_PIENA)
    if (a.catena.length !== a.scalini + 1) catenaBugiarda.push(`${s.id}: ${a.catena.length} anelli`)
    if (a.catena[a.catena.length - 1] !== `${piccolo} ${s.a}`)
      catenaBugiarda.push(`${s.id}: ${a.risultato}`)
    if (a.catena[0].replace(',', '.') !== String(piccolo / s.k))
      catenaBugiarda.push(`${s.id}: parte da ${a.catena[0]}`)
  }
controlla('la catena parte dalla dose scritta e finisce su quella vera',
          catenaBugiarda.length === 0, catenaBugiarda.slice(0, 3).join(' · '))
nota('a kg→g: ' + pieno.passi + ' · ' + pieno.come + ' · ' + pieno.catena.join(' → '))

/* ── e finché c'è la spiegazione, il cliente non ha fretta ──
   Sono la stessa manopola: leggere tre righe mentre una barra scende
   non insegna a essere svelti, insegna a non leggere. */
controlla('coi gradini guidati il tempo non corre', senzaFretta(3) && senzaFretta(2))
controlla('col solo promemoria corre, ma largo', !senzaFretta(1) && fattoreRespiro(1) > 1)
uguale('e senza aiuti è quello di sempre', fattoreRespiro(0), 1)
const affannati = [], calmi = [], acerbe = [], guidate = []
for (const t of TAPPE) {
  if (!t.introduce.length) continue
  for (let n = 0; n < 20; n++) {
    const r = generaRicetta(t, { n, fresche: {} })
    if (!r.ingredienti.some(i => t.introduce.includes(i.scala.id))) continue
    guidate.push(t.id)
    if (!r.calma) calmi.push(`${t.id}: spinta ${r.spinta}`)
    /* basta un ingrediente col procedimento scritto perché il cliente
       aspetti: una barra che scende a metà ricetta, proprio quando
       arriva la conversione nuova, sarebbe il peggio dei due mondi */
    if (r.spinta !== Math.max(...r.ingredienti.map(i => spintaDi(i.guida))))
      acerbe.push(`${t.id}: ${r.ingredienti.map(i => i.guida || '—').join(' ')}`)
  }
}
controlla('con la conversione nuova in ricetta nessun cliente ha fretta',
          calmi.length === 0, [...new Set(calmi)].slice(0, 3).join(' · '))
controlla('la ricetta prende la spinta del suo ingrediente più acerbo',
          acerbe.length === 0, acerbe.slice(0, 3).join(' · '))
nota(`ricette guidate provate: ${guidate.length} su ${new Set(guidate).size} tappe`)
for (const t of BANCHI)
  for (let n = 0; n < 12; n++) {
    const r = generaRicetta(t, { n, fresche: null })
    if (r.calma || r.spinta !== 0) affannati.push(t.id)
  }
controlla('e senza aiuti il tempo torna a correre ovunque',
          affannati.length === 0, [...new Set(affannati)].join(' · '))

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

/* ═══════════════════════════════════════════════════════════════════
   L'INTRODUZIONE GUIDATA

   Il difetto segnalato da un genitore: il gioco dava per scontato che il
   bambino sapesse già convertire, e la scala al muro sta dietro un tasto
   che preme solo chi sa già di averne bisogno. La cura è una scaletta
   che si abbassa da sé — dose già convertita, dose con la conversione
   accanto, promemoria, niente — e le cose da non sbagliare sono tre: che
   la scaletta finisca (se no il gioco resta guidato per sempre), che uno
   sbaglio la faccia tornare, e che una dose guidata **non venga segnata
   al motore di apprendimento** come se il bambino avesse convertito.
   ═══════════════════════════════════════════════════════════════════ */

/* ── la scaletta scende, e finisce ── */
const gradini = [...Array(FRESCA + 2)].map((_, n) => assistenzaDi(FRESCA - n, true))
uguale('la scaletta va da «già convertita» a niente',
       gradini.join(' '), 'diretta diretta accanto accanto promemoria promemoria  ')
uguale(`le prime ${DIRETTE} dosature non chiedono nessuna conversione`,
       gradini.filter(g => g === 'diretta').length, DIRETTE)
uguale('fuori dalla tappa che la introduce resta solo il promemoria',
       [...new Set([...Array(FRESCA)].map((_, n) => assistenzaDi(FRESCA - n, false)))].join(),
       'promemoria')
uguale('e a conversione imparata non resta niente', assistenzaDi(0, true), '')

/* il residuo scende di uno per volta e si esaurisce: `FRESCA` dosature
   azzeccate e il bambino è per conto suo */
let resta = FRESCA, giri = 0
while (resta > 0 && giri++ < 50) resta = freschezzaDopo(resta, true)
uguale('l\'aiuto si esaurisce dopo tante dosature quante ne dichiara', giri, FRESCA)
uguale('uno sbaglio lo rimette in piedi, ma solo fino al promemoria',
       assistenzaDi(freschezzaDopo(0, false), true), 'promemoria')
uguale('e non riporta mai la dose già convertita',
       freschezzaDopo(0, false) <= FRESCA - DIRETTE - ACCANTO, true)

/* ── la dose guidata è la stessa dose, scritta in un altro modo ── */
const guasteGuide = []
for (const t of TAPPE) {
  if (!t.introduce.length) continue
  for (let n = 0; n < 40; n++) {
    const nuova = generaRicetta(t, { n, fresche: {} })
    for (const i of nuova.ingredienti) {
      if (Math.abs(i.grande * i.scala.k - i.piccolo) > 1e-6)
        guasteGuide.push(`${t.id}: ${i.testo} non fa ${i.piccolo}`)
      if (i.guida === 'diretta') {
        if (i.chiede) guasteGuide.push(`${t.id}: la dose già convertita si segna al motore`)
        if (!i.testo.endsWith(' ' + i.scala.a))
          guasteGuide.push(`${t.id}: dose diretta scritta in ${i.testo}`)
        if (!t.introduce.includes(i.scala.id))
          guasteGuide.push(`${t.id}: ${i.scala.id} guidata senza essere nuova`)
      }
      if (i.guida === 'accanto' && !i.testo.includes(String(i.piccolo) + ' ' + i.scala.a))
        guasteGuide.push(`${t.id}: dose accanto senza la conversione: ${i.testo}`)
      if ((i.guida === '' || i.guida === 'promemoria') && !i.chiede)
        guasteGuide.push(`${t.id}: dose nuda che non conta: ${i.testo}`)
    }
  }
}
uguale('le dosature guidate dicono la stessa dose e non barano sul motore',
       guasteGuide.slice(0, 3).join(' · '), '')

/* ── senza aiuti il gioco è quello di prima ──
   È la porta del banco di prova (`saltaLeSpiegazioni`): un test rigioca
   la stessa «prima volta» a ogni giro, e una ricetta scritta già in
   grammi gli cambierebbe sotto i piedi quello che sta misurando. */
const nude = []
for (const t of TAPPE)
  for (let n = 0; n < 20; n++)
    for (const i of generaRicetta(t, { n, fresche: null }).ingredienti)
      if (i.guida || !i.chiede) nude.push(`${t.id}: ${i.testo} [${i.guida}]`)
uguale('senza il conto delle conversioni fresche non compare nessun aiuto',
       nude.slice(0, 3).join(' · '), '')

/* ═══════════ I SALVATAGGI DI CHI GIOCAVA A UNA FILA PIÙ CORTA ═══════════
   `lab.tappa` è un indice sulla fila, e la fila si è allungata due
   volte: da otto a undici quando si è deciso che una tappa porta una
   conversione nuova sola, e da undici a diciassette quando gli attrezzi
   hanno smesso di contare sempre nell'unità base. Lo stesso numero non
   vuol più dire la stessa cosa, e le due tabelle si applicano in fila.

   La regola è quella del castello — nessuno torna indietro — e qui
   costa qualcosa: le tappe nuove che cadono **dietro** al punto in cui
   un bambino è arrivato gli vengono regalate, perché il salvataggio è
   un fronte solo e mandarcelo sarebbe farlo tornare indietro. */
const VUOTO = { tappa: 0, libera: false, v: LAB_VERSIONE }
const percorso = []
for (let vecchia = 0; vecchia <= 8; vecchia++) {
  const dopo = migraLaboratorio(VUOTO, { tappa: vecchia, libera: vecchia >= 8 })
  percorso.push(`${vecchia}→${dopo.tappa}`)
  if (dopo.tappa < vecchia || dopo.v !== LAB_VERSIONE)
    guasteGuide.push(`migrazione ${vecchia} → ${dopo.tappa}`)
}
const percorsoUndici = []
for (let media = 0; media <= 11; media++) {
  const dopo = migraLaboratorio(VUOTO, { tappa: media, libera: media >= 11, v: 2 })
  percorsoUndici.push(`${media}→${dopo.tappa}`)
  if (dopo.tappa < media || dopo.v !== LAB_VERSIONE)
    guasteGuide.push(`migrazione ${media} → ${dopo.tappa}`)
}
uguale('nessuna delle due filature fa tornare indietro qualcuno',
       guasteGuide.filter(g => g.startsWith('migrazione')).join(' · '), '')
const finita = migraLaboratorio(VUOTO, { tappa: 8, libera: true })
controlla('chi le aveva finite tutte e otto ha finito anche queste',
          finita.tappa >= TAPPE.length && finita.libera === true,
          `${finita.tappa} su ${TAPPE.length}`)
const finitaUndici = migraLaboratorio(VUOTO, { tappa: 11, libera: true, v: 2 })
controlla('e così chi aveva finito le undici',
          finitaUndici.tappa >= TAPPE.length && finitaUndici.libera === true,
          `${finitaUndici.tappa} su ${TAPPE.length}`)
controlla('chi era a metà si trova davanti le tappe nuove, non dentro',
          migraLaboratorio(VUOTO, { tappa: 6 }).tappa < TAPPE.length,
          `tappa ${migraLaboratorio(VUOTO, { tappa: 6 }).tappa}`)
controlla('e chi era a metà della fila di mezzo pure',
          migraLaboratorio(VUOTO, { tappa: 6, v: 2 }).tappa < TAPPE.length,
          `tappa ${migraLaboratorio(VUOTO, { tappa: 6, v: 2 }).tappa}`)
uguale('un profilo già migrato non si tocca',
       migraLaboratorio(VUOTO, { tappa: 4, libera: false, v: LAB_VERSIONE }).tappa, 4)
uguale('e la migrazione fatta due volte dà lo stesso numero',
       migraLaboratorio(VUOTO, migraLaboratorio(VUOTO, { tappa: 5 })).tappa,
       migraLaboratorio(VUOTO, { tappa: 5 }).tappa)
uguale('chi comincia oggi comincia da capo', migraLaboratorio(VUOTO, null).tappa, 0)
nota('otto tappe → oggi: ' + percorso.join(' · '))
nota('undici tappe → oggi: ' + percorsoUndici.join(' · '))

/* ── il promemoria dice il vero ──
   Gli scalini si contano, e contati devono fare il fattore: una riga che
   dicesse «1 l = 1000 ml» sopra due gradini insegnerebbe una cosa falsa,
   e nessuno se ne accorgerebbe guardando il gioco. */
const bugie = []
for (const s of SCALE) {
  const p = promemoriaDi(s)
  if (10 ** (p.scalini.length - 1) !== s.k)
    bugie.push(`${s.id}: ${p.scalini.length - 1} scalini per ×${s.k}`)
  if (p.scalini[0] !== s.da || p.scalini[p.scalini.length - 1] !== s.a)
    bugie.push(`${s.id}: scalini da ${p.scalini[0]} a ${p.scalini[p.scalini.length - 1]}`)
  if (!p.grande || !p.piccolo) bugie.push(`${s.id}: nessuna idea di quanto sia grande`)
}
uguale('gli scalini del promemoria contati fanno il fattore', bugie.join(' · '), '')
uguale('ogni unità in gioco sa dire quanto è grande con una cosa di casa',
       [...new Set(SCALE.flatMap(s => [s.da, s.a]))].filter(u => !QUANTO_E[u]).join(','), '')
nota('quanto è grande: ' + [...new Set(SCALE.flatMap(s => [s.da, s.a]))]
     .map(u => `${u} = ${QUANTO_E[u]}`).join(' · '))

riassunto('il laboratorio delle pozioni')
