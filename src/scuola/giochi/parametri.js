// L'editor della maestra per i giochi che hanno un contenuto loro (`tipo` nella scheda): docs/scuola/giochi.md
import { defineAsyncComponent } from 'vue'

export const PARAMETRI = {
  'passo-passo': defineAsyncComponent(() => import('./passo-passo/Parametri.vue')),
  robot: defineAsyncComponent(() => import('./robot/Parametri.vue')),
}
