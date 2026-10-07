// Le sagome del cane: i posti con lo zaino del sentiero del cane, fatti
// come quelle del coniglio (`sagome.js`): prima il programma, poi il posto
// attorno. Le pecore stanno nei vicoli e nelle nicchie, una per stalla, e
// il cane le manda dentro fermandosi sulla loro colonna. Vedi
// docs/passo-passo/sentiero.md.
import { programma, ripeti, se, COLORI, CASA } from '../dati/carte.js'
import { Scavo, storto, LETTERA, tra, scegli, mescola, ripetute } from './scavo.js'

/* un vicolo che scende dalla strada del cane, alla colonna x: la pecora
   a due passi dalla strada, la stalla `profondo` passi più in là. Torna
   le celle dove il cane passa (per l'osso) */
function vicolo(s, x, verso, profondo) {
  const celle = []
  s.metti(x, verso, '.')
  celle.push([x, verso])
  s.metti(x, 2 * verso, 'p')
  for (let k = 1; k <= profondo; k++) { s.metti(x, (2 + k) * verso, '.'); if (k < profondo) celle.push([x, (1 + k) * verso]) }
  s.metti(x, (3 + profondo) * verso, '#')
  /* ai lati del vicolo la siepe: la pecora non scappa di lato */
  for (let k = 1; k <= 3 + profondo; k++) for (const d of [-1, 1]) if (s.get(x + d, k * verso) === undefined) s.metti(x + d, k * verso, 'A')
  return celle
}

export const SAGOME_CANE = [
  // il pettine: dalla strada scendono i vicoli, uno ogni due o tre passi,
  // con la pecora a metà e la stalla in fondo; fra un vicolo e l'altro il
  // fosso, e chi sbaglia l'ordine nella scatola ci mette la zampa
  { chiave: 'pettine', carta: 'ripeti', animale: 'cane', serve: [],
    nomi: ['Il pettine', 'Le stalle in fila', 'I vicoli del borgo'],
    fai(rnd) {
      const s = new Scavo()
      const k = tra(rnd, 3, 4), passo = tra(rnd, 2, 3), profondo = tra(rnd, 1, 2)
      s.metti(0, 0, 'P')
      const posti = []
      const ultimo = 1 + (k - 1) * passo
      for (let x = 1; x <= ultimo + 1; x++) s.metti(x, 0, '.')
      /* prima il fosso fra un vicolo e l'altro, poi i vicoli */
      for (let x = 2; x < ultimo; x++) if ((x - 1) % passo) s.metti(x, 1, '~')
      for (let i = 0; i < k; i++) posti.push(...vicolo(s, 1 + i * passo, 1, profondo))
      const [cx, cy] = scegli(rnd, posti)
      s.forza(cx, cy, 'c')
      const giu = ripetute(profondo, ['giu']), su = ripetute(profondo, ['su'])
      const avanti = ripetute(passo - 1, ['destra'])
      return {
        scavo: s, fondo: scegli(rnd, ['bosco', 'prato']),
        soluzione: programma(ripeti(k, 'destra', ...giu, ...su, ...avanti)),
        fragili: [
          { fila: programma(ripeti(k, 'destra', ...avanti, ...giu, ...su)), obbligatoria: true },
          { fila: programma(ripeti(k, 'destra', ...giu, ...avanti)), obbligatoria: true },
        ],
      }
    } },

  // il pettine doppio: i vicoli scendono e salgono dalla strada, uno di
  // fronte all'altro; fermandosi lì il cane spaventa tutte e due le
  // pecore, e poi entra in un vicolo e nell'altro
  { chiave: 'pettine-doppio', carta: 'ripeti', animale: 'cane', serve: [],
    nomi: ['Il pettine doppio', 'Le stalle di qua e di là', 'Il borgo'],
    fai(rnd) {
      const s = new Scavo()
      const k = tra(rnd, 2, 3), passo = tra(rnd, 2, 3)
      s.metti(0, 0, 'P')
      const posti = []
      const ultimo = 1 + (k - 1) * passo
      for (let x = 1; x <= ultimo + 1; x++) s.metti(x, 0, '.')
      for (const v of [1, -1]) for (let x = 2; x < ultimo; x++) if ((x - 1) % passo) s.metti(x, v, '~')
      for (let i = 0; i < k; i++) for (const v of [1, -1]) posti.push(...vicolo(s, 1 + i * passo, v, 1))
      const [cx, cy] = scegli(rnd, posti)
      s.forza(cx, cy, 'c')
      const avanti = ripetute(passo - 1, ['destra'])
      const primaGiu = rnd() < 0.5
      const dentro = primaGiu ? ['giu', 'su', 'su', 'giu'] : ['su', 'giu', 'giu', 'su']
      return {
        scavo: s, fondo: scegli(rnd, ['bosco', 'prato']),
        soluzione: programma(ripeti(k, 'destra', ...dentro, ...avanti)),
        fragili: [
          { fila: programma(ripeti(k, 'destra', ...dentro.slice(0, 2), ...avanti)), obbligatoria: true },
          { fila: programma(ripeti(k, 'destra', ...avanti, ...dentro)), obbligatoria: true },
        ],
      }
    } },

  // il pettine storto: i vicoli non sono in fila, e la lastra davanti a
  // ognuno dice dove entrare; chi conta i passi mette la zampa nel fosso
  { chiave: 'pettine-storto', carta: 'fino', animale: 'cane', serve: [],
    nomi: ['Il pettine storto', 'I vicoli storti', 'Le stalle sparse'],
    fai(rnd) {
      const s = new Scavo()
      const colore = scegli(rnd, COLORI), lastra = LETTERA[colore]
      const k = tra(rnd, 3, 4), profondo = tra(rnd, 1, 2)
      const salti = Array.from({ length: k }, (_, i) => (i ? tra(rnd, 2, 3) : tra(rnd, 1, 3)))
      if (new Set(salti.slice(1)).size < 2) storto()
      s.metti(0, 0, 'P')
      const posti = []
      let x = 0
      const vicoli = []
      for (const d of salti) { x += d; vicoli.push(x) }
      for (let c = 1; c <= x + tra(rnd, 1, 2); c++) s.metti(c, 0, vicoli.includes(c) ? lastra : '.')
      vicoli.forEach((vx, i) => { if (i < k - 1) for (let c = vx + 1; c < vicoli[i + 1]; c++) s.metti(c, 1, '~') })
      for (const vx of vicoli) posti.push(...vicolo(s, vx, 1, profondo))
      for (let c = 1; c < vicoli[0]; c++) posti.push([c, 0])
      const [cx, cy] = scegli(rnd, posti)
      s.forza(cx, cy, 'c')
      const giu = ripetute(profondo, ['giu']), su = ripetute(profondo, ['su'])
      return {
        scavo: s, fondo: scegli(rnd, ['bosco', 'prato']),
        soluzione: programma(ripeti(k, ripeti(colore, 'destra'), ...giu, ...su)),
        fragili: [{ fila: programma(ripeti(k, ripeti(colore, 'destra'), ...giu)), obbligatoria: true }],
      }
    } },

  // le nicchie: lungo la strada le lastre dicono da che parte c'è una
  // stalla, sopra o sotto; un programma solo per tutta la strada, e chi
  // scambia i colori mette la zampa nel fosso dall'altra parte
  { chiave: 'nicchie', carta: 'se', animale: 'cane', serve: [],
    nomi: ['Le nicchie', 'Il corridoio delle stalle', 'Le stalle di qua e di là'],
    fai(rnd) {
      const s = new Scavo()
      const [cGiu, cSu] = mescola(rnd, COLORI)
      const lungo = tra(rnd, 9, 11)
      s.metti(0, 0, 'P')
      const nicchie = []
      for (let x = tra(rnd, 1, 2); x < lungo - 1; x += tra(rnd, 2, 3)) nicchie.push([x, scegli(rnd, [1, -1])])
      if (nicchie.length < 3 || !nicchie.some(n => n[1] === 1) || !nicchie.some(n => n[1] === -1)) storto()
      const fine = nicchie.at(-1)[0]
      const posti = []
      for (let x = 1; x <= fine + 1; x++) {
        const n = nicchie.find(q => q[0] === x)
        s.metti(x, 0, n ? LETTERA[n[1] === 1 ? cGiu : cSu] : '.')
        if (!n && x <= fine) posti.push([x, 0])
      }
      for (const [x, v] of nicchie) {
        vicolo(s, x, v, 1)
        /* dall'altra parte, il fosso */
        s.metti(x, -v, '~')
      }
      if (!posti.length) storto()
      const [cx, cy] = scegli(rnd, posti)
      s.forza(cx, cy, 'c')
      const giri = rnd() < 0.5 ? [se(cGiu, 'giu', 'su'), se(cSu, 'su', 'giu')] : [se(cSu, 'su', 'giu'), se(cGiu, 'giu', 'su')]
      return {
        scavo: s, fondo: scegli(rnd, ['bosco', 'prato']),
        soluzione: programma(ripeti(CASA, 'destra', ...giri)),
        fragili: [
          { fila: programma(ripeti(CASA, 'destra', se(cGiu, 'su', 'giu'), se(cSu, 'giu', 'su'))), obbligatoria: true },
          { fila: programma(ripeti(CASA, 'destra', se(cGiu, 'giu', 'su'))), obbligatoria: true },
        ],
      }
    } },
]
