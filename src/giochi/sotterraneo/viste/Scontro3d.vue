<script setup>
// Lo scontro nel Sotterraneo 3D: i combattenti li disegna la scena (scena3d/), qui ci sono le scritte sopra di loro — il nome di chi
// ha un grado o è il bersaglio, la barra della vita senza numeri, gli stati addosso, i segni di «resiste» e «teme», i numeri che
// salgono —, la fila dei turni sul bordo destro, la riga dell'agguato e il nome dell'abilità usata. Gli stessi pezzi e le stesse
// classi di viste/Scontro.vue; ogni scritta sta in un aggancio che la scena porta sopra la testa della sua figura (`aggancia`).
// Non calcola niente: i numeri vengono dal motore (viste/campo.js) e dal racconto (viste/racconto.js, `fx`).
import { onUnmounted } from 'vue'
import FilaDeiTurni from './FilaDeiTurni.vue'
import Glifo from './Glifo.vue'
import SegniAddosso from './SegniAddosso.vue'
import MossaAnnunciata from './MossaAnnunciata.vue'

const props = defineProps({
  mostri: { type: Array, required: true },
  turni: { type: Array, default: () => [] },
  eroe: { type: Object, default: () => ({}) },
  mie: { type: Array, default: () => [] },
  incanti: { type: Array, default: () => [] },
  fx: { type: Object, required: true },
  aggancia: { type: Function, required: true },   // (chi, elemento | null): la scena lo porta sopra la figura
  posti: { type: Object, default: null }, apertura: { type: Object, default: null }, palco: { type: Object, default: null },
})

const ossaDi = m => (props.fx.attivo && props.fx.ossa[m.i] != null ? props.fx.ossa[m.i] : m.ossa)
const mortoDi = m => (props.fx.attivo ? !!props.fx.morti[m.i] : m.morto)
const statiDi = m => (props.fx.attivo && props.fx.stati[m.i] ? props.fx.stati[m.i] : m.stati)
const numeriDi = chi => props.fx.numeri.filter(n => n.su === chi)
const pulita = m => !props.fx.attivo && !mortoDi(m)
const aggancio = chi => el => props.aggancia(chi, el || null)
onUnmounted(() => { props.aggancia('eroe', null); for (const m of props.mostri) props.aggancia(m.i, null) })
</script>

<template>
  <div class="sot3d-scontro" data-duello data-scontro-3d :data-mostri="mostri.length" :data-racconto="fx.attivo ? 'in-corso' : null">
    <!-- sopra l'eroe: il nome dell'abilità e i numeri che prende -->
    <div :ref="aggancio('eroe')" class="sot3d-ancora" data-eroe-scontro>
      <span v-if="fx.nome" :key="'n' + fx.nome.nome" class="sot-nome-abilita sot3d-abilita" data-abilita-usata :style="{ '--tinta': fx.nome.tinta }">
        <Glifo :nome="fx.nome.glifo" :misura="14" /> {{ fx.nome.nome }}
      </span>
      <SegniAddosso :stati="mie" :largo="34" />
      <span v-for="n in numeriDi('eroe')" :key="n.id" class="sot-numero" :class="'sot-numero-' + n.tipo" data-cifra>{{ n.testo }}</span>
    </div>
    <!-- sopra ogni mostro: le stesse scritte del palco 2D (il bersaglio si sceglie toccando la figura nella scena) -->
    <div v-for="m in mostri" :key="m.i" :ref="aggancio(m.i)" class="sot3d-ancora sot-m" :class="{ 'sot-morto': mortoDi(m), 'sot-bersaglio': pulita(m) && m.bersaglio }"
         data-mostro :data-i="m.i" :data-tipo="m.tipo" :data-nome="m.nome" :data-grado="m.grado" :data-variante="m.variante" :data-colpisce="m.colpisce"
         :data-bersaglio="pulita(m) && m.bersaglio ? '' : null" :data-colpito="pulita(m) && m.colpito ? m.colpito : null"
         :data-morto="mortoDi(m) ? '' : null" :data-grande="m.grosso || null" :data-porta-chiave="m.chiave ? '' : null">
      <span v-if="!mortoDi(m) && (m.grado || m.bersaglio || m.grosso)" class="sot-m-nome" :class="m.grado && ['sot-grado', 'sot-grado-' + m.grado]" data-nome-mostro>{{ m.etichetta }}</span>
      <!-- la mossa che farà al suo turno (docs/sotterraneo/mosse.md); l'anello a terra lo disegna la scena -->
      <MossaAnnunciata v-if="pulita(m) && m.mossa" class="sot3d-mossa" :mossa="m.mossa" />
      <span class="sot-m-corpo sot3d-corpo">
        <span v-if="pulita(m) && m.segni.length" class="sot-m-segni" data-segni>
          <span v-for="g in m.segni" :key="g.tipo + g.glifo" class="sot-segno-pre" :class="'sot-segno-pre-' + g.tipo" :style="{ '--tinta': g.tinta }" :data-segno-pre="g.tipo" :title="g.dice">
            <Glifo :nome="g.glifo" :misura="11" />
          </span>
        </span>
        <span class="sot-m-stati" data-effetti>
          <span v-for="x in statiDi(m)" :key="x.chiave" class="sot-chip" :class="'sot-chip-' + (x.fuoco ? 'fuoco' : x.chiave)" :data-stato="x.chiave" :title="x.dice">
            <Glifo :nome="x.glifo" :misura="12" /><b v-if="x.t">{{ x.t }}</b></span>
        </span>
        <span v-for="n in numeriDi(m.i)" :key="n.id" class="sot-numero" :class="['sot-numero-' + n.tipo, n.tono && 'sot-segno-' + n.tono, n.barrato && 'sot-segno-barrato']"
              :style="n.riga != null ? { '--riga': n.riga } : null" data-cifra><Glifo v-if="n.glifo" :nome="n.glifo" :misura="11" />{{ n.testo }}</span>
      </span>
      <span class="sot-vita" data-vita :data-ossa="ossaDi(m)" :style="{ '--barra': m.grosso ? '84px' : '44px' }"><i :style="{ width: Math.max(0, ossaDi(m) / m.ossaMax * 100) + '%' }"></i></span>
    </div>

    <div class="sot3d-fila"><FilaDeiTurni :turni="fx.fila || turni" :mostri="mostri" :eroe="eroe" :incanti="incanti" /></div>
    <p v-if="fx.riga" class="sot-apertura" data-apertura>{{ fx.riga }}</p>
    <div v-if="mie.length" class="sot-stati-mie sot3d-mie em" data-stati-eroe>
      <span v-for="x in mie" :key="x.chiave" :data-stato="x.chiave" :data-preparato="x.preparato || null" :data-passi="x.passi || null"><Glifo :nome="x.glifo" :misura="14" /> {{ x.dice }}</span>
    </div>
  </div>
</template>
