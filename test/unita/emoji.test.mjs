/* ═══════════════════════════════════════════════════════════════════
   LE EMOJI SONO NOSTRE — senza browser.
   `node test/esegui.mjs emoji --niente-build`

   Il font Twemoji dentro il file unico è tagliato alle sole emoji che
   `src/` usa (`npm run emoji`). Se si scrive un'emoji nuova e ci si
   scorda il comando, a schermo quella emoji la disegna il telefono, e il
   gioco cambia faccia da un dispositivo all'altro — proprio quello che il
   font doveva impedire. Questo file lo dice prima. Perché e come:
   docs/core/emoji.md. Che a schermo vengano davvero col font:
   `integrazione/emoji`.
   ═══════════════════════════════════════════════════════════════════ */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { RADICE, FONTE, ELENCO, USCITA_FONT, USCITA_CSS, FAMIGLIA,
         trovaEmoji, leggiFont, intervalli, cssDelFont, senzaCommenti } from '../../strumenti/emoji/lib.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const RIMEDIO = 'lancia `npm run emoji`'
const sha = b => createHash('sha256').update(b).digest('hex')
const elenco = JSON.parse(readFileSync(ELENCO, 'utf8'))
const { emoji, testo, punti, conflitti, dove } = trovaEmoji()

console.log('\nIL SOTTOINSIEME COPRE TUTTO QUELLO CHE SI USA')
{
  const usate = [...emoji.keys()].sort()
  const mancano = usate.filter(s => !elenco.emoji.includes(s))
  controlla(`ogni emoji di src/ è nel font (${usate.length})`, mancano.length === 0,
    `${RIMEDIO} — mancano: ${mancano.slice(0, 8).map(s => `${s} (${dove.get(s)})`).join(', ')}${mancano.length > 8 ? '…' : ''}`)
  const inPiu = elenco.emoji.filter(s => !emoji.has(s))
  controlla('nel font non c\'è niente che non si usi più', inPiu.length === 0,
    `${RIMEDIO} — avanzano: ${inPiu.slice(0, 8).join(' ')}`)
  uguale('l\'unicode-range è quello delle emoji usate', elenco.intervalli, intervalli(punti))
  uguale('il CSS generato è quello dell\'elenco', readFileSync(USCITA_CSS, 'utf8'), cssDelFont(elenco.intervalli))
}

console.log('\nIL FONT GENERATO È QUELLO GIUSTO')
{
  controlla('il font sorgente è quello da cui si è tagliato', sha(readFileSync(FONTE)) === elenco.fonte,
    `${RIMEDIO}: Twemoji.Mozilla.ttf è cambiato dopo l'ultimo taglio`)
  controlla('il sottoinsieme (emoji.woff2) è quello dell\'elenco', sha(readFileSync(USCITA_FONT)) === elenco.woff2,
    `${RIMEDIO}: src/emoji/emoji.woff2 non è l'ultimo uscito dallo strumento`)
  const intero = leggiFont(new Uint8Array(readFileSync(FONTE)))
  const nonDisegna = [...emoji.keys()].filter(s => !intero.disegna(s, { senzaCmap14: true }))
  controlla('Twemoji sa disegnare ogni emoji usata', nonDisegna.length === 0,
    `Twemoji è fermo a Emoji 14, se ne sceglie un'altra: ${nonDisegna.join(' ')}`)
}

console.log('\nNIENTE EMOJI E TESTO INSIEME')
{
  /* ▶ nudo è un simbolo da testo, ▶️ con FE0F è un'emoji: il font ha un glifo
     solo per i due, e non sa quale dei due chi scrive voleva */
  controlla('nessun carattere è emoji in un posto e testo in un altro', conflitti.length === 0,
    conflitti.map(c => `${c} (nudo in ${dove.get(c)})`).join(', ') + ' — o tutti con FE0F o tutti senza')
  controlla('niente tasti (1️⃣): le cifre non stanno nel font, il tasto cadrebbe sul telefono',
    ![...emoji.keys()].some(s => /^[0-9#*]/.test(s)), 'si scrive la cifra nuda o un\'altra emoji')
}

console.log('\nOGNI PILA DI FONT METTE PER PRIMO IL NOSTRO')
{
  /* Una pila senza «Emoji Gioco» riporta le emoji al telefono, e nessuno se
     ne accorge finché non guarda un altro telefono. Le uniche eccezioni sono
     `inherit` e il font del font stesso. */
  const male = []
  const cerca = d => {
    for (const n of readdirSync(d).sort()) {
      const p = join(d, n)
      if (statSync(p).isDirectory()) { cerca(p); continue }
      if (!/\.(js|vue|css)$/.test(n) || p.includes(join('src', 'emoji'))) continue
      const t = senzaCommenti(readFileSync(p, 'utf8'), p)
      const rel = p.slice(RADICE.length + 1)
      for (const m of t.matchAll(/font-family\s*:\s*([^;}\n]*)/g))
        if (!/^\s*inherit\b/.test(m[1]) && !m[1].trimStart().startsWith(`"${FAMIGLIA}"`)) male.push(`${rel}: font-family:${m[1].trim().slice(0, 40)}`)
      for (const m of t.matchAll(/(?<![-\w])font\s*:([^;}\n]*)/g))
        if (/system-ui|Georgia|monospace|serif/.test(m[1]) && !m[1].includes(`"${FAMIGLIA}"`)) male.push(`${rel}: font:${m[1].trim().slice(0, 40)}`)
      for (const m of t.matchAll(/\.font\s*=\s*([^\n]*)/g))
        if (!m[1].includes(`"${FAMIGLIA}"`) && !m[1].includes('CARATTERE')) male.push(`${rel}: .font = ${m[1].trim().slice(0, 40)}`)
    }
  }
  cerca(join(RADICE, 'src'))
  controlla('ogni font-family, font: e ctx.font comincia con "Emoji Gioco"', male.length === 0, male.slice(0, 6).join(' | '))
}

nota(`${emoji.size} emoji, ${elenco.intervalli.split(',').length} intervalli, ${(statSync(USCITA_FONT).size / 1024).toFixed(0)} KB`)
if (testo.size) nota('restano testo:', [...testo.keys()].join(' '))
riassunto('EMOJI')
