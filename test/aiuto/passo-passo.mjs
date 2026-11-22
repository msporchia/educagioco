/* Attrezzi dei test di Passo passo nel browser (docs/passo-passo/).

   `filaScritta(page)` legge la fila com'è a schermo e `filaDi(soluzione)` la scrive allo stesso modo da un programma dei
   dati: ogni carta col suo livello di scatola (`ripeti-casa@0`, `attacca@1`, …). Con le due si prova che il dito ha
   scritto proprio la soluzione — scatole, teste e quello che c'è dentro — senza farla correre fino al cartello: che
   vinca lo dice `unita/passo-passo`. */

export const filaScritta = page => page.locator('[data-testa], [data-tessera]').evaluateAll(l => l.map(e => {
  const dentro = n => { let k = 0; for (let p = n.parentElement; p; p = p.parentElement) if (p.dataset && p.dataset.scatola !== undefined) k++; return k }
  return e.dataset.testa !== undefined
    ? `${e.closest('[data-scatola]').dataset.tipo}-${e.dataset.volte}@${dentro(e.closest('[data-scatola]'))}`
    : `${e.dataset.mossa}@${dentro(e)}`
}))

export function filaDi(soluzione) {
  const fuori = []
  let k = 0
  for (const t of soluzione) {
    if (t === 'fine') { k--; continue }
    fuori.push(`${t}@${k}`)
    if (t.startsWith('ripeti-') || t.startsWith('se-')) k++
  }
  return fuori
}

/* Un profilo seminato con tante tappe fatte festeggia il traguardo in home («tocca per continuare»): si tocca, se no il
   primo tocco sulla home aspetta che il velo se ne vada da solo, una dozzina di secondi. Lo usano anche i test del Robot. */
export async function chiudiIlTraguardo(page) {
  if (!(await page.locator('.velo').count())) return
  await page.locator('.velo').first().click()
  await page.waitForSelector('.velo', { state: 'detached', timeout: 5000 })
}
