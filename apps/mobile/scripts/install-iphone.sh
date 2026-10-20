#!/bin/zsh
# Reinstala LingoPulse en el iPhone conectado por cable (cuenta gratuita de Apple: la app caduca a los 7 días).
# Uso (desde ~/Projects/EnglishApp/apps/mobile):  ./scripts/install-iphone.sh
set -e
export LANG=en_US.UTF-8
# El nombre del iPhone puede tener espacios: se toma el identificador (UUID) de la fila conectada.
DEVICE=$(xcrun devicectl list devices 2>/dev/null | grep -E "connected|available" | grep -i iPhone | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}' | head -1)
if [ -z "$DEVICE" ]; then echo "Conecta y desbloquea el iPhone (por cable o Wi-Fi emparejado)."; exit 1; fi
cd "$(dirname "$0")/../ios"
UDID=$(xcodebuild -workspace LingoPulse.xcworkspace -scheme LingoPulse -showdestinations 2>/dev/null | grep "platform:iOS" | grep -v "Simulator" | grep -v "placeholder" | grep -oE 'id:[0-9A-Za-z-]+' | head -1 | cut -d: -f2)
if [ -z "$UDID" ]; then echo "No se encontró el UDID de destino de iOS."; exit 1; fi
echo "Compilando e instalando en iPhone ($UDID)..."
xcodebuild -workspace LingoPulse.xcworkspace -scheme LingoPulse -configuration Release \
  -destination "id=$UDID" -allowProvisioningUpdates -derivedDataPath build build | grep -E "error:|BUILD (SUCCEEDED|FAILED)"
xcrun devicectl device install app --device "$DEVICE" build/Build/Products/Release-iphoneos/LingoPulse.app
echo "Listo: LingoPulse reinstalada en el iPhone."
