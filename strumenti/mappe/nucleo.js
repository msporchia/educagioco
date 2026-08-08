/* ═══════════════════════════════════════════════════════════════════
   IL NUCLEO DELLE MAPPE — legenda, lettura, scrittura, controlli

   Un livello del Generale è un dato puro: una griglia di caratteri più
   dei metadati. Qui c'è tutto quello che serve per capirlo — cosa vuol
   dire ogni simbolo, cosa può dire un ordine, e soprattutto **cosa non
   torna** in un livello scritto a mano.

   Questo file è scritto in modo che possa girare in due posti senza
   essere copiato:

     · in Node, importato da `valida.mjs` e dai test (`import './nucleo.js'`
       e poi `globalThis.MAPPE`);
     · nel browser, dentro `editor.html`, con un `<script src="nucleo.js">`
       normale — così l'editor si apre col doppio click, senza server.

   È il motivo per cui non ci sono né `import` né `export`: un file con
   `export` non si può caricare con un tag `<script>` da `file://`, e
   avere due copie delle regole vorrebbe dire avere due validatori che
   prima o poi dicono cose diverse. L'unica riga di magia è l'ultima:
   tutto quello che serve finisce in `globalThis.MAPPE`.

   Le regole del formato stanno in FORMATO.md, che è il documento da
   leggere per scrivere un livello. Qui c'è la loro applicazione.
   ═══════════════════════════════════════════════════════════════════ */
;(function () {
'use strict'

/* ═══════════ 1. LA LEGENDA ═══════════
   Un carattere della griglia dice tre cose: che aspetto ha, se si può
   camminarci sopra, e con che nome lo chiamano gli ordini. Il `nome` è
   la parte che conta di più: è la parola che il bambino vede scritta
   nell'ordine («vai alla chiave»), ed è la chiave con cui il validatore
   controlla che i bersagli citati esistano davvero. */
const LEGENDA = {
  /* terreno */
  '#': { che: 'terreno', nome: 'muro',       solido: true,  emoji: '',   colore: '#3a3f52' },
  '.': { che: 'terreno', nome: 'pavimento',                 emoji: '',   colore: '#f2ead9' },
  '~': { che: 'terreno', nome: 'acqua',      solido: true,  emoji: '🌊', colore: '#bfe0f5' },
  ',': { che: 'terreno', nome: 'cespuglio',  nasconde: true, emoji: '🌿', colore: '#cfe6bf' },

  /* unità — chi cammina.

     `sa` è cosa quell'unità **sa fare**: non tutti sanno tutto, e non è
     una limitazione da bilanciare ma la ragione per cui una tappa ha più
     di un'unità. Se il cane sapesse aprire i portoni, «mandaci il cane»
     sarebbe sempre la risposta e non ci sarebbe niente da pensare. Il
     forziere lo apre l'eroe, la serratura la scassina la ladra, il cane
     corre e abbaia.

     È una proprietà della creatura, non del livello: un cane non impara
     ad aprire le porte nella terza tappa. Perciò sta qui e non nel dato
     del livello. */
  '@': { che: 'unità', nome: 'eroe',         eroe: true,    emoji: '🦸',
         sa: ['vai', 'prendi', 'posa', 'apri', 'pattuglia', 'segui', 'scappa', 'chiama', 'aspetta', 'attacca'] },
  's': { che: 'unità', nome: 'soldato',                     emoji: '💂',
         sa: ['vai', 'prendi', 'posa', 'pattuglia', 'segui', 'scappa', 'chiama', 'aspetta', 'attacca'] },
  'e': { che: 'unità', nome: 'esploratore',                 emoji: '🧭',
         sa: ['vai', 'prendi', 'posa', 'segui', 'scappa', 'chiama', 'aspetta'] },
  'o': { che: 'unità', nome: 'orco',                        emoji: '🧌',
         sa: ['vai', 'prendi', 'posa', 'apri', 'pattuglia', 'segui', 'scappa', 'chiama', 'aspetta', 'attacca'] },
  'l': { che: 'unità', nome: 'ladra',                       emoji: '🥷',
         sa: ['vai', 'prendi', 'posa', 'apri', 'segui', 'scappa', 'chiama', 'aspetta'] },
  'g': { che: 'unità', nome: 'guardia',                     emoji: '👮',
         sa: ['vai', 'apri', 'pattuglia', 'segui', 'scappa', 'chiama', 'aspetta', 'attacca'] },
  'c': { che: 'unità', nome: 'cane',                        emoji: '🐕',
         sa: ['vai', 'pattuglia', 'segui', 'scappa', 'chiama', 'aspetta'] },

  /* cose — si prendono e si posano */
  'k': { che: 'cosa', nome: 'chiave',        prendibile: true, emoji: '🔑' },
  'T': { che: 'cosa', nome: 'tesoro',        prendibile: true, emoji: '💎' },
  'z': { che: 'cosa', nome: 'zaino',         prendibile: true, emoji: '🎒' },

  /* congegni — si aprono, si azionano */
  'P': { che: 'congegno', nome: 'portone',   solido: true, apribile: true, emoji: '🚪' },
  'L': { che: 'congegno', nome: 'leva',      azionabile: true, emoji: '🎚️' },
  'A': { che: 'congegno', nome: 'campana',   azionabile: true, emoji: '🔔' },

  /* traguardi — dove si va a finire */
  'X': { che: 'traguardo', nome: 'uscita',   emoji: '🏁' },
  'B': { che: 'traguardo', nome: 'bandiera', emoji: '🚩' },
}

/* Gli ordini che si possono firmare. `bersaglio` dice se il complemento
   ci vuole; `ammessi` quali generi di bersaglio hanno senso — «pattuglia
   il tesoro» non vuol dire niente, e il validatore lo deve sapere. */
const VERBI = {
  vai:       { bersaglio: 'serve',  ammessi: ['cosa', 'congegno', 'traguardo', 'zona', 'ronda', 'unità'],
               che: 'ci cammina fin lì e si ferma' },
  prendi:    { bersaglio: 'serve',  ammessi: ['cosa'],
               che: 'va a prenderla e se la porta dietro' },
  posa:      { bersaglio: 'serve',  ammessi: ['cosa'],
               che: 'lascia a terra quello che ha in mano' },
  apri:      { bersaglio: 'serve',  ammessi: ['congegno'],
               che: "lo apre — se serve la chiave, deve averla addosso" },
  pattuglia: { bersaglio: 'serve',  ammessi: ['zona', 'ronda'],
               che: 'gira su e giù per la zona finché non succede qualcosa' },
  segui:     { bersaglio: 'serve',  ammessi: ['unità'],
               che: 'gli sta dietro' },
  scappa:    { bersaglio: 'serve',  ammessi: ['zona', 'traguardo'],
               che: 'ci corre via il più in fretta possibile' },
  chiama:    { bersaglio: 'serve',  ammessi: ['segnale'],
               che: 'lancia il segnale: chi lo aspetta si mette in moto' },
  aspetta:   { bersaglio: 'vietato', vuoleFinche: true,
               che: 'sta fermo dov\'è finché la condizione non diventa vera' },
  attacca:   { bersaglio: 'serve',  ammessi: ['unità'],
               che: 'gli va addosso finché lo vede — chi non sa combattere non ce l\'ha' },
}

/* Le condizioni si scrivono `verbo:bersaglio` — `vedi:ladra`,
   `aperto:portone`, `segnale:rosso` — e le due senza bersaglio si
   scrivono da sole: `mai`, `subito`. Una condizione è la stessa cosa
   in `quando` (fa partire l'ordine) e in `finché` (lo fa finire): è
   sempre una domanda con risposta sì o no. */
const CONDIZIONI = {
  vedi:     { ammessi: ['unità'],  che: 'ha in vista quell\'unità' },
  hai:      { ammessi: ['cosa'],   che: 'ce l\'ha addosso' },
  aperto:   { ammessi: ['congegno'], che: 'quel congegno è aperto' },
  preso:    { ammessi: ['cosa'],   che: 'qualcuno l\'ha raccolta' },
  arrivato: { ammessi: ['zona', 'traguardo', 'cosa', 'congegno'], che: 'ci è arrivato' },
  segnale:  { ammessi: ['segnale'], che: 'quel segnale è stato lanciato' },
  subito:   { solo: true, che: 'è vera da subito (è il valore normale di `quando`)' },
  mai:      { solo: true, che: 'non diventa mai vera: l\'ordine non finisce più' },
}

/* I tre allarmi che ci sono sempre. Un livello può dichiararne altri
   con `segnali: ['ritirata']`. */
const SEGNALI = ['rosso', 'verde', 'blu']

const AUTORI = ['giocatore', 'livello']

/* Un'unità sa fare un verbo? Chi non dichiara `sa` sa tutto: serve a non
   dover riempire la tabella per un simbolo nuovo appena inventato. */
const saFare = (ch, verbo) => {
  const v = voce(ch)
  return !v || !Array.isArray(v.sa) ? true : v.sa.includes(verbo)
}
/* i verbi che almeno una delle unità citate sa fare — l'incrocio, non
   l'unione: un ordine firmato «alla guardia» lo eseguono tutte, e se una
   non sa farlo l'ordine è sbagliato */
function sannoTutti(unita) {
  const liste = unita.map(u => (voce(u.ch) || {}).sa).filter(Array.isArray)
  if (!liste.length) return Object.keys(VERBI)
  return Object.keys(VERBI).filter(v => liste.every(l => l.includes(v)))
}

/* ═══ dal vocabolario delle campagne ai verbi del formato ═══
   `src/data/campagne-generale.js` progetta le tappe con un vocabolario
   suo, nato prima di questo formato e più fine: distingue il passo dal
   «vai a», e ha ordini che qui non sono verbi ma **campi** — `se` e
   `quando senti l'allarme` sono `quando`, non `fai`. Questa tabella è
   l'unico posto dove le due lingue si guardano in faccia; `null` vuol
   dire «qui non è un verbo», e l'editor lo dice invece di far finta. */
/* I nomi che usano le campagne, tradotti nei verbi del formato. Le due
   tabelle non coincidono e non devono: la campagna parla al bambino
   («aspetta che»), il formato parla al motore («aspetta»). Quello che
   NON si traduce ha un `perche` scritto, e l'editor lo mostra invece di
   inventarsi un verbo — è così che si è scoperto che sei tappe erano
   ancora scritte col vocabolario a passi, tolto per volontà del papà. */
const DA_CAMPAGNA = {
  vai:              { verbo: 'vai', perche: '' },
  prendi:           { verbo: 'prendi', perche: '' },
  posa:             { verbo: 'posa', perche: '' },
  apri:             { verbo: 'apri', perche: '' },
  attacca:          { verbo: 'attacca', perche: '' },
  aspetta:          { verbo: 'aspetta', perche: '' },
  chiama:           { verbo: 'chiama', perche: '' },
  pattuglia:        { verbo: 'pattuglia', perche: '' },
  segui:            { verbo: 'segui', perche: '' },
  scappa:           { verbo: 'scappa', perche: '' },
  difendi:          { verbo: null, perche: 'difendere un posto non è ancora nel formato' },
  se:               { verbo: null, perche: "non è un verbo: è la guardia «quando» di un ordine" },
  'quando-allarme': { verbo: null, perche: 'non è un verbo: è «quando: segnale:…»' },
}

/* l'ordine in cui si scrivono le chiavi quando si stampa un livello:
   prima chi è, poi com'è fatto, poi come si gioca. In coda ci sono le
   chiavi di un *ordine*: un ordine non ha nessuna delle altre, quindi
   l'unica cosa che conta è la loro fila — che è quella con cui si legge
   ad alta voce, «la guardia, quando suona il rosso, va alla campana».
   Serve perché il testo che esce dall'editor sia sempre lo stesso a
   parità di livello: senza, un ordine costruito a menu e lo stesso
   ordine riletto da un file uscirebbero scritti in due modi diversi. */
const ORDINE_CHIAVI = ['id', 'nome', 'fragile', 'racconto', 'idea', 'mappa', 'calco', 'zone', 'ronde',
                       'fazioni', 'segnali', 'ordini', 'cassetta', 'par', 'dritta',
                       'varianti', 'soluzioni',
                       'chi', 'quando', 'fai', 'bersaglio', 'finche']

/* ═══════════ 2. LEGGERE LA GRIGLIA ═══════════ */

const voce = ch => LEGENDA[ch] || null
const solido = ch => !!(voce(ch) && voce(ch).solido)
const dove = (x, y) => `riga ${y}, colonna ${x}`
const righeDi = liv => Array.isArray(liv && liv.mappa) ? liv.mappa : []
const larghezza = liv => righeDi(liv).reduce((m, r) => Math.max(m, String(r).length), 0)
const cella = (liv, x, y) => (righeDi(liv)[y] || '')[x] || ''

/* tutte le celle che non sono terreno, in ordine di lettura */
function segni(liv) {
  const fuori = []
  righeDi(liv).forEach((riga, y) => [...String(riga)].forEach((ch, x) => {
    const v = voce(ch)
    if (v && v.che !== 'terreno') fuori.push({ ch, x, y, ...v })
  }))
  return fuori
}

/* le unità, numerate nell'ordine di lettura: la seconda guardia è
   `guardia#2`, e `guardia` da sola vuol dire tutte quante */
function unita(liv) {
  const conta = {}
  return segni(liv).filter(s => s.che === 'unità').map(s => {
    conta[s.ch] = (conta[s.ch] || 0) + 1
    return { ...s, n: conta[s.ch], id: `${s.nome}#${conta[s.ch]}`,
             fazione: fazioneDi(liv, s.ch) }
  })
}

function fazioneDi(liv, ch) {
  const f = (liv && liv.fazioni) || {}
  for (const k of Object.keys(f))
    if (String(f[k].simboli || '').includes(ch)) return { id: k, ...f[k] }
  return null
}

/* ═══════════ 3. I BERSAGLI ═══════════
   Un ordine cita le cose per nome. Qui si mette insieme l'elenco di
   tutti i nomi che in questo livello vogliono dire qualcosa, e di che
   genere sono: è la tabella su cui si controlla che «vai alla fontana»
   non passi quando sulla mappa la fontana non c'è. */
function bersagli(liv) {
  const tabella = new Map()
  /* due guardie si chiamano tutte e due «guardia», ed è giusto così: un
     ordine firmato alla guardia vale per tutte. Il doppio nome che non
     va bene è quello fra generi diversi — una zona che si chiama come
     un oggetto, e nessuno sa più cosa vuol dire «vai al cortile». */
  const aggiungi = (nome, tipo, extra) => {
    if (!nome) return
    const gia = tabella.get(nome)
    if (!gia) { tabella.set(nome, { nome, tipo, ...extra }); return }
    if (gia.tipo !== tipo || gia.ch !== (extra && extra.ch)) gia.doppio = true
  }
  for (const s of segni(liv)) aggiungi(s.nome, s.che, { ch: s.ch })
  const zone = (liv && liv.zone) || {}
  for (const lettera of Object.keys(zone)) aggiungi(nomeZona(zone[lettera]), 'zona', { lettera })
  for (const nome of Object.keys((liv && liv.ronde) || {})) aggiungi(nome, 'ronda')
  for (const s of SEGNALI.concat((liv && liv.segnali) || [])) aggiungi(s, 'segnale')
  return tabella
}

const nomeZona = z => (typeof z === 'string' ? z : (z && z.nome) || '')

/* i nomi di legenda che il livello *potrebbe* avere ma non ha: servono
   per il messaggio buono, quello che dice «la chiave non c'è» invece di
   «bersaglio sconosciuto» */
const NOMI_LEGENDA = new Map(Object.entries(LEGENDA)
  .filter(([, v]) => v.che !== 'terreno').map(([ch, v]) => [v.nome, ch]))

/* ═══════════ 4. VARIANTI ═══════════
   Una variante è un livello parziale steso sopra a quello base. Le
   chiavi che porta sostituiscono quelle di sotto (la mappa per intero,
   non riga per riga: mezza mappa nuova non si legge in una diff), e
   `sposta` è la scorciatoia per il caso che capita sempre — la stessa
   stanza con la chiave da un'altra parte. */
function fondi(base, patch) {
  const fuori = { ...base }
  for (const [k, v] of Object.entries(patch || {})) {
    if (k === 'sposta') continue
    if (k === 'zone') fuori.zone = { ...(base.zone || {}), ...v }
    else fuori[k] = v
  }
  fuori.varianti = []
  const guai = patch && patch.sposta ? applicaSposta(fuori, patch.sposta) : []
  return { liv: fuori, guai }
}

/* muove un simbolo unico in un'altra cella. Torna l'elenco dei guai
   trovati: il validatore li rigira come errori della variante. */
function applicaSposta(liv, sposta) {
  const guai = []
  const righe = righeDi(liv).map(r => [...String(r)])
  for (const [ch, punto] of Object.entries(sposta)) {
    const quante = righe.flat().filter(c => c === ch).length
    if (quante !== 1) {
      guai.push(`la variante sposta «${ch}», ma sulla mappa ${quante === 0 ? 'non ce n\'è nessuno' : 'ce ne sono ' + quante}: ` +
                `si sposta solo un simbolo che compare una volta sola`)
      continue
    }
    const [x, y] = Array.isArray(punto) ? punto : [punto && punto.x, punto && punto.y]
    if (!righe[y] || !righe[y][x]) { guai.push(`la variante sposta «${ch}» in ${dove(x, y)}, che è fuori dalla mappa`); continue }
    if (righe[y][x] !== '.') {
      guai.push(`la variante sposta «${ch}» in ${dove(x, y)}, dove c'è già «${righe[y][x]}»`)
      continue
    }
    righe.forEach(r => r.forEach((c, i) => { if (c === ch) r[i] = '.' }))
    righe[y][x] = ch
  }
  liv.mappa = righe.map(r => r.join(''))
  return guai
}

/* tutte le versioni giocabili: la base e le sue varianti, già fuse */
function versioni(liv) {
  const fuori = [{ etichetta: 'base', liv }]
  const varianti = (liv && liv.varianti) || []
  varianti.forEach((v, i) => {
    const { liv: unito, guai } = fondi({ ...liv, varianti: [] }, v)
    fuori.push({ etichetta: `variante ${i + 1}${v && v.nome ? ' «' + v.nome + '»' : ''}`, liv: unito, guai })
  })
  return fuori
}

/* ═══════════ 5. IL VALIDATORE ═══════════

   Due elenchi: `errori` sono cose che rendono il livello ingiocabile o
   incoerente, `avvisi` sono cose che quasi sempre sono sviste ma che
   qualcuno potrebbe volere davvero. Tutti e due parlano italiano e
   dicono *quale* cosa non torna, non *dove* nel file: chi scrive un
   livello ragiona per chiavi e per tesori, non per righe di codice. */

function valida(liv, opzioni) {
  const o = opzioni || {}
  const errori = [], avvisi = []
  const err = m => errori.push(m)
  const avv = m => avvisi.push(m)

  if (!liv || typeof liv !== 'object') {
    return { ok: false, errori: ['non è nemmeno un livello: mi aspetto un oggetto con dentro almeno `mappa` e `par`'], avvisi: [] }
  }
  for (const g of o.guai || []) err(g)

  /* ── il racconto ── */
  if (!liv.nome) err('manca il nome della tappa (`nome`): è quello che il bambino legge in cima')
  const racconto = liv.racconto || []
  if (!Array.isArray(racconto) || racconto.length === 0)
    err('manca il racconto (`racconto`): due righe che dicono cosa sta succedendo')
  else if (racconto.length > 3)
    avv(`il racconto è di ${racconto.length} righe: due bastano, la terza nessuno la legge`)

  /* ── la griglia ── */
  const righe = righeDi(liv)
  if (!righe.length) {
    err('manca la mappa (`mappa`): un elenco di righe di caratteri')
    return { ok: false, errori, avvisi }
  }
  const W = larghezza(liv), H = righe.length
  const storte = righe.map((r, y) => ({ y, len: String(r).length }))
                      .filter(r => r.len !== String(righe[0]).length)
  if (storte.length)
    err(`la griglia non è rettangolare: la prima riga è lunga ${String(righe[0]).length}, ` +
        storte.map(r => `la ${r.y + 1}ª ${r.len}`).join(', '))
  if (W < 4 || H < 4) err(`la griglia è ${W}×${H}: sotto il 4×4 non ci sta né un corridoio né un muro`)

  /* simboli sconosciuti */
  const ignoti = []
  righe.forEach((riga, y) => [...String(riga)].forEach((ch, x) => {
    if (!voce(ch)) ignoti.push({ ch, x, y })
  }))
  for (const gruppo of raggruppa(ignoti, i => i.ch))
    err(`il simbolo «${gruppo[0].ch}» non è nella legenda: compare ${quanti(gruppo.length, 'volta', 'volte')} ` +
        `(la prima in ${dove(gruppo[0].x, gruppo[0].y)}). ` +
        `Quelli buoni sono: ${Object.keys(LEGENDA).join(' ')}`)

  /* bordi chiusi */
  const aperti = []
  for (let x = 0; x < W; x++) { if (!solido(cella(liv, x, 0))) aperti.push([x, 0]); if (!solido(cella(liv, x, H - 1))) aperti.push([x, H - 1]) }
  for (let y = 1; y < H - 1; y++) { if (!solido(cella(liv, 0, y))) aperti.push([0, y]); if (!solido(cella(liv, W - 1, y))) aperti.push([W - 1, y]) }
  if (aperti.length)
    err(`il bordo è aperto in ${quanti(aperti.length, 'punto', 'punti')} (${aperti.slice(0, 3).map(p => dove(p[0], p[1])).join('; ')}` +
        `${aperti.length > 3 ? '; …' : ''}): un'unità uscirebbe dalla mappa`)

  /* ── l'eroe ── */
  const eroi = segni(liv).filter(s => s.eroe)
  if (eroi.length === 0) err('manca l\'eroe «@»: senza di lui non c\'è nessuno a cui firmare il primo ordine')
  else if (eroi.length > 1)
    err(`ci sono ${eroi.length} eroi «@» (${eroi.map(e => dove(e.x, e.y)).join('; ')}): ce ne va uno solo`)

  /* ── le fazioni ── */
  const fazioni = liv.fazioni || {}
  const nomiFazioni = Object.keys(fazioni)
  if (!nomiFazioni.length) err('mancano le fazioni (`fazioni`): senza non si sa chi comanda chi')
  let squadre = 0
  for (const k of nomiFazioni) {
    const f = fazioni[k] || {}
    if (!AUTORI.includes(f.autore))
      err(`la fazione «${k}» ha autore «${f.autore}»: si scrive ${AUTORI.map(a => '`' + a + '`').join(' o ')}`)
    if (f.autore === 'giocatore') squadre++
    for (const ch of String(f.simboli || '')) {
      const v = voce(ch)
      if (!v) err(`la fazione «${k}» arruola il simbolo «${ch}», che non è nella legenda`)
      else if (v.che !== 'unità') err(`la fazione «${k}» arruola «${ch}» (${v.nome}), che non è un'unità`)
    }
    if (!String(f.simboli || '').length) avv(`la fazione «${k}» non arruola nessun simbolo`)
  }
  if (nomiFazioni.length && !squadre)
    err('nessuna fazione ha `autore: \'giocatore\'`: il bambino non avrebbe nessuno a cui dare ordini')
  const senzaFazione = raggruppa(unita(liv).filter(u => !u.fazione), u => u.ch)
  for (const gruppo of senzaFazione)
    err(`«${gruppo[0].ch}» (${gruppo[0].nome}) sta sulla mappa ${quanti(gruppo.length, 'volta', 'volte')} ` +
        `ma non è in nessuna fazione: aggiungi il simbolo ai «simboli» di una fazione`)
  for (const u of unita(liv)) {
    const doppie = nomiFazioni.filter(k => String((fazioni[k] || {}).simboli || '').includes(u.ch))
    if (doppie.length > 1) {
      err(`il simbolo «${u.ch}» è in due fazioni insieme (${doppie.join(', ')})`)
      break
    }
  }
  const miei = unita(liv).filter(u => u.fazione && u.fazione.autore === 'giocatore')
  if (nomiFazioni.length && squadre && !miei.length)
    err('sulla mappa non c\'è nessuna unità del giocatore: gli ordini del bambino non avrebbero destinatario')

  /* ── le zone ── */
  const zone = liv.zone || {}
  const calco = liv.calco || []
  const usate = new Set()
  /* certi guai si ripeterebbero una volta per cella: la zona che copre
     un muro lungo dieci passi è un guaio solo, e va detto una volta */
  const dettiUnaVolta = new Set()
  const unaVolta = (di, m, chiave) => {
    if (dettiUnaVolta.has(chiave)) return
    dettiUnaVolta.add(chiave); di(m)
  }
  const errUnaVolta = (m, chiave) => unaVolta(err, m, chiave)
  const avvUnaVolta = (m, chiave) => unaVolta(avv, m, chiave)
  if (calco.length) {
    if (calco.length !== H)
      err(`il calco delle zone ha ${calco.length} righe e la mappa ${H}: devono essere sovrapponibili`)
    calco.forEach((riga, y) => {
      if (String(riga).length !== W)
        err(`la riga ${y + 1} del calco è lunga ${String(riga).length} invece di ${W}`)
      ;[...String(riga)].forEach((ch, x) => {
        if (ch === '.' || ch === ' ') return
        if (!/[A-Z]/.test(ch)) { err(`nel calco delle zone c'è «${ch}» in ${dove(x, y)}: le zone si segnano con una lettera maiuscola`); return }
        usate.add(ch)
        if (!zone[ch]) return   // segnalato più sotto, una volta sola
        if (solido(cella(liv, x, y)))
          errUnaVolta(`la zona «${nomeZona(zone[ch])}» copre dei muri (il primo in ${dove(x, y)}): nessuno ci può pattugliare`, ch)
      })
    })
  }
  for (const ch of usate)
    if (!zone[ch]) err(`il calco usa la lettera «${ch}» ma fra le zone non c'è scritto come si chiama quella zona`)
  for (const ch of Object.keys(zone)) {
    if (!nomeZona(zone[ch])) err(`la zona «${ch}» non ha nome: gli ordini la chiamerebbero come?`)
    if (!usate.has(ch))
      err(`la zona «${nomeZona(zone[ch]) || ch}» è dichiarata ma nel calco non è disegnata da nessuna parte`)
    else {
      const pezzi = pezziDi(liv, calco, ch)
      if (pezzi > 1)
        avv(`la zona «${nomeZona(zone[ch])}» è in ${pezzi} pezzi staccati: chi la pattuglia non può saltare dall'uno all'altro`)
    }
  }
  /* le ronde: giri fatti di zone, nell'ordine in cui si visitano */
  for (const [nome, giro] of Object.entries(liv.ronde || {})) {
    if (!Array.isArray(giro) || giro.length < 2)
      err(`la ronda «${nome}» ha ${Array.isArray(giro) ? giro.length : 0} tappe: un giro ne vuole almeno due`)
    for (const lettera of (Array.isArray(giro) ? giro : []))
      if (!zone[lettera])
        err(`la ronda «${nome}» passa dalla zona «${lettera}», che non esiste`)
  }

  /* ── i bersagli citati ── */
  const tabella = bersagli(liv)
  for (const [nome, b] of tabella)
    if (b.doppio) err(`«${nome}» è il nome di due cose diverse (una zona e un oggetto, o due zone): un ordine non saprebbe quale`)

  const citazioni = new Map()      // nome mancante → dove è citato
  const cita = (nome, posto) => {
    if (!nome) return
    if (!citazioni.has(nome)) citazioni.set(nome, [])
    citazioni.get(nome).push(posto)
  }

  const controllaOrdine = (ord, posto, opz) => {
    const q = opz || {}
    if (!ord || typeof ord !== 'object') { err(`${posto}: non è un ordine`); return }
    const verbo = VERBI[ord.fai]
    if (!verbo) {
      err(`${posto}: «${ord.fai}» non è un ordine che si può firmare. ` +
          `Quelli che ci sono: ${Object.keys(VERBI).join(', ')}`)
      return
    }
    if (q.cassetta && !q.cassetta.includes(ord.fai))
      err(`${posto}: usa «${ord.fai}», che non è nella cassetta degli ordini (${q.cassetta.join(', ')})`)
    /* chi lo esegue */
    const chi = chiRisolve(liv, ord.chi)
    if (!ord.chi) err(`${posto}: non dice a chi è firmato (manca «chi»)`)
    else if (!chi.length) err(`${posto}: è firmato a «${ord.chi}», che sulla mappa non c'è`)
    else if (q.dellaCasa && chi.some(u => u.fazione && u.fazione.autore === 'giocatore'))
      err(`${posto}: il livello comanda «${ord.chi}», che è del giocatore — quelle unità le comanda il bambino`)
    else if (q.delGiocatore && chi.some(u => !u.fazione || u.fazione.autore !== 'giocatore'))
      err(`${posto}: il bambino non può dare ordini a «${ord.chi}», che non è dei suoi`)
    /* sa farlo? Il verbo esiste, il bersaglio è del genere giusto, ma il
       cane non apre i portoni. È il terzo lato del filtro — verbo ×
       genere del bersaglio × **chi lo esegue** — ed è quello che rende
       diverse fra loro le unità di una tappa. */
    for (const gruppo of raggruppa(chi.filter(u => !saFare(u.ch, ord.fai)), u => u.ch))
      err(`${posto}: ${unIl(gruppo[0].nome)} non sa «${ord.fai}». ` +
          `Sa fare: ${(voce(gruppo[0].ch).sa || []).join(', ')}`)
    /* il bersaglio */
    if (verbo.bersaglio === 'serve' && !ord.bersaglio)
      err(`${posto}: «${ord.fai}» vuole un bersaglio (${verbo.ammessi.join(', ')})`)
    if (verbo.bersaglio === 'vietato' && ord.bersaglio)
      err(`${posto}: «${ord.fai}» non vuole bersagli, e invece cita «${ord.bersaglio}»`)
    if (ord.bersaglio) {
      const b = tabella.get(ord.bersaglio)
      if (!b) cita(ord.bersaglio, posto)
      else if (verbo.ammessi && !verbo.ammessi.includes(b.tipo))
        err(`${posto}: «${ord.fai} ${ord.bersaglio}» non ha senso — ${ord.bersaglio} è ${unA(b.tipo)}, ` +
            `e «${ord.fai}» vuole ${verbo.ammessi.join(' o ')}`)
    }
    /* le condizioni */
    if (verbo.vuoleFinche && !ord.finche)
      err(`${posto}: «aspetta» senza «finche» è un'unità che si ferma e non riparte più`)
    for (const campo of ['quando', 'finche'])
      if (ord[campo]) controllaCondizione(ord[campo], `${posto} · ${campo === 'finche' ? 'finché' : 'quando'}`)
  }

  const controllaCondizione = (testo, posto) => {
    const [capo, resto] = String(testo).split(':')
    const c = CONDIZIONI[capo]
    if (!c) {
      err(`${posto}: «${testo}» non è una condizione. Quelle che ci sono: ` +
          Object.keys(CONDIZIONI).join(', '))
      return
    }
    if (c.solo) {
      if (resto) err(`${posto}: «${capo}» si scrive da solo, senza due punti`)
      return
    }
    if (!resto) { err(`${posto}: «${capo}» vuole un bersaglio, si scrive «${capo}:qualcosa»`); return }
    const b = tabella.get(resto)
    if (!b) cita(resto, posto)
    else if (!c.ammessi.includes(b.tipo))
      err(`${posto}: «${capo}:${resto}» non ha senso — ${resto} è ${unA(b.tipo)}, e «${capo}» vuole ${c.ammessi.join(' o ')}`)
  }

  /* ── gli ordini fissi del livello ── */
  const ordini = liv.ordini || []
  if (!Array.isArray(ordini)) err('`ordini` deve essere un elenco')
  else ordini.forEach((ord, i) => controllaOrdine(ord, `ordine ${i + 1} del livello`, { dellaCasa: true }))

  /* ── la cassetta ── */
  const cassetta = liv.cassetta || []
  if (!Array.isArray(cassetta) || !cassetta.length)
    err('la cassetta degli ordini è vuota (`cassetta`): il bambino non avrebbe niente da firmare')
  for (const v of cassetta)
    if (!VERBI[v]) err(`nella cassetta c'è «${v}», che non è un ordine: ${Object.keys(VERBI).join(', ')}`)

  /* ── il par ── */
  if (typeof liv.par !== 'number' || !Number.isFinite(liv.par))
    err('manca il par (`par`): quanti ordini bastano a chiuderla')
  else if (!Number.isInteger(liv.par) || liv.par <= 0)
    err(`il par è ${liv.par}: dev'essere un numero intero maggiore di zero`)

  /* ── le soluzioni ──
     Una soluzione può essere segnata `fragile`: è il piano che vince la
     base e **cade su una variante**. Non è un difetto, è il pezzo che
     dimostra che le tre scene servono a qualcosa — il giorno che il
     motore ci sarà, il test la gioca e pretende che perda. Perciò una
     fragile è quasi sempre più corta del par, e il par largo di manica
     non glielo si rinfaccia. Quello che invece non si può fare è
     scrivere *solo* fragili: resterebbe un livello che nessuno ha
     dimostrato di poter chiudere. */
  const soluzioni = liv.soluzioni || []
  if (!Array.isArray(soluzioni) || !soluzioni.length)
    err('manca la soluzione (`soluzioni`): almeno una, o nessuno può dimostrare che il livello si chiude')
  else soluzioni.forEach((sol, i) => {
    const nome = sol && sol.nome ? `«${sol.nome}»` : `${i + 1}`
    const suoi = (sol && sol.ordini) || []
    if (sol && sol.fragile !== undefined && typeof sol.fragile !== 'boolean')
      err(`la soluzione ${nome} ha «fragile: ${sol.fragile}»: è un sì o un no (\`true\` o \`false\`)`)
    if (!Array.isArray(suoi) || !suoi.length) { err(`la soluzione ${nome} non ha ordini`); return }
    suoi.forEach((ord, k) => controllaOrdine(ord, `soluzione ${nome}, ordine ${k + 1}`,
                                             { cassetta: cassetta.length ? cassetta : null, delGiocatore: true }))
    if (typeof liv.par === 'number' && suoi.length > liv.par)
      err(`la soluzione ${nome} usa ${suoi.length} ordini ma il par è ${liv.par}: ` +
          `o è troppo lunga, o il par è troppo stretto`)
    if (typeof liv.par === 'number' && suoi.length < liv.par && !(sol && sol.fragile))
      avv(`la soluzione ${nome} usa ${suoi.length} ordini e il par è ${liv.par}: il par è largo di manica`)
  })
  if (Array.isArray(soluzioni) && soluzioni.length && soluzioni.every(s => s && s.fragile))
    err('tutte le soluzioni sono segnate «fragile»: una fragile è quella che deve *cadere* su una ' +
        'variante, quindi ce ne vuole almeno una che le vinca tutte')

  /* i bersagli che nessuno ha trovato: il messaggio che serve davvero */
  for (const [nome, posti] of citazioni) {
    const ch = NOMI_LEGENDA.get(nome)
    const quante = `${quanti(posti.length, 'ordine ci fa riferimento', 'ordini ci fanno riferimento')} ` +
                   `(${posti.join('; ')})`
    if (ch) err(`«${nome}» («${ch}») non compare nella mappa, e ${quante}`)
    else err(`«${nome}» non è niente di questo livello — né una cosa sulla mappa, né una zona, né un segnale — e ${quante}`)
  }

  /* ── ci si arriva? ──
     Due allagamenti dall'eroe: uno coi portoni chiusi, uno con tutti
     aperti. Quello che non si raggiunge nemmeno con tutto aperto è
     murato, ed è un livello impossibile scritto senza accorgersene. */
  if (eroi.length === 1 && !storte.length) {
    const chiuso = allaga(liv, eroi[0], false)
    const aperto = allaga(liv, eroi[0], true)
    for (const s of segni(liv)) {
      if (s.che === 'terreno') continue
      const vicino = attorno(liv, s, aperto)
      if (!vicino) {
        /* un'unità chiusa in una stanza sigillata può essere un prigioniero
           voluto; una chiave o un portone irraggiungibili sono sempre una
           svista, perché il livello ci chiede di andarci */
        const m = `${maiuscola(unIl(s.nome))} «${s.ch}» in ${dove(s.x, s.y)} è murato: ` +
                  `dall'eroe non ci si arriva nemmeno coi portoni tutti aperti`
        if (s.che === 'unità') avv(m); else err(m)
        continue
      }
      if (!attorno(liv, s, chiuso) && !haChiavi(liv))
        avvUnaVolta(`per arrivare ${alla(s.nome)} «${s.ch}» bisogna aprire un portone, ` +
                    `ma sulla mappa non c'è né una chiave né una leva`, 'chiuso-a-chiave')
    }
  }

  return { ok: errori.length === 0, errori, avvisi }
}

/* valida la base e tutte le varianti, e mette davanti a ogni guaio da
   che versione viene: un errore che c'è solo nella terza variante è la
   cosa più difficile da trovare a mano. */
function validaTutto(liv) {
  const errori = [], avvisi = []
  /* Un guaio che sta nella base ricompare tale e quale in tutte le
     varianti, che della base sono una copia. Ripeterlo tre volte
     seppellisce quello che invece *è* solo della variante — che è il
     più difficile da trovare a mano, ed è il motivo per cui il
     validatore le guarda tutte. */
  const gia = new Set()
  for (const v of versioni(liv)) {
    const esito = valida(v.liv, { guai: v.guai })
    const capo = v.etichetta === 'base' ? '' : v.etichetta + ' · '
    for (const m of esito.errori) { if (!gia.has(m)) { gia.add(m); errori.push(capo + m) } }
    for (const m of esito.avvisi) { if (!gia.has(m)) { gia.add(m); avvisi.push(capo + m) } }
  }
  const quante = ((liv && liv.varianti) || []).length + 1
  if (quante < 3)
    avvisi.push(`questo livello si gioca in ${quante} version${quante === 1 ? 'e' : 'i'}: ` +
                `tre (la base più due varianti) è quello che serve perché rigiocarlo non sia rifarlo uguale`)
  return { ok: errori.length === 0, errori, avvisi }
}

/* ── attrezzi dei controlli ── */

function allaga(liv, da, portoniAperti) {
  const W = larghezza(liv), H = righeDi(liv).length
  const visto = new Set()
  const passa = (x, y) => {
    const ch = cella(liv, x, y)
    if (!ch) return false
    const v = voce(ch)
    if (!v) return false
    if (portoniAperti && v.apribile) return true
    return !v.solido
  }
  const coda = [[da.x, da.y]]
  visto.add(da.x + ',' + da.y)
  while (coda.length) {
    const [x, y] = coda.shift()
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
      const k = nx + ',' + ny
      if (visto.has(k) || !passa(nx, ny)) continue
      visto.add(k); coda.push([nx, ny])
    }
  }
  return visto
}

/* una cosa è raggiungibile se lo è la sua cella o una lì accanto: un
   portone sta dentro il muro, e non ci si cammina sopra */
function attorno(liv, s, insieme) {
  if (insieme.has(s.x + ',' + s.y)) return true
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => insieme.has((s.x + dx) + ',' + (s.y + dy)))
}

const haChiavi = liv => segni(liv).some(s => s.nome === 'chiave' || s.azionabile)

/* quanti pezzi staccati fa una zona: una ronda non salta i muri */
function pezziDi(liv, calco, lettera) {
  const celle = new Set()
  calco.forEach((riga, y) => [...String(riga)].forEach((ch, x) => { if (ch === lettera) celle.add(x + ',' + y) }))
  let pezzi = 0
  while (celle.size) {
    pezzi++
    const primo = celle.values().next().value
    const coda = [primo]; celle.delete(primo)
    while (coda.length) {
      const [x, y] = coda.pop().split(',').map(Number)
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = (x + dx) + ',' + (y + dy)
        if (celle.has(k)) { celle.delete(k); coda.push(k) }
      }
    }
  }
  return pezzi
}

function chiRisolve(liv, chi) {
  if (!chi) return []
  const tutte = unita(liv)
  const [nome, n] = String(chi).split('#')
  const stessi = tutte.filter(u => u.nome === nome || u.ch === nome)
  if (n) return stessi.filter(u => String(u.n) === n)
  const fazione = tutte.filter(u => u.fazione && u.fazione.id === chi)
  return stessi.length ? stessi : fazione
}

const raggruppa = (lista, chiave) => {
  const m = new Map()
  for (const x of lista) {
    const k = chiave(x)
    if (!m.has(k)) m.set(k, [])
    m.get(k).push(x)
  }
  return [...m.values()]
}
const quanti = (n, uno, tanti) => `${n} ${n === 1 ? uno : tanti}`
const unA = t => (t === 'zona' ? 'una zona' : t === 'unità' ? "un'unità" : t === 'cosa' ? 'una cosa' :
                  t === 'ronda' ? 'una ronda' : t === 'segnale' ? 'un segnale' : 'un ' + t)
const unIl = n => (/^[aeiou]/i.test(n) ? "l'" + n : (n === 'chiave' || n === 'campana' || n === 'leva' || n === 'ladra' ||
                                                     n === 'guardia' || n === 'bandiera' ? 'la ' : 'il ') + n)
const alla = n => (n === 'chiave' || n === 'campana' || n === 'leva' || n === 'ladra' ||
                   n === 'guardia' || n === 'bandiera' ? 'alla ' : /^[aeiou]/i.test(n) ? "all'" : 'al ') + n
const maiuscola = s => s.charAt(0).toUpperCase() + s.slice(1)

/* ═══════════ 6. LEGGERE E SCRIVERE IL TESTO ═══════════
   Il formato finale è sorgente JavaScript, perché è dentro un file
   JavaScript che il livello andrà a vivere: virgole in coda, chiavi
   senza virgolette e commenti sono comodità che valgono più di una
   parentela con JSON. Per rileggerlo si usa `Function`, che qui è
   legittimo: gira solo dentro uno strumento di sviluppo, sulla
   macchina di chi ha scritto il testo. */
function leggi(testo) {
  let t = String(testo || '').trim()
  t = t.replace(/^export\s+default\s+/, '')
       .replace(/^export\s+const\s+[\w$]+\s*=\s*/, '')
       .replace(/^const\s+[\w$]+\s*=\s*/, '')
       .replace(/[;,]\s*$/, '')
  if (!t) throw new Error('non c\'è niente da leggere')
  let liv
  try {
    liv = Function('"use strict"; return (' + t + ')')()
  } catch (e) {
    throw new Error('il testo non è un livello leggibile: ' + e.message +
                    '. Deve essere un oggetto { … } con dentro `mappa`')
  }
  if (!liv || typeof liv !== 'object' || Array.isArray(liv))
    throw new Error('il testo non è un oggetto { … }')
  return liv
}

function scrivi(liv) { return stampa(liv, '') }

function stampa(v, ind) {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (typeof v === 'string') return virgolette(v)
  if (Array.isArray(v)) {
    if (!v.length) return '[]'
    const pezzi = v.map(x => stampa(x, ind + '  '))
    const inLinea = '[' + pezzi.join(', ') + ']'
    const tuttiCorti = pezzi.every(p => !p.includes('\n'))
    if (tuttiCorti && inLinea.length + ind.length <= 74 && !v.every(x => typeof x === 'string' && x.length > 6))
      return inLinea
    return '[\n' + pezzi.map(p => ind + '  ' + p).join(',\n') + ',\n' + ind + ']'
  }
  const chiavi = Object.keys(v).sort(perOrdine)
  if (!chiavi.length) return '{}'
  const pezzi = chiavi.map(k => nomeChiave(k) + ': ' + stampa(v[k], ind + '  '))
  const inLinea = '{ ' + pezzi.join(', ') + ' }'
  if (!pezzi.some(p => p.includes('\n')) && inLinea.length + ind.length <= 74) return inLinea
  return '{\n' + pezzi.map(p => ind + '  ' + p).join(',\n') + ',\n' + ind + '}'
}

function perOrdine(a, b) {
  const ia = ORDINE_CHIAVI.indexOf(a), ib = ORDINE_CHIAVI.indexOf(b)
  if (ia < 0 && ib < 0) return 0
  if (ia < 0) return 1
  if (ib < 0) return -1
  return ia - ib
}
const nomeChiave = k => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : virgolette(k))
const virgolette = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'"

/* ═══════════ 7. UN LIVELLO VUOTO ═══════════
   Serve all'editor quando si apre e al bottone «ricomincia». Non è un
   esempio: è il minimo che passa i controlli di forma. */
function vuoto(W, H) {
  const w = W || 14, h = H || 10
  const righe = []
  for (let y = 0; y < h; y++)
    righe.push(y === 0 || y === h - 1 ? '#'.repeat(w) : '#' + '.'.repeat(w - 2) + '#')
  righe[2] = sostituisci(righe[2], 2, '@')
  righe[h - 3] = sostituisci(righe[h - 3], w - 3, 'X')
  return {
    id: 'senza-nome', nome: 'Senza nome',
    racconto: ['Due righe che dicono cosa sta succedendo.', 'La seconda dice cosa vuole il generale.'],
    mappa: righe,
    calco: righe.map(r => '.'.repeat(r.length)),
    zone: {},
    fazioni: {
      nostri:  { nome: 'i nostri',  autore: 'giocatore', simboli: '@se' },
      banditi: { nome: 'i banditi', autore: 'livello',   simboli: 'olgc' },
    },
    ordini: [],
    cassetta: ['vai', 'prendi', 'apri', 'aspetta'],
    par: 1,
    varianti: [],
    soluzioni: [{ nome: 'la prima', ordini: [{ chi: 'eroe', fai: 'vai', bersaglio: 'uscita' }] }],
  }
}
const sostituisci = (riga, x, ch) => riga.slice(0, x) + ch + riga.slice(x + 1)

/* ═══════════ 8. quello che esce ═══════════ */
globalThis.MAPPE = {
  LEGENDA, VERBI, CONDIZIONI, SEGNALI, AUTORI, DA_CAMPAGNA,
  valida, validaTutto, versioni, fondi,
  leggi, scrivi, stampa, vuoto, sostituisci,
  voce, solido, segni, unita, bersagli, larghezza, cella, nomeZona,
  saFare, sannoTutti, chiRisolve,
}
})()
