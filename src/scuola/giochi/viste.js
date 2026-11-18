// Le viste dei giochi per la pagina dei bambini, caricate a richiesta (docs/scuola/giochi.md)
import { defineAsyncComponent } from 'vue'

export const VISTE = {
  asteroidi: defineAsyncComponent(() => import('./asteroidi/Vista.vue')),
  survivors: defineAsyncComponent(() => import('./survivors/Vista.vue')),
  'passo-passo': defineAsyncComponent(() => import('./passo-passo/Vista.vue')),
  robot: defineAsyncComponent(() => import('./robot/Vista.vue')),
}
