// Il log della misura del telefono (docs/core/vecchio-telefono.md): testo semplice da leggere e da mandare dal modulo, con in
// fondo una riga di dati per lo strumento (`DATI {…}`). Niente three qui: si prova senza browser. Le soglie sono ms di LAVORO
// per fotogramma di una sola scena di prova: un gioco ne mette insieme parecchie dentro i 16 ms dei 60 fps.
export const SOGLIE = { bene: 8, tanto: 16 }   // sotto 8 ms ✓, fino a 16 ~, sopra ✗
export const CPU = { veloce: 250, lenta: 500 } // ms della prova JS: un computer da scrivania sta fra 110 e 160

const segno = ms => (ms <= SOGLIE.bene ? 'ok ' : ms <= SOGLIE.tanto ? '~  ' : 'XX ')
const nota = r => (r.errore ? `non regge (${r.errore})` : `${String(r.ms).padStart(5)} ms  p95 ${String(r.p95).padStart(5)}  ${String(r.fps).padStart(2)} fps  ${r.mpx} Mpx`)

const trova = (ris, id) => ris.find(r => r.id === id && !r.errore)
// la prova più pesante di una famiglia che sta ancora sotto la soglia: «regge fino a»
const reggeFino = (ris, fam, soglia = SOGLIE.tanto) => {
  const f = ris.filter(r => r.famiglia === fam && !r.errore)
  const buone = f.filter(r => r.ms <= soglia)
  return { tutte: f, ultima: buone[buone.length - 1] || null, prima: f[0] || null, nessuna: !buone.length }
}

// cosa dire, in poche righe: dove il telefono soffre e cosa si può togliere
export function lettura(dati) {
  const ris = dati.risultati || [], righe = []
  if (dati.js != null) righe.push(`CPU: ${dati.js} ms (computer 110-160): ${dati.js <= CPU.veloce ? 'veloce' : dati.js <= CPU.lenta ? 'media' : 'lenta, il JS dei giochi pesa'}.`)
  const base = trova(ris, 'vuoto')
  if (base) righe.push(`Fotogramma vuoto: ${base.ms} ms${base.ms > 3 ? ' (alto: ogni fotogramma parte già in salita)' : ''}.`)
  const pieno = ris.filter(r => r.id.startsWith('pieno-') && !r.errore)
  const nat = trova(ris, 'pieno-nativo')
  if (nat) righe.push(`Pixel: a risoluzione piena ${nat.ms} ms (${nat.mpx} Mpx)${nat.ms > SOGLIE.tanto ? ' = TROPPO, il pixel ratio va tenuto sotto' : ''}.` +
    (pieno.length ? ` Regge a pixel ratio ${(pieno.filter(r => r.ms <= SOGLIE.tanto).map(r => r.id.slice(6)).pop()) || 'nessuno'}.` : ''))
  const pes = trova(ris, 'pesante-1'), leg = trova(ris, 'pieno-1')
  if (pes && leg) righe.push(`Shader: il pesante costa ${(pes.ms / Math.max(.1, leg.ms)).toFixed(1)} volte il leggero (a pixel ratio 1)${pes.ms > SOGLIE.tanto ? ': nebbie e luci a tutto schermo vanno ridotte' : ''}.`)
  const st1 = trova(ris, 'strati-1'), stn = trova(ris, 'strati-nativo')
  if (st1 || stn) righe.push(`Sovrapposizioni: 8 strati ${st1 ? st1.ms + ' ms a pixel ratio 1' : ''}${stn ? ', ' + stn.ms + ' ms a quello vero' : ''}${(stn || st1).ms > SOGLIE.tanto ? ' = le sfumature a schermo intero pesano' : ''}.`)
  const sc = reggeFino(ris, 'esplosioni')
  if (sc.tutte.length) righe.push(sc.nessuna ? `Esplosioni: anche la più piccola (${sc.prima.ms} ms) è troppo: scintille grandi e sfumate sono il guaio.`
    : `Esplosioni: regge fino a ${sc.ultima.nome.split(' (')[0]}${sc.ultima === sc.tutte[sc.tutte.length - 1] ? ' (tutte)' : ''}.`)
  const tr = reggeFino(ris, 'geometria')
  if (tr.tutte.length) righe.push(tr.nessuna ? 'Triangoli: già diecimila con le luci sono troppi.' : `Triangoli: regge fino a ${tr.ultima.nome.split(' in ')[0]}.`)
  const ch = reggeFino(ris, 'chiamate')
  if (ch.tutte.length) righe.push(ch.nessuna ? 'Chiamate: già trenta oggetti separati sono troppi.' : `Chiamate: regge fino a ${ch.ultima.nome.split(' oggetti')[0]} oggetti separati.`)
  const om = ris.filter(r => r.famiglia === 'ombre' && !r.errore)
  if (om.length) { const m = om[0]; righe.push(`Ombre: ${m.ms} ms per 30 oggetti${m.ms - (base ? base.ms : 0) > SOGLIE.tanto ? ' = spegnerle' : ''}.`) }
  const pd = trova(ris, 'post-diretto'), pp = trova(ris, 'post-con-passaggio')
  if (pd && pp) righe.push(`Passaggio finale (tela intermedia): costa ${(pp.ms - pd.ms).toFixed(1)} ms in più${pp.ms - pd.ms > SOGLIE.bene ? ' = pesa, meglio toglierlo' : ''}.`)
  else if (pd && ris.find(r => r.id === 'post-con-passaggio')?.errore) righe.push('Passaggio finale: la tela intermedia non si può nemmeno creare.')
  return righe
}

const data = d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
const modello = ua => {
  const m = /Android[^;)]*;\s*([^;)]+?)(?:\sBuild|\)|;)/.exec(ua || '')
  return m ? m[1].trim() : (/iPhone|iPad/.test(ua || '') ? 'iOS' : 'computer')
}

export function componi(dati, { versione = '', ua = '', cpu = null, memoria = null, quando = new Date() } = {}) {
  const i = dati.info || {}
  const testa = [
    `MISURA DEL TELEFONO ${data(quando)}${versione ? ' v' + versione : ''}${dati.fermata ? ' (INTERROTTA)' : ''}`,
    `${modello(ua)} | schermo ${dati.schermo} dpr ${dati.dpr} | CPU ${cpu ?? '?'} core${memoria ? ', ' + memoria + ' GB' : ''}`,
    `GPU ${i.gpu || '?'} | ${i.versione || ''} | tex ${i.maxTex} | half-float ${i.mezzaPrecisione ? 'si' : 'NO'}`,
  ]
  const corpo = []
  let fam = ''
  for (const r of dati.risultati || []) {
    if (r.famiglia !== fam) { fam = r.famiglia; corpo.push(`[${fam}]`) }
    corpo.push(`${r.errore ? 'XX ' : segno(r.ms)}${r.nome}: ${nota(r)}`)
  }
  const dd = { v: 1, i: { g: i.gpu, t: i.maxTex, h: i.mezzaPrecisione ? 1 : 0 }, s: dati.schermo, d: dati.dpr, js: dati.js,
    r: (dati.risultati || []).map(r => r.errore ? [r.id, 'err'] : [r.id, r.ms, r.p95, r.fps]) }
  return [...testa, '', ...corpo, '', `CPU prova JS: ${dati.js ?? '?'} ms`, '', 'LETTURA', ...lettura(dati).map(r => '- ' + r), '', `DATI ${JSON.stringify(dd)}`].join('\n')
}

/* ═══ Coi modelli veri (grafica/benchmark/veri.js, docs/core/vecchio-telefono-veri.md) ═══
   Le soglie qui sono del fotogramma INTERO di un gioco (lavoro al p95): liscio sotto 20 ms, a scatti sopra 33 (30 fps). */
export const SOGLIE_VERI = { liscio: 20, scatti: 33 }
export const LIMITE_CAMPO = 3400   // i caratteri di un invio del modulo dei giudizi (il campo regge ~3,5k)
const segnoVero = p => (p <= SOGLIE_VERI.liscio ? 'ok ' : p <= SOGLIE_VERI.scatti ? '~  ' : 'XX ')
const SERIE = { discese: ['Scontro nelle discese (eroe leggendario, effetti)', 'mostri', 'mostro'], persone: ['Persone 3D di sopra', 'persone', 'persona'],
                'mostri-sopra': ['Mostri 3D di sopra', 'mostri', 'mostro'], fattoria: ['Fattoria 3D', 'edifici', 'edificio'] }
const misurata = r => r && !r.errore && !r.salta && r.ms != null
const kt = t => (t == null ? '?' : Math.round(t / 1000))
const segnato = x => `${x >= 0 ? '+' : ''}${x}`

/** Il limite di una serie: la prima scena oltre `soglia` ms al p95 (o che non regge) e quella prima. → { regge, oltre, tutte } o null. */
export function limite(ris, serie, soglia = SOGLIE_VERI.scatti) {
  const l = ris.filter(r => r.serie === serie && !r.salta)
  if (!l.length) return null
  const i = l.findIndex(r => r.errore || r.p95 > soglia)
  return { regge: i === -1 ? l[l.length - 1] : i > 0 ? l[i - 1] : null, oltre: i === -1 ? null : l[i], tutte: i === -1 }
}

function rigaVera(r) {
  if (r.errore) return `XX ${r.nome}: non regge (${r.errore})`
  if (r.salta) return `-- ${r.nome}: saltata (la serie era già oltre)`
  if (r.tot != null) return `${segnoVero(r.max)}${r.nome}: ${r.tot} ms in tutto, attesa ${r.attesa}, lavoro ${r.lavoro}, fotogramma max ${r.max}${r.fatte < r.n ? `, ${r.n - r.fatte} vuote` : ''}`
  const piu = [r.primo > Math.max(50, 2 * r.ms) ? `primo ${Math.round(r.primo)}` : '', r.nuovi ? `+${r.nuovi}sh` : '', r.pronto > 1500 ? `pronto ${(r.pronto / 1000).toFixed(1)}s` : '',
               r.stabile === false ? 'instabile' : '', r.nascosta ? 'NASCOSTA' : ''].filter(Boolean).join(' ')
  return `${segnoVero(r.p95)}${r.nome}: ${r.ms}/${r.p95} ms ${r.fps}fps ${r.ch ?? '?'}ch ${kt(r.tri)}kt${piu ? ' ' + piu : ''}`
}

/** Cosa dice la serie: il limite di ogni scena che cresce, i tre colli di bottiglia, chi pesa, il calore, la GPU. */
export function letturaVeri(dati) {
  const ris = dati.risultati || [], righe = [], T = SOGLIE_VERI.scatti
  const m = id => { const r = ris.find(x => x.id === id); return misurata(r) ? r : null }
  const d = (a, b) => +(a.ms - b.ms).toFixed(1)
  if (dati.js != null) righe.push(`CPU: ${dati.js} ms (computer 110-160): ${dati.js <= CPU.veloce ? 'veloce' : dati.js <= CPU.lenta ? 'media' : 'lenta, il JS dei giochi pesa'}.`)
  for (const [s, [nome, molti, uno]] of Object.entries(SERIE)) {
    const l = limite(ris, s)
    if (!l) continue
    const di = r => (r.errore ? 'non regge' : `p95 ${r.p95} ms`), u = n => `${n} ${n === 1 ? uno : molti}`
    righe.push(l.tutte ? `${nome}: LIMITE oltre la prova, regge anche ${u(l.regge.quanti)} (p95 ${l.regge.p95} ms).`
      : l.regge ? `${nome}: LIMITE ${u(l.regge.quanti)} (p95 ${l.regge.p95} ms); a ${l.oltre.quanti} ${di(l.oltre)}.`
        : `${nome}: LIMITE sotto ${u(l.oltre.quanti)}: già lì ${di(l.oltre)}.`)
  }
  // i tre colli: triangoli (stesse chiamate), chiamate (stessi triangoli), pixel e luci
  const t1 = m('tri-1'), costi = []
  const tk = [2, 4, 8].map(k => m(`tri-${k}`)).filter(Boolean)
  if (t1 && tk.length) {
    const u = tk[tk.length - 1], fino = [t1, ...tk].filter(r => r.p95 <= T).pop()
    const poco = u.ms - t1.ms <= Math.max(4, 0.25 * t1.ms)
    righe.push(`Triangoli (stesse chiamate): x1 ${t1.ms} ms (${kt(t1.tri)}k), x${u.quanti} ${u.ms} ms (${kt(u.tri)}k). ` +
      (poco ? `Costano poco: c'è margine per ~${u.quanti}x di dettaglio.` : fino ? `Pesano: sotto ${T} ms al p95 si arriva a x${fino.quanti}.` : 'Pesano: già così si va oltre.'))
    if (m('tri-2')) costi.push(['triangoli', d(m('tri-2'), t1)])
  }
  const ck = [2, 4].map(k => m(`ch-${k}`)).filter(Boolean)
  if (t1 && ck.length) {
    const u = ck[ck.length - 1], per = u.ch > t1.ch ? (100 * (u.ms - t1.ms) / (u.ch - t1.ch)).toFixed(1) : '?'
    righe.push(`Chiamate (stessi triangoli): x1 ${t1.ch} ${t1.ms} ms, x${u.quanti} ${u.ch} ${u.ms} ms: ~${segnato(per)} ms ogni 100 chiamate.`)
    if (m('ch-2')) costi.push(['chiamate', d(m('ch-2'), t1)])
  }
  const px = ris.filter(r => r.serie === 'pixel' && misurata(r))
  if (px.length > 1) {
    const [a, b] = [px[0], px[px.length - 1]], per = b.mpx > a.mpx ? ((b.ms - a.ms) / (b.mpx - a.mpx)).toFixed(1) : '?'
    righe.push(`Pixel: ${px.map(r => `dpr ${r.quanti} ${r.ms} ms`).join(', ')}: ~${per} ms ogni milione di pixel.`)
    const p2 = m('px-1.41'), p1 = m('px-1')
    if (p1 && p2) costi.push(['pixel', d(p2, p1)])
  }
  const lu = ris.filter(r => r.serie === 'luci' && misurata(r))
  if (lu.length > 1) {
    let salto = null
    for (let i = 1; i < lu.length; i++) if (!salto || lu[i].ms - lu[i - 1].ms > salto[2]) salto = [lu[i - 1].quanti, lu[i].quanti, +(lu[i].ms - lu[i - 1].ms).toFixed(1)]
    righe.push(`Luci: ${lu[0].quanti} fuoco ${lu[0].ms} ms, ${lu[lu.length - 1].quanti} fuochi ${lu[lu.length - 1].ms} ms; il salto più grande da ${salto[0]} a ${salto[1]} (${segnato(salto[2])} ms).`)
    const l6 = m('luci-6'), l12 = m('luci-12')
    if (l6 && l12) costi.push(['luci', d(l12, l6)])
  }
  const om = [6, 12, 1].map(n => [m(`luci-${n}`), m(`luci-${n}s`)]).find(([a, b]) => a && b)
  if (om) righe.push(`L'ombra del cono costa ~${segnato(d(om[0], om[1]))} ms (con ${om[0].quanti} fuochi).`)
  const sn = m('senza-nebbia')
  if (sn && t1) righe.push(`La nebbia costa ~${segnato(d(t1, sn))} ms.`)
  if (costi.length > 1) {
    const [chi, quanto] = costi.slice().sort((a, b) => b[1] - a[1])[0]
    const altri = costi.filter(c => c[0] !== chi).map(c => `${c[0]} ${segnato(c[1])}`).join(', ')
    // sotto il rumore (un millisecondo, o il 5% della scena) non c'è un collo fra quelli provati
    righe.push(quanto > Math.max(1, 0.05 * (t1 ? t1.ms : 0)) ? `COLLO DI BOTTIGLIA: ${chi} (a raddoppiarli ${segnato(quanto)} ms; ${altri}).`
      : `COLLO DI BOTTIGLIA: nessuno fra quelli provati (a raddoppiarli: ${chi} ${segnato(quanto)}, ${altri} ms): il tempo sta altrove.`)
  }
  const roba = ris.filter(r => r.serie === 'roba' && misurata(r))
  if (roba.length > 1) {
    const o = roba.slice().sort((a, b) => b.ms - a.ms), [su, giu] = [o[0], o[o.length - 1]]
    righe.push(`Roba: la più cara ${su.nome} (${su.ms} ms, ${su.ch} ch), la più leggera ${giu.nome} (${giu.ms} ms)${su.ms > 1.5 * giu.ms && su.ms - giu.ms > 3 ? ' = pesa' : ': nessuna pesa più delle altre'}.`)
  }
  for (const z of ris.filter(r => r.tot != null && !r.errore)) {
    righe.push(`Zaino: ${z.n} anteprime in ${z.tot} ms (${Math.round(z.tot / Math.max(1, z.n))} l'una), fotogramma più lungo ${z.max} ms${z.max > 100 ? ' = si vede lo scatto' : ''}.`)
  }
  const fn = m('fat-natale'), f30 = m('fat-30')
  if (fn && f30) righe.push(`La festa (Natale) costa ${d(fn, f30)} ms in più di 30 edifici (p95 ${fn.p95}).`)
  const c1 = m('cal-1'), c2 = m('cal-2')
  if (c1 && c2) {
    const k = c2.ms / Math.max(0.1, c1.ms)
    righe.push(`Calore: il riferimento ${c1.ms} ms all'inizio, ${c2.ms} alla fine (x${k.toFixed(2)})` +
      (k > 1.15 ? ' = il telefono si è scaldato e rallenta: le scene in fondo sembrano più care.' : k < 0.87 ? ': all\'inizio stava ancora caricando.' : ': stabile.'))
  }
  const primi = ris.filter(r => misurata(r) && r.primo > 100).sort((a, b) => b.primo - a.primo).slice(0, 3)
  const sh = ris.reduce((n, r) => n + (r.nuovi || 0), 0)
  if (primi.length || sh) righe.push(`Prima apparizione: ${primi.map(r => `${r.nome} ${Math.round(r.primo)} ms`).join(', ') || 'nessuna sopra 100 ms'}; ${sh} shader compilati in tutto.`)
  const pesante = ris.filter(r => misurata(r) && r.p95 != null).sort((a, b) => b.p95 - a.p95)[0]
  if (pesante) righe.push(`Chi pesa di più: ${pesante.nome} (p95 ${pesante.p95} ms, ${pesante.ch} chiamate, ${kt(pesante.tri)}k triangoli).`)
  const i = dati.info || {}, p = i.precisione
  if (p) righe.push(`GPU: highp nei frammenti ${p.fsAlta ? 'si' : 'NO'}, mediump a ${p.fsMedia} bit` +
    (!p.fsAlta ? ' = luci, normal map e nebbia a mezza precisione: guarda se sgranano o fanno strisce.' : '.') +
    (i.uniFrag && i.uniFrag < 256 ? ` Poche uniform nel frammento (${i.uniFrag}): tante luci non ci stanno.` : ''))
  const c = dati.contesto || {}
  if (c.persi) righe.push(`Il contesto WebGL si è perso ${c.persi} volte (${c.ripresi || 0} ripreso): la memoria della GPU non basta.`)
  const no = ris.filter(r => r.errore)
  if (no.length) righe.push(`Non reggono: ${no.map(r => r.nome).join(', ')}.`)
  if ((dati.avvisi || []).length) righe.push(`Avvisi in console: ${dati.avvisi.reduce((n, a) => n + a.n, 0)} (sotto, AVVISI).`)
  return righe
}

export function componiVeri(dati, { versione = '', ua = '', cpu = null, memoria = null, quando = new Date() } = {}) {
  const i = dati.info || {}, p = i.precisione || {}
  const testa = [
    `MISURA COI MODELLI VERI ${data(quando)}${versione ? ' v' + versione : ''}${dati.fermata ? ' (INTERROTTA)' : ''}`,
    `${modello(ua)} | schermo ${dati.schermo} dpr ${dati.dpr} | CPU ${cpu ?? '?'} core${memoria ? ', ' + memoria + ' GB' : ''} | fascia ${dati.fascia || '?'}`,
    `GPU ${i.gpu || '?'} | ${i.fornitore || '?'} | ${i.versione || ''}`,
    `tex ${i.maxTex} | uniform v/f ${i.uniVert}/${i.uniFrag} | varying ${i.varying} | highp v/f ${p.vsAlta}/${p.fsAlta} mediump f ${p.fsMedia}${(i.mancanti || []).length ? ' | mancano ' + i.mancanti.join(' ') : ''}`,
  ]
  const corpo = []
  let gr = ''
  for (const r of dati.risultati || []) {
    if (r.gruppo !== gr) {
      gr = r.gruppo
      const g = (dati.gruppi || {})[gr] || {}, l = g.luci, rr = (dati.risultati || []).filter(x => x.gruppo === gr)
      const mem = Math.max(0, ...rr.map(x => x.geo || 0)), tex = Math.max(0, ...rr.map(x => x.tex || 0))
      corpo.push(`[${gr}] codice ${(g.carica || []).reduce((a, b) => a + b, 0)} ms` + (g.dpr && g.dpr.length ? `, dpr ${g.dpr.join('/')}` : '') +
        (l ? `, luci ${l.p}p ${l.s}s ${l.d}d ${l.h}h ombre ${l.ombre}` : '') + (mem ? `, mem ${mem}g ${tex}t` : ''))
    }
    corpo.push(rigaVera(r))
  }
  const avvisi = (dati.avvisi || []).slice(0, 6).map(a => `- ${a.n}x ${a.m}`)
  const dd = { v: 2, k: 'veri', i: { g: i.gpu, v: i.fornitore, t: i.maxTex, u: [i.uniVert, i.uniFrag], p: [p.vsAlta, p.fsAlta, p.fsMedia], m: i.mancanti || [] },
    s: dati.schermo, d: dati.dpr, f: dati.fascia, js: dati.js,
    c: Object.fromEntries(Object.entries(dati.gruppi || {}).map(([k, g]) => [k, (g.carica || []).reduce((a, b) => a + b, 0)])),
    x: { p: (dati.contesto || {}).persi || 0, r: (dati.contesto || {}).ripresi || 0, a: (dati.avvisi || []).length },
    r: (dati.risultati || []).map(r => r.errore ? [r.id, 'err'] : r.salta ? [r.id, 'salta'] : r.tot != null ? [r.id, r.tot, r.max, r.lavoro, r.attesa]
      : [r.id, r.ms, r.p95, r.fps, r.ch, kt(r.tri), Math.round(r.primo || 0), r.nuovi || 0]) }
  return [...testa, '', ...corpo, ...(avvisi.length ? ['', 'AVVISI', ...avvisi] : []), '', `CPU prova JS: ${dati.js ?? '?'} ms`, '',
    'LETTURA', ...letturaVeri(dati).map(r => '- ' + r), '', `DATI ${JSON.stringify(dd)}`].join('\n')
}

/** Le note scritte a mano in fondo alla prova, prima della riga DATI. */
export function conNote(testo, note) {
  const n = String(note || '').trim()
  if (!n) return testo
  const righe = testo.split('\n'), i = righe.findIndex(r => r.startsWith('DATI '))
  const blocco = ['NOTE', ...n.split('\n').map(r => '- ' + r.trim()).filter(r => r.length > 2), '']
  righe.splice(i < 0 ? righe.length : i, 0, ...blocco)
  return righe.join('\n')
}

/** Il log in pezzi che stanno nel campo del modulo (`max` caratteri), tagliati fra una riga e l'altra; ognuno dice «parte k/n». */
export function spezza(testo, max = LIMITE_CAMPO) {
  if (testo.length <= max) return [testo]
  const righe = testo.split('\n'), testa = righe[0], parti = [[]]
  const segno = 24   // lo spazio per « (parte 10/10)» in testa
  let lung = testa.length + segno
  for (const r of righe.slice(1)) {
    if (lung + r.length + 1 > max && parti[parti.length - 1].length) { parti.push([]); lung = testa.length + segno }
    parti[parti.length - 1].push(r); lung += r.length + 1
  }
  return parti.map((p, k) => [`${testa} (parte ${k + 1}/${parti.length})`, ...p].join('\n'))
}
