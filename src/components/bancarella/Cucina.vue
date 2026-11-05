<script setup>
/* La cucina della bancarella, in prova: le stazioni, i piatti, la dispensa.
   Riceve lo stato e dice cosa si è toccato. Vedi docs/bancarella/cucina.md. */
import { computed } from 'vue'
import { INGREDIENTI, COLPI, quantoStazione, dispensaDi } from '../../motore/bancarella/cucina.js'
import { disegnaStazione, FIGURA_PASTA, FIGURA_PIATTO } from '../../grafica/bancarella-cucina.js'

const props = defineProps({ stato: { type: Object, required: true } })
const emit = defineEmits(['tocca', 'piatto'])

const NOMI = { pentola: 'pentola', padella: 'padella', forno: 'forno', tagliere: 'tagliere' }
const PRONTA = { pentola: 'scola!', padella: 'togli!', forno: 'sforna!', tagliere: 'sul piatto!' }
const stazioni = computed(() => Object.entries(props.stato.stazioni).map(([nome, s]) => ({
  nome, s, figura: disegnaStazione(nome, s.fase), quanto: Math.round(quantoStazione(s) * 100),
  scritta: s.fase === 'vuota' ? NOMI[nome] : s.fase === 'cuoce' ? 'cuoce…' : s.fase === 'taglia' ? `taglia! ${s.colpi}/${COLPI}`
    : s.fase === 'pronta' ? PRONTA[nome] : 'bruciata: buttala',
  sopra: nome === 'pentola' || !s.cosa ? '' : s.cosa === 'pizza' ? '🍕' : s.cosa === 'uovo' ? '🍳' : INGREDIENTI[s.cosa].emoji,
})))
const dispensa = computed(() => dispensaDi(props.stato).map(k => ({ k, ...INGREDIENTI[k] })))
const sul = p => {
  if (!p) return []
  if (p.pronto) return [p.pronto]
  return p.cose.filter(k => k !== 'pasta').map(k => (k === 'uovo' ? '🍳' : INGREDIENTI[k].emoji))
}
</script>

<template>
  <div class="cucina" data-cucina :style="{ '--stazioni': stazioni.length, '--piatti': stato.piatti.length, '--dispensa': Math.min(dispensa.length, 4) }">
    <div class="stazioni">
      <button v-for="x in stazioni" :key="x.nome" type="button" class="stazione" :class="'f-' + x.s.fase"
              :data-stazione="x.nome" :data-fase="x.s.fase" :aria-label="x.nome" @click="emit('tocca', x.nome)">
        <span class="figura">
          <svg viewBox="0 0 200 170" aria-hidden="true" v-html="x.figura"></svg>
          <span v-if="x.sopra" class="sopra">{{ x.sopra }}</span>
        </span>
        <span class="scritta">{{ x.scritta }}</span>
        <span class="cottura"><i :style="{ width: x.quanto + '%' }"></i></span>
      </button>
    </div>
    <div class="piatti">
      <button v-for="(p, i) in stato.piatti" :key="i" type="button" class="piatto"
              :class="{ pronto: p && p.pronto, cruda: p && p.daInfornare }"
              :data-piatto="i" :data-pronto="p ? p.pronto : ''" :aria-label="'piatto ' + (i + 1)" @click="emit('piatto', i)">
        <svg viewBox="0 0 120 84" aria-hidden="true" v-html="FIGURA_PIATTO(p && !p.pronto && p.cose[0] === 'pasta')"></svg>
        <span class="sul" :class="{ grande: p && p.pronto }">
          <i v-for="(e, k) in sul(p)" :key="k">{{ e }}</i>
        </span>
        <small v-if="p && p.daInfornare" class="nota">in forno!</small>
      </button>
    </div>
    <div class="dispensa">
      <button v-for="d in dispensa" :key="d.k" type="button" class="cosa" :data-cosa="d.k" :aria-label="d.nome" @click="emit('tocca', d.k)">
        <svg v-if="d.k === 'pasta'" viewBox="0 0 100 100" aria-hidden="true" v-html="FIGURA_PASTA"></svg>
        <b v-else>{{ d.emoji }}</b><small>{{ d.nome }}</small>
      </button>
    </div>
  </div>
</template>

<style scoped>
.cucina { flex:1; min-height:0; margin-top:-13px; padding:20px 8px calc(8px + env(safe-area-inset-bottom)); display:flex; flex-direction:column; gap:8px;
          background:linear-gradient(180deg,#d9c8ae,#c2ab8b); box-shadow:inset 0 12px 20px #00000030 }
button { padding:0; border:0; background:none; touch-action:manipulation }

/* il foglio del resto copre piatti e dispensa: l'altezza ferma tiene le stazioni in vista sopra di lui */
.stazioni { flex:none; height:164px; display:grid; grid-template-columns:repeat(var(--stazioni),minmax(0,1fr));
            grid-template-rows:minmax(0,1fr); gap:6px }
.stazione { position:relative; min-width:0; display:flex; flex-direction:column; align-items:center; gap:2px; padding:3px 4px 5px;
            border-radius:14px; background:#ffffff4d; box-shadow:inset 0 0 0 2px #ffffff40 }
.figura { position:relative; flex:1; min-height:0; width:100%; display:grid; place-items:center }
.figura svg { position:absolute; inset:0; width:100%; height:100%; display:block; overflow:visible }
.figura .sopra { position:absolute; left:50%; top:54%; transform:translate(-50%,-50%); font-size:clamp(24px,8vw,36px); line-height:1 }
.stazione :deep(.fiamma) { transform-origin:center bottom; transform-box:fill-box; animation:guizza .35s ease-in-out infinite alternate }
@keyframes guizza { from { transform:scaleY(.82) } to { transform:scaleY(1.1) } }
.scritta { flex:none; font-size:12.5px; font-weight:900; color:#5a4632; white-space:nowrap }
.cottura { flex:none; width:88%; height:8px; border-radius:5px; overflow:hidden; background:#00000022 }
.cottura i { display:block; height:100%; border-radius:5px; background:#4fb36b }
.f-pronta { background:#fff3bf; box-shadow:inset 0 0 0 3px #ffb020; animation:chiama .55s ease-in-out infinite alternate }
.f-pronta .cottura i { background:#ffa62b }
.f-pronta .scritta { color:#a35f00 }
.f-scotta { background:#f5c9bd; box-shadow:inset 0 0 0 3px #d9482f }
.f-scotta .scritta { color:#a8301f }
.f-scotta .sopra { filter:brightness(.35) }
@keyframes chiama { from { transform:scale(1) } to { transform:scale(1.03) } }
@media (prefers-reduced-motion: reduce) { .f-pronta, .stazione :deep(.fiamma) { animation:none } }

.piatti { flex:1; min-height:0; display:grid; grid-template-columns:repeat(var(--piatti),minmax(0,1fr)); gap:6px }
.piatto { position:relative; min-height:0; min-width:0; display:grid; place-items:center; border-radius:14px; background:#ffffff33 }
.piatto svg { width:94%; max-height:100%; display:block; filter:drop-shadow(0 3px 2px #00000030) }
.piatto.pronto { background:#d7f3d4; box-shadow:inset 0 0 0 3px #4fb36b }
.piatto.cruda { background:#ffe3c2; box-shadow:inset 0 0 0 3px #ff9f1c }
.sul { position:absolute; left:50%; top:50%; transform:translate(-50%,-56%); display:flex; font-size:clamp(20px,6.4vw,28px); line-height:1 }
.sul.grande { font-size:clamp(34px,11vw,48px) }
.sul i { font-style:normal; margin:0 -3px }
.nota { position:absolute; left:0; right:0; bottom:5px; font-size:12px; font-weight:900; color:#a35f00 }

.dispensa { flex:none; display:grid; grid-template-columns:repeat(var(--dispensa),minmax(0,1fr)); gap:6px }
.cosa { min-width:0; display:flex; flex-direction:column; align-items:center; justify-content:center; height:66px; border-radius:13px; background:#fffdf7;
        box-shadow:0 3px 0 #00000030 }
.cosa:active { transform:translateY(2px); box-shadow:0 1px 0 #00000030 }
.cosa b { font-size:30px; line-height:1.1; font-weight:400 }
.cosa svg { width:36px; height:36px; display:block }
.cosa small { font-size:11.5px; font-weight:900; color:#6d5a44 }
</style>
