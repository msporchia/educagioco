#!/usr/bin/env bash
#
# Pubblica i giochi su un server di casa (un NAS, un Raspberry, quello che
# c'e'), copiando i file via ssh.
#
#   ./pubblica.sh            build + copia sul server
#   ./pubblica.sh --locale   solo build e pubblico/, senza toccare niente
#
# NON SERVE A CHI CLONA QUESTO REPO. Il modo normale di usare i giochi e'
# aprire l'HTML unico, o il sito su GitHub Pages che costruisce da solo la
# action in .github/workflows/. Questo script esiste perche' a casa mia i
# giochi girano anche su un server in rete locale, e cancellarlo avrebbe
# voluto dire tenerlo da un'altra parte.
#
# DOVE STA L'INDIRIZZO. Non qui dentro: sta in `.nas`, che git ignora, o
# nelle variabili d'ambiente. Il file ha due righe:
#
#     host=nas                                  # come lo chiama ssh
#     sito=https://qualcosa.esempio/giochi/     # da dove si apre
#
# Cosi' lo script si puo' leggere senza sapere dove abito. Senza `sito` il
# lavoro si fa lo stesso e si salta solo il controllo finale.

set -euo pipefail

QUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$QUI"

# le variabili d'ambiente vincono sul file, il file sui valori di partenza
[ -f .nas ] && . ./.nas
NAS="${GIOCHI_HOST:-${host:-nas}}"
SITO="${GIOCHI_SITO:-${sito:-}}"
WEBROOT="${GIOCHI_WEBROOT:-${webroot:-/volume1/docker/giochi/pubblico}}"

solo_locale=false
[ "${1:-}" = "--locale" ] && solo_locale=true

echo "→ build"
npm run build

echo "→ pubblico/"
mkdir -p pubblico
cp dist/index.html pubblico/index.html
cp dist/versione.json pubblico/versione.json
VERSIONE=$(sed -n 's/.*"id": "\([^"]*\)".*/\1/p' dist/versione.json)
ETICHETTA=$(sed -n 's/.*"etichetta": "\([^"]*\)".*/\1/p' dist/versione.json)
echo "  versione $VERSIONE"
# Il file unico per il doppio click sul PC resta allineato a quello servito
cp dist/index.html giochi.html

# Tutto quello che il build produce oltre all'HTML (service worker, manifest,
# icone) viene pubblicato: nginx serve la cartella cosi' com'e'.
for extra in dist/sw.js dist/manifest.webmanifest dist/*.png dist/*.svg; do
    [ -e "$extra" ] && cp "$extra" pubblico/
done

if $solo_locale; then
    echo "✓ pubblico/ aggiornato (server non toccato)"
    exit 0
fi

echo "→ server ($NAS)"
# scp non funziona: Synology non espone il subsystem sftp. Si passa da stdin.
# Un tar solo per non aprire una connessione per file.
tar czf - -C pubblico . | ssh "$NAS" \
    "cat > /tmp/giochi.tgz && \
     sudo mkdir -p $WEBROOT && \
     sudo tar xzf /tmp/giochi.tgz -C $WEBROOT && \
     rm /tmp/giochi.tgz"

if [ -z "$SITO" ]; then
    echo "✓ copiato (nessun indirizzo in .nas: salto il controllo)"
    exit 0
fi

# nginx monta la webroot: i file nuovi si vedono subito, niente da riavviare.
# Non ci si fida del "copiato bene": si chiede al sito che versione sta
# servendo e si controlla che sia quella appena costruita.
online=$(curl -s "${SITO%/}/versione.json" \
         | sed -n 's/.*"id": "\([^"]*\)".*/\1/p' || true)

if [ "$online" = "$VERSIONE" ]; then
    echo "✓ pubblicato → $SITO"
    echo "  sul telefono, in fondo alla schermata iniziale, deve leggersi:"
    echo "      aggiornato il $ETICHETTA"
else
    echo "✗ il sito serve '${online:-nulla}' invece di '$VERSIONE'"
    echo "  controlla: ssh $NAS 'sudo docker logs giochi'"
    exit 1
fi
