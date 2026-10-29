// Le normal map di una scena tolte e rimesse: l'elemento `normali` delle scale (veri/scala.js), il rilievo finto delle trame.
export function normali(scena) {
  const tolte = new Map()   // materiale → la sua normal map
  return {
    senzaNormali() {
      scena.traverse(o => {
        const l = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []
        for (const m of l) if (m.normalMap && !tolte.has(m)) { tolte.set(m, m.normalMap); m.normalMap = null; m.needsUpdate = true }
      })
    },
    ripristina() { for (const [m, n] of tolte) { m.normalMap = n; m.needsUpdate = true } tolte.clear() },
  }
}
