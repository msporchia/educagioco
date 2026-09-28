#!/usr/bin/env node
/* La guardia dei commenti.

     node strumenti/solo-commenti.mjs [base]     (base di difetto: main)
     npm run test:commenti

   Confronta ogni file .js/.mjs/.vue/.css cambiato fra `base` e l'albero
   di lavoro, e fallisce se è cambiato qualcosa oltre ai commenti e agli
   spazi. Serve a chi sposta spiegazioni dal codice ai documenti: il
   codice deve uscirne identico. Come si confronta: docs/core/strumenti.md. */

import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { extname } from 'node:path'
import { transform } from 'esbuild'
import { parse } from '@vue/compiler-sfc'

const base = process.argv[2] || 'main'
const ESTENSIONI = new Set(['.js', '.mjs', '.vue', '.css'])

const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1 << 28 })

// Quello che è cambiato: tracciati (anche rinominati) e non tracciati.
const cambiati = []
const campi = git('diff', '--name-status', '-M', '-z', base, '--').split('\0')
for (let i = 0; i < campi.length - 1;) {
  const stato = campi[i++]
  if (stato[0] === 'R' || stato[0] === 'C') cambiati.push({ stato: stato[0], vecchio: campi[i++], nuovo: campi[i++] })
  else { const p = campi[i++]; cambiati.push({ stato: stato[0], vecchio: p, nuovo: p }) }
}
for (const p of git('ls-files', '--others', '--exclude-standard', '-z').split('\0'))
  if (p) cambiati.push({ stato: 'A', vecchio: null, nuovo: p })

const daGuardare = cambiati.filter(c => ESTENSIONI.has(extname(c.nuovo)) || ESTENSIONI.has(extname(c.vecchio || '')))

// Solo gli spazi del codice e i commenti vanno via: niente rinomine
// delle variabili, niente riscritture della sintassi.
async function normalizzaJs (testo, loader = 'js') {
  const { code } = await transform(testo, {
    loader, minifyWhitespace: true, minifyIdentifiers: false, minifySyntax: false,
    legalComments: 'none', charset: 'utf8',
  })
  return code
}

async function normalizzaCss (testo, lang) {
  if (!lang || lang === 'css') {
    const { code } = await transform(testo, { loader: 'css', minify: true, legalComments: 'none', charset: 'utf8' })
    return code
  }
  // scss e simili: esbuild non li legge, si tolgono commenti e spazi a mano
  return testo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1').replace(/\s+/g, ' ').trim()
}

// Il template: via i <!-- -->, e ogni fila di spazi diventa uno spazio
// solo; fra un tag e l'altro non ne resta nessuno. Il testo resta.
function normalizzaTemplate (testo) {
  return testo.replace(/<!--[\s\S]*?-->/g, ' ').replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
}

const LOADER = { js: 'js', ts: 'ts', jsx: 'jsx', tsx: 'tsx' }

async function normalizzaVue (testo, nome) {
  const { descriptor, errors } = parse(testo, { filename: nome })
  if (errors.length) throw new Error(errors[0].message || String(errors[0]))
  const pezzi = []
  const attrs = b => JSON.stringify(Object.entries(b.attrs).sort())
  for (const [chi, b] of [['script', descriptor.script], ['script setup', descriptor.scriptSetup]]) {
    if (!b) continue
    pezzi.push(`<${chi} ${attrs(b)}>` + await normalizzaJs(b.content, LOADER[b.lang || 'js'] || 'js'))
  }
  if (descriptor.template) pezzi.push(`<template ${attrs(descriptor.template)}>` + normalizzaTemplate(descriptor.template.content))
  for (const s of descriptor.styles) pezzi.push(`<style ${attrs(s)}>` + await normalizzaCss(s.content, s.lang))
  for (const b of descriptor.customBlocks) pezzi.push(`<${b.type} ${attrs(b)}>` + b.content.replace(/\s+/g, ' ').trim())
  return pezzi.join('\n')
}

async function normalizza (testo, nome) {
  const e = extname(nome)
  if (e === '.vue') return normalizzaVue(testo, nome)
  if (e === '.css') return normalizzaCss(testo)
  return normalizzaJs(testo)
}

// Dove comincia la differenza, con un po' di contesto da tutte e due le parti.
function indizio (a, b) {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  const taglio = s => JSON.stringify(s.slice(Math.max(0, i - 40), i + 40))
  return `      prima: ${taglio(a)}\n      dopo:  ${taglio(b)}`
}

let diversi = 0
for (const c of daGuardare) {
  const nome = c.nuovo
  if (c.stato === 'A' || !c.vecchio) { console.log(`✗ nuovo     ${nome}`); diversi++; continue }
  if (c.stato === 'D' || !existsSync(nome)) { console.log(`✗ tolto     ${c.vecchio}`); diversi++; continue }
  const vecchio = git('show', `${base}:${c.vecchio}`)
  const nuovo = readFileSync(nome, 'utf8')
  const etichetta = c.stato === 'R' ? `${c.vecchio} → ${nome}` : nome
  try {
    const [a, b] = [await normalizza(vecchio, c.vecchio), await normalizza(nuovo, nome)]
    if (a === b) console.log(`✓ ok        ${etichetta}`)
    else { console.log(`✗ diverso   ${etichetta}\n${indizio(a, b)}`); diversi++ }
  } catch (err) {
    console.log(`✗ illeggibile ${etichetta}: ${String(err.message).split('\n')[0]}`); diversi++
  }
}

console.log(`\n${daGuardare.length} file di codice cambiati rispetto a ${base}, ` +
  (diversi ? `${diversi} con cambiamenti oltre ai commenti` : 'solo commenti e spazi'))
process.exit(diversi ? 1 : 0)
