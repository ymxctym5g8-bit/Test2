#!/bin/sh
# Kopiert die aktuellen Spieldateien aus ../app in das iOS-Projekt.
cd "$(dirname "$0")"
rm -rf NekoNoMachi/web && cp -R ../app NekoNoMachi/web && echo "Spieldateien aktualisiert."
