/* Il service worker delle due pagine della scuola (docs/scuola/ripieghi.md): una pagina aperta una volta si riapre anche
   senza internet. Prima la rete, così una versione nuova arriva subito; la copia solo se la rete non risponde. Le altre
   richieste (il servizio, versione.json) non le tocca. */
const CASSETTO = 'scuola-pagine'
const PAZIENZA = 8000          // fino alle intestazioni: il corpo (20 MB) può metterci di più, e va bene
const PAGINE = ['index.html', 'maestra.html']

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

// il nome della pagina dentro lo scope (la cartella sola è index.html), o null se non è una delle due
function paginaDi(url) {
  const base = new URL(self.registration.scope).pathname
  if (url.origin !== self.location.origin || !url.pathname.startsWith(base)) return null
  const nome = url.pathname.slice(base.length) || 'index.html'
  return PAGINE.includes(nome) ? nome : null
}

async function prendi(richiesta, nome) {
  const cassetto = await caches.open(CASSETTO)
  const chiave = new URL(nome, self.registration.scope).href
  const rete = fetch(richiesta).then(async r => {
    if (r.ok) await cassetto.put(chiave, r.clone())
    return r
  })
  const scorta = () => cassetto.match(chiave)
  // la rete entro la pazienza; poi la copia, se c'è; se non c'è si aspetta ancora la rete
  const tempo = new Promise(ok => setTimeout(ok, PAZIENZA, 'tempo'))
  try {
    const primo = await Promise.race([rete, tempo])
    if (primo !== 'tempo' && primo.ok) return primo
    return (await scorta()) || (primo === 'tempo' ? await rete : primo)
  } catch {
    return (await scorta()) || Response.error()
  }
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const nome = paginaDi(new URL(e.request.url))
  if (nome) e.respondWith(prendi(e.request, nome))
})
