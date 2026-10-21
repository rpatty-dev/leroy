#!/bin/bash
set -e

SRC_DIR="$HOME/leroy"
DIST_DIR="$SRC_DIR/dist"
STAGING="$DIST_DIR/staging"
DMG_PATH="$DIST_DIR/Leroy-v2.0-macOS.dmg"

rm -rf "$STAGING" "$DMG_PATH"
mkdir -p "$STAGING/bin"

cp "$SRC_DIR/bin/leroy.js" "$STAGING/bin/"
cp -r "$SRC_DIR/skills" "$STAGING/"
cp -r "$SRC_DIR/assets" "$STAGING/"
cp "$SRC_DIR/package.json" "$STAGING/"
cp "$SRC_DIR/README.md" "$STAGING/"
cp "$SRC_DIR/ABOUT.md" "$STAGING/"

cat << 'LAUNCHER' > "$STAGING/install-leroy.command"
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DEST="$HOME/.local/bin"
mkdir -p "$DEST"
ln -sf "$DIR/bin/leroy.js" "$DEST/leroy"
chmod +x "$DIR/bin/leroy.js"
export PATH="$DEST:$PATH"
echo "✓ Leroy linked to $DEST/leroy"
echo "Running initial setup..."
"$DIR/bin/leroy.js" setup
LAUNCHER
chmod +x "$STAGING/install-leroy.command"

ln -s /Applications "$STAGING/Applications"

hdiutil create -volname "Leroy Agent" -srcfolder "$STAGING" -ov -format UDZO "$DMG_PATH"
rm -rf "$STAGING"
echo "✓ DMG created at $DMG_PATH"
