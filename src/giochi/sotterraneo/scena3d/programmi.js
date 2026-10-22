// Da dove vengono i programmi di shader di un renderer, per le misure (docs/sotterraneo/prestazioni-3d.md, «Shader e prima
// apparizione»): ogni programma col nome dello shader, i materiali che lo usano (tipo, nome, le scelte che fanno variante) e un
// oggetto d'esempio. Quelli senza materiale in scena sono dell'ombra (la profondità) o di scene già buttate.

// il tipo del materiale (MeshStandardMaterial, ShaderMaterial…) e il suo nome, se ce l'ha
const tipoDi = p => p.type + (p.name ? ':' + p.name : '')
const nomeDi = o => { const n = []; for (let x = o; x && n.length < 3; x = x.parent) if (x.name) n.push(x.name); return n.join('<') || o.type + (o.geometry ? ':' + o.geometry.type : '') }

/** Le scelte del materiale che cambiano programma (non i colori né le intensità). */
export function variantiDi(m) {
  const v = [m.type]
  if (m.vertexColors) v.push('vcol')
  if (m.flatShading) v.push('piatto')
  if (m.map) v.push('map')
  if (m.normalMap) v.push('normali')
  if (m.emissiveMap) v.push('emiMap')
  if (m.alphaMap) v.push('alphaMap')
  if (m.roughnessMap || m.metalnessMap) v.push('rmMap')
  if (m.alphaTest > 0) v.push('alphaTest')
  if (m.transparent) v.push('trasp')
  if (m.side === 2) v.push('due-facce'); else if (m.side === 1) v.push('dietro')
  if (m.fog === false && 'fog' in m) v.push('senza-nebbia')
  if (m.toneMapped === false) v.push('senza-tono')
  if (Object.prototype.hasOwnProperty.call(m, 'onBeforeCompile')) v.push('onBeforeCompile')
  if (m.defines && Object.keys(m.defines).length && m.type !== 'MeshStandardMaterial' && m.type !== 'MeshPhysicalMaterial') v.push('defines:' + Object.keys(m.defines).join('+'))
  return v.join(' ')
}

/** `scene`: le scene dove cercare i materiali. Torna { quanti, perNome, programmi: [{ nome, usi, materiali: [{ varianti, n, es }] }] }. */
export function elencaProgrammi(renderer, scene) {
  const progs = renderer.info.programs || []
  const di = new Map(progs.map(p => [p, { nome: tipoDi(p), usi: p.usedTimes, materiali: new Map() }]))
  const visti = new Set()
  for (const scena of scene) if (scena) scena.traverse(o => {
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
    for (const m of ms) {
      const pr = renderer.properties.get(m)
      if (!pr.programs) continue
      for (const p of pr.programs.values()) {
        const d = di.get(p)
        if (!d) continue
        const k = variantiDi(m) + (o.isSkinnedMesh ? ' pelle' : '') + (o.isInstancedMesh ? ' istanze' : '') + (o.isPoints ? ' punti' : '')
        const x = d.materiali.get(k) || { varianti: k, n: 0, es: nomeDi(o), mat: new Set() }
        if (!visti.has(m.uuid + p.id)) { x.mat.add(m.uuid); visti.add(m.uuid + p.id) }
        x.n++
        d.materiali.set(k, x)
      }
    }
  })
  // dove la chiave differisce dal primo programma con lo stesso nome (posizione=valore: i campi in WebGLPrograms.getProgramCacheKey)
  const primo = new Map()
  for (const p of progs) if (!primo.has(p.type)) primo.set(p.type, p.cacheKey.split(','))
  const diff = p => { const a = p.cacheKey.split(','), b = primo.get(p.type), d = []; for (let i = 0; i < Math.max(a.length, b.length) && d.length < 8; i++) if (a[i] !== b[i]) d.push(i + '=' + String(a[i]).slice(0, 24)); return d }
  for (const p of progs) di.get(p).diff = diff(p)
  const programmi = [...di.values()].map(d => ({ nome: d.nome, usi: d.usi, diff: d.diff, materiali: [...d.materiali.values()].map(x => ({ varianti: x.varianti, oggetti: x.n, materiali: x.mat.size, es: x.es })) }))
  const perNome = {}
  for (const p of programmi) perNome[p.nome] = (perNome[p.nome] || 0) + 1
  return { quanti: progs.length, perNome, programmi }
}
