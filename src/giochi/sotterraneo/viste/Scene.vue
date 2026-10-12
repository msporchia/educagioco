<script setup>
// Gli effetti dell'abilità, disegnati in codice (docs/sotterraneo/scontro-effetti.md): quello che vola dall'eroe al mostro, cade dall'alto,
// esce dal pavimento, il segno che resta quando arriva. Il racconto (viste/racconto.js) posa sul palco una lista di scene `{ corpo,
// modo, da, a, ritardo, durata, tinta }`; qui ognuna diventa un po' di SVG e CSS che si muove da sé (stile-effetti.css) con il suo
// ritardo. Non decide niente: quando e dove lo dice il racconto, e dove stanno le figure lo dice `punto` (misurato sul palco).
// Registro serio: forme e luce, niente emoji. I corpi che questo file sa disegnare sono in CORPI e SEGNI (dati/effetti.js).
import { SCUDO } from './glifi-base.js'

const props = defineProps({
  scene: { type: Array, required: true },
  punto: { type: Function, required: true },   // (chi: posto | 'eroe') → { x, y, w, h } sul palco, o null
  larg: { type: Number, default: 352 },
})

const rn = (n, f) => Array.from({ length: n }, (_, i) => f(i))
const FRECCE = rn(7, i => ({ x: -0.62 + i * 0.205, d: [0, 70, 25, 95, 45, 15, 80][i], l: 0.9 + (i % 3) * 0.12 }))
const MASSI = rn(5, i => ({ x: -0.55 + i * 0.28, d: [0, 90, 40, 120, 60][i], r: [18, -26, 40, -12, 30][i], s: [0.9, 1.15, 0.8, 1.05, 0.95][i] }))
const BRACE = rn(10, i => ({ x: -0.6 + i * 0.133, d: (i * 47) % 130, s: 0.7 + (i % 3) * 0.25 }))
const NEVE = rn(13, i => ({ x: -0.7 + i * 0.116, d: (i * 61) % 260, s: 0.7 + (i % 4) * 0.2 }))
const NUBI = rn(6, i => ({ x: [-0.32, 0.3, -0.05, 0.38, -0.38, 0.08][i], y: [0.15, 0.2, -0.05, -0.15, -0.2, 0.3][i], d: i * 55, s: 0.7 + (i % 3) * 0.2 }))
const FIAMME = rn(5, i => ({ x: [-0.42, 0.4, -0.12, 0.16, 0.0][i], y: [0.3, 0.32, 0.4, 0.2, 0.05][i], d: i * 60, s: 0.8 + (i % 3) * 0.2 }))
const ZETA = rn(3, i => ({ x: 0.15 + i * 0.22, d: i * 170, s: 1 + i * 0.35, t: i % 2 ? 'z' : 'Z' }))
const RAGGI8 = rn(8, i => ({ a: i * 45 + (i % 2 ? 8 : 0), l: i % 2 ? 0.7 : 1 }))
const RAGGI6 = rn(6, i => ({ a: i * 60 - 90 }))
const BRACI = rn(8, i => ({ a: i * 45 + 20, d: (i * 31) % 70, r: 0.55 + (i % 3) * 0.2 }))
const GOCCE = rn(4, i => ({ a: -60 + i * 40, d: i * 40, r: 0.6 + (i % 2) * 0.25 }))
const SASSI = rn(6, i => ({ a: i * 60 + 15, d: (i * 29) % 80 }))
const MOTI = rn(6, i => ({ x: -0.4 + i * 0.16, d: (i * 53) % 220, s: 0.7 + (i % 3) * 0.25 }))
const PIETRE = rn(6, i => ({ a: i * 60 + 10, s: 0.8 + (i % 3) * 0.2 }))
const PLUS = rn(7, i => ({ x: -0.5 + i * 0.17, d: (i * 67) % 260, s: 0.7 + (i % 3) * 0.25 }))
const SCHEGGE = rn(5, i => ({ a: -150 + i * 55, d: i * 25, r: 0.5 + (i % 2) * 0.3 }))

// dove e quanto grande sta una scena: il punto di partenza e i vettori verso chi arriva (misurati sul palco, quando compare)
function stile(s) {
  const b = props.punto(s.a)
  if (!b) return { display: 'none' }
  const u = Math.max(34, Math.min(104, Math.round(Math.max(b.w, b.h))))
  const st = { '--tinta': s.tinta, '--ritardo': s.ritardo + 'ms', '--dura': s.durata + 'ms', '--u': u + 'px', '--s': Math.round(u / 48 * 100) / 100,
               '--arrivo': s.ritardo + (s.modo === 'alto' ? s.durata : 0), '--rot': (s.ord ? (s.ord % 2 ? 1 : -1) * 14 * Math.ceil(s.ord / 2) : 0) + 'deg' }
  if (s.modo === 'volo') {
    const o = props.punto(s.da)
    if (!o) return { display: 'none' }
    // chi parte dall'eroe esce dalla sua mano, a destra; chi salta da un mostro all'altro parte dal centro
    const x0 = s.da === 'eroe' ? o.x + o.w * 0.35 : o.x, y0 = s.da === 'eroe' ? o.y - o.h * 0.1 : o.y
    const dx = b.x - x0, dy = b.y - y0
    return { ...st, left: x0 + 'px', top: y0 + 'px', '--dx': dx + 'px', '--dy': dy + 'px', '--ang': Math.round(Math.atan2(dy, dx) * 1800 / Math.PI) / 10 + 'deg',
             '--lung': Math.round(Math.hypot(dx, dy)) + 'px' }
  }
  const alto = Math.max(40, b.y)
  const out = { ...st, left: b.x + 'px', top: b.y + 'px', '--alto': alto + 'px' }
  if (s.verso && s.verso.length) {
    // fino al più lontano di chi prende il colpo, partendo dall'eroe
    const lontano = Math.max(...s.verso.map(k => { const q = props.punto(k); return q ? q.x : b.x }))
    out['--vs'] = Math.max(120, Math.round(lontano - b.x + 50))
  } else out['--vs'] = Math.max(120, Math.round(props.larg - b.x - 30))
  out['--verso'] = out['--vs'] + 'px'
  return out
}
</script>

<template>
  <div v-for="s in scene" :key="s.id" class="sc" :class="['sx-' + s.corpo, { 'sc-piu': s.piu, 'sc-forte': s.forte }]" :style="stile(s)"
       data-scena :data-corpo="s.corpo" aria-hidden="true">

    <!-- ═════ quello che vola dall'eroe al mostro ═════ -->
    <i v-if="s.corpo === 'palla'" class="sc-vola"><b class="sc-rot"><i class="sc-palla"></i></b></i>
    <i v-else-if="s.corpo === 'dardo'" class="sc-vola"><b class="sc-rot"><i class="sc-dardo"></i></b></i>
    <i v-else-if="s.corpo === 'freccia' || s.corpo === 'quadrello'" class="sc-vola"><b class="sc-rot"><i class="sc-asta">
      <svg v-if="s.corpo === 'freccia'" viewBox="0 0 50 12" width="50" height="12">
        <path d="M2 6H42" stroke="#c49a62" stroke-width="2" stroke-linecap="round" />
        <path d="M40 1.6L49.5 6L40 10.4Z" fill="#eef2fa" /><path d="M40 6H49.5L40 10.4Z" fill="#9aa6bb" />
        <path d="M4 6L0.5 2M4 6L0.5 10M8.5 6L5 2M8.5 6L5 10" stroke="#e8dcc4" stroke-width="1.6" stroke-linecap="round" />
      </svg>
      <svg v-else viewBox="0 0 34 12" width="34" height="12">
        <path d="M1 6H28" stroke="#8d8f98" stroke-width="3.2" stroke-linecap="round" />
        <path d="M26 1.2L34 6L26 10.8Z" fill="#eef2fa" /><path d="M26 6H34L26 10.8Z" fill="#9aa6bb" />
        <path d="M2 6L0 3M2 6L0 9" stroke="#e8dcc4" stroke-width="2" />
      </svg></i></b></i>
    <i v-else-if="s.corpo === 'scheggia' || s.corpo === 'lancia'" class="sc-vola"><b class="sc-rot"><i class="sc-asta sc-ghiaccio">
      <svg v-if="s.corpo === 'scheggia'" viewBox="0 0 42 18" width="42" height="18">
        <path d="M0 9L13 2.5L42 9L13 15.5Z" fill="#bfe8ff" /><path d="M13 2.5L42 9L13 9Z" fill="#fff" opacity=".85" /><path d="M0 9L13 15.5L13 9Z" fill="#6db9e6" />
      </svg>
      <svg v-else viewBox="0 0 70 16" width="70" height="16">
        <path d="M0 8H52" stroke="#9fd8f5" stroke-width="3" stroke-linecap="round" />
        <path d="M44 1L70 8L44 15Z" fill="#cfefff" /><path d="M44 8H70L44 15Z" fill="#6db9e6" /><path d="M44 1L70 8L44 8Z" fill="#fff" opacity=".8" />
        <path d="M30 8L38 3M30 8L38 13" stroke="#cfefff" stroke-width="2" stroke-linecap="round" />
      </svg></i></b></i>
    <i v-else-if="s.corpo === 'ascia'" class="sc-vola"><i class="sc-gira">
      <svg viewBox="0 0 28 28" width="28" height="28">
        <path d="M5 24L17 5" stroke="#8a5a30" stroke-width="3" stroke-linecap="round" />
        <path d="M13 4C16 1 21 1.5 24 5C23.6 9.5 20.6 12.4 17 13Z" fill="#dfe6f2" /><path d="M24 5C23.6 9.5 20.6 12.4 17 13L15.6 10Z" fill="#8f9bb3" />
      </svg></i></i>
    <i v-else-if="s.corpo === 'falce'" class="sc-vola"><i class="sc-gira sc-lenta">
      <svg viewBox="0 0 34 34" width="34" height="34">
        <path d="M6 3A15 15 0 0 0 6 31A11 13 0 0 1 6 3Z" fill="#eef4ff" /><path d="M6 3A15 15 0 0 0 6 31A13 14 0 0 0 6 3Z" fill="#a9c0ee" />
      </svg></i></i>
    <i v-else-if="s.corpo === 'arco'" class="sc-arco">
      <svg viewBox="0 0 100 22" preserveAspectRatio="none">
        <path class="sc-alone" d="M0 11L10 4L19 17L31 5L42 18L54 4L66 17L78 6L88 16L100 11" />
        <path class="sc-nucleo" d="M0 11L10 4L19 17L31 5L42 18L54 4L66 17L78 6L88 16L100 11" />
      </svg></i>
    <i v-else-if="s.corpo === 'fascio'" class="sc-fascio"></i>

    <!-- ═════ quello che cade dall'alto ═════ -->
    <i v-else-if="s.corpo === 'fulmine'" class="sc-fulmine">
      <svg viewBox="0 0 40 100" preserveAspectRatio="none">
        <path class="sc-alone" d="M22 0L13 20L24 27L10 50L22 57L14 78L19 100" />
        <path class="sc-nucleo" d="M22 0L13 20L24 27L10 50L22 57L14 78L19 100" />
        <path class="sc-nucleo sc-ramo" d="M24 27L33 40L28 48" />
      </svg></i>
    <i v-else-if="s.corpo === 'colonna'" class="sc-colonna"></i>
    <i v-else-if="s.corpo === 'meteora'" class="sc-meteo"><i class="sc-sasso"><i class="sc-coda"></i></i></i>
    <template v-else-if="s.corpo === 'frecce'">
      <i v-for="(f, k) in FRECCE" :key="k" class="sc-pioggia" :style="{ '--x': f.x, '--d': f.d + 'ms', '--l': f.l }">
        <svg viewBox="0 0 10 40" width="13" height="52"><path d="M5 1V30" stroke="#c49a62" stroke-width="1.8" stroke-linecap="round" /><path d="M1.2 28L5 38.5L8.8 28Z" fill="#eef2fa" />
          <path d="M5 4L2 0.5M5 4L8 0.5M5 8L2 4.5M5 8L8 4.5" stroke="#e8dcc4" stroke-width="1.4" /></svg>
      </i>
    </template>
    <template v-else-if="s.corpo === 'massi'">
      <i v-for="(m, k) in MASSI" :key="k" class="sc-pioggia sc-masso" :style="{ '--x': m.x, '--d': m.d + 'ms', '--r': m.r + 'deg', '--k': m.s }">
        <svg viewBox="0 0 24 24" width="24" height="24"><path d="M3 18L5 8L11 3L19 5L22 13L17 21L7 22Z" fill="#8b8576" /><path d="M11 3L19 5L22 13L17 21L14 12Z" fill="#5f5a50" /><path d="M5 8L11 3L10 9Z" fill="#b9b2a0" /></svg>
      </i>
    </template>
    <template v-else-if="s.corpo === 'brace'">
      <i v-for="(b, k) in BRACE" :key="k" class="sc-pioggia sc-brace" :style="{ '--x': b.x, '--d': b.d + 'ms', '--k': b.s }"></i>
    </template>
    <template v-else-if="s.corpo === 'neve'">
      <i v-for="(f, k) in NEVE" :key="k" class="sc-fiocco" :style="{ '--x': f.x, '--d': f.d + 'ms', '--k': f.s }">
        <svg viewBox="0 0 12 12" width="11" height="11"><path d="M6 0.8V11.2M1.5 3.4L10.5 8.6M1.5 8.6L10.5 3.4" stroke="#e9f6ff" stroke-width="1.5" stroke-linecap="round" /></svg>
      </i>
    </template>

    <!-- ═════ quello che esce dal pavimento ═════ -->
    <svg v-else-if="s.corpo === 'radici'" class="sc-radici" viewBox="0 0 64 56" width="64" height="56">
      <path pathLength="1" d="M10 54C2 40 16 36 12 24C10 16 18 10 16 4" /><path pathLength="1" d="M26 54C34 44 22 34 30 24C34 18 28 12 32 2" />
      <path pathLength="1" d="M42 54C36 42 50 38 46 26C44 18 52 14 48 6" /><path pathLength="1" d="M54 54C62 44 52 36 58 28" />
      <path class="sc-spina" pathLength="1" d="M12 24L6 22M30 24L36 21M46 26L53 24M16 4L21 2" />
    </svg>
    <svg v-else-if="s.corpo === 'crepa'" class="sc-crepa" viewBox="0 0 120 40" width="120" height="40">
      <path pathLength="1" d="M60 22L44 14L30 18L16 8M44 14L36 26L22 30M60 22L78 30L92 24L108 32M78 30L84 38" />
    </svg>
    <i v-else-if="s.corpo === 'blocco'" class="sc-blocco"><i></i></i>

    <!-- ═════ quello che nasce sul mostro ═════ -->
    <template v-else-if="s.corpo === 'nube'">
      <i v-for="(c, k) in NUBI" :key="k" class="sc-nuvola" :style="{ '--x': c.x, '--y': c.y, '--d': c.d + 'ms', '--k': c.s }"></i>
    </template>
    <template v-else-if="s.corpo === 'esplosione' || s.corpo === 'scoppio'">
      <i class="sc-palla-fuoco"></i><i class="sc-onda-urto"></i>
      <i v-for="(b, k) in BRACI" :key="k" class="sc-favilla" :style="{ '--a': b.a + 'deg', '--d': b.d + 'ms', '--r': b.r }"></i>
    </template>
    <template v-else-if="s.corpo === 'rogo'">
      <i v-for="(f, k) in FIAMME" :key="k" class="sc-fiammella" :style="{ '--x': f.x, '--y': f.y, '--d': f.d + 'ms', '--k': f.s }">
        <svg viewBox="0 0 24 34" width="22" height="31"><path d="M12 1C13 8 21 11 21 21C21 28 17 33 12 33C7 33 3 28 3 22C3 17 6 15 7 11C9 13 10 15 10 17C12 14 12.5 7 12 1Z" fill="#ff6a1c" />
          <path d="M12 14C13 18 17 20 17 25C17 29 15 32 12 32C9 32 7 29 7 26C7 22 11 19 12 14Z" fill="#ffd25a" /></svg>
      </i>
    </template>
    <template v-else-if="s.corpo === 'sonno'">
      <b v-for="(z, k) in ZETA" :key="k" class="sc-zeta" :style="{ '--x': z.x, '--d': z.d + 'ms', '--k': z.s }">{{ z.t }}</b>
    </template>

    <!-- ═════ attraverso il campo ═════ -->
    <template v-else-if="s.corpo === 'onda'">
      <svg v-for="k in 3" :key="k" class="sc-arco-onda" viewBox="-4 -44 52 88" width="52" height="88" :style="{ '--d': (k - 1) * 90 + 'ms' }">
        <path d="M0 -40A40 40 0 0 1 0 40" />
      </svg>
    </template>
    <i v-else-if="s.corpo === 'fiammata'" class="sc-fiammata"></i>
    <i v-else-if="s.corpo === 'turbine'" class="sc-turbine">
      <svg viewBox="-30 -30 60 60" width="60" height="60"><circle class="sc-giro1" r="24" /><circle class="sc-giro2" r="17" /></svg>
    </i>

    <!-- ═════ solo sull'eroe ═════ -->
    <svg v-else-if="s.corpo === 'scudo'" class="sc-scudo" viewBox="0 0 24 24" width="38" height="38">
      <path :d="SCUDO" fill="#9fb4d6" stroke="#f1f6ff" stroke-width="1.2" /><path d="M12 2.8L19.5 5.6V11C19.5 16 16 19.6 12 21.2Z" fill="#6f86ad" /><path d="M12 6.5V17M8 10.5H16" stroke="#f1f6ff" stroke-width="1.4" stroke-linecap="round" />
    </svg>
    <i v-else-if="s.corpo === 'sfera'" class="sc-sfera"><i></i></i>
    <template v-else-if="s.corpo === 'pietra'">
      <i v-for="(p, k) in PIETRE" :key="k" class="sc-sasso-giro" :style="{ '--a': p.a + 'deg', '--k': p.s }">
        <svg viewBox="0 0 14 14" width="14" height="14"><path d="M1 9L3 3L8 1L13 5L12 12L5 13Z" fill="#8f897a" /><path d="M8 1L13 5L12 12L9 7Z" fill="#5f5a50" /></svg>
      </i><i class="sc-lampo-grigio"></i>
    </template>
    <template v-else-if="s.corpo === 'cura'">
      <i class="sc-alo-verde"></i>
      <i v-for="(c, k) in PLUS" :key="k" class="sc-croce" :style="{ '--x': c.x, '--d': c.d + 'ms', '--k': c.s }"><b></b><b></b></i>
    </template>
    <i v-else-if="s.corpo === 'specchio'" class="sc-specchio"><i></i></i>
    <i v-else-if="s.corpo === 'muro'" class="sc-muro"></i>

    <!-- ═════ i segni che restano sul mostro ═════ -->
    <template v-else-if="s.corpo === 'taglio' || s.corpo === 'croce'">
      <i class="sg-lama sg-l1"></i><i v-if="s.corpo === 'croce'" class="sg-lama sg-l2"></i>
      <i v-for="(g, k) in GOCCE" :key="k" class="sg-goccia" :style="{ '--a': g.a + 'deg', '--d': g.d + 'ms', '--r': g.r }"></i>
    </template>
    <template v-else-if="s.corpo === 'affondo'">
      <i class="sg-punta"></i>
      <i v-for="(r, k) in RAGGI6" :key="k" class="sg-raggio" :style="{ '--a': r.a + 'deg' }"></i>
    </template>
    <template v-else-if="s.corpo === 'urto'">
      <i class="sg-anello"></i><i class="sg-stella"></i>
      <i v-for="(r, k) in SASSI" :key="k" class="sg-sasso" :style="{ '--a': r.a + 'deg', '--d': r.d + 'ms' }"></i>
    </template>
    <svg v-else-if="s.corpo === 'arco'" class="sg-arco" viewBox="-40 -30 80 60" width="120" height="90">
      <path class="sg-arco1" d="M-34 18Q0 -34 34 14Q2 -14 -34 18Z" /><path class="sg-arco2" d="M-28 22Q2 -24 30 20" />
    </svg>
    <template v-else-if="s.corpo === 'scintilla'">
      <i v-for="(r, k) in RAGGI8" :key="k" class="sg-scintilla" :style="{ '--a': r.a + 'deg', '--l': r.l }"></i>
      <svg class="sg-zig" viewBox="-20 -20 40 40" width="46" height="46"><path d="M-17 -3L-8 -9L-4 3L6 -6L10 5L18 -1" /><path d="M-14 9L-5 4L1 11L9 4" /></svg>
    </template>
    <template v-else-if="s.corpo === 'colpo'">
      <i class="sg-lampo"></i>
      <i v-for="(r, k) in RAGGI6" :key="k" class="sg-raggio sg-raggio-corto" :style="{ '--a': (r.a + 30) + 'deg' }"></i>
    </template>
    <template v-else-if="s.corpo === 'brina'">
      <svg class="sg-cristallo" viewBox="-20 -20 40 40" width="68" height="68">
        <path d="M0 -17V17M-14.7 -8.5L14.7 8.5M-14.7 8.5L14.7 -8.5" /><path d="M-4 -14L0 -10L4 -14M-4 14L0 10L4 14M-13 -2.5L-8.5 -3.5L-9.5 -8M13 2.5L8.5 3.5L9.5 8M-13 2.5L-8.5 3.5L-9.5 8M13 -2.5L8.5 -3.5L9.5 -8" />
      </svg><i class="sg-gelo-lampo"></i>
      <i v-for="(r, k) in SCHEGGE" :key="k" class="sg-scheggia" :style="{ '--a': r.a + 'deg', '--d': r.d + 'ms', '--r': r.r }"></i>
    </template>
    <template v-else-if="s.corpo === 'luce'">
      <i class="sg-bagliore"></i><i class="sg-anello sg-anello-luce"></i>
      <i v-for="(m, k) in MOTI" :key="k" class="sg-granello" :style="{ '--x': m.x, '--d': m.d + 'ms', '--k': m.s }"></i>
    </template>
    <i v-else-if="s.corpo === 'scossa'" class="sg-scossa"><i></i></i>
    <svg v-else-if="s.corpo === 'rimbalzo'" class="sg-rimbalzo" viewBox="0 0 24 24" width="30" height="30">
      <path :d="SCUDO" fill="#8f98ab" stroke="#d9dfeb" stroke-width="1.3" /><path d="M12 2.8L19.5 5.6V11C19.5 16 16 19.6 12 21.2Z" fill="#6c7488" />
      <path d="M4 3L1 0.5M20 3L23 0.5M2 12H-0.5M22 12H24.5" stroke="#d9dfeb" stroke-width="1.4" stroke-linecap="round" />
    </svg>
  </div>
</template>
