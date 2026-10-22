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

export const data = d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
export const modello = ua => {
  const m = /Android[^;)]*;\s*([^;)]+?)(?:\sBuild|\)|;)/.exec(ua || '')
  return m ? m[1].trim() : (/iPhone|iPad/.test(ua || '') ? 'iOS' : 'computer')
}

export function componi(dati, { versione = '', ua = '', nome = '', cpu = null, memoria = null, quando = new Date() } = {}) {
  const i = dati.info || {}
  const testa = [
    `MISURA DEL TELEFONO ${data(quando)}${versione ? ' v' + versione : ''}${dati.fermata ? ' (INTERROTTA)' : ''}`,
    `${nome || modello(ua)} | schermo ${dati.schermo} dpr ${dati.dpr} | CPU ${cpu ?? '?'} core${memoria ? ', ' + memoria + ' GB' : ''}`,
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

// la misura coi modelli veri ha il suo log: log-veri.js (usa `data` e `modello` di qui)
