# Buzz importer dependencies

`buzz-import.bundle.mjs` is generated from `../buzz-import.mjs` with esbuild. It bundles:

- JSZip 3.10.2 — MIT or GPL-3.0-or-later (MIT selected): https://github.com/Stuk/jszip/blob/main/LICENSE.markdown
- kiwi-schema 0.5.0 — MIT: https://github.com/evanw/kiwi/blob/master/LICENSE
- pako 3.0.2 — MIT and Zlib: https://github.com/nodeca/pako/blob/master/LICENSE
- fzstd 0.1.1 — MIT: https://github.com/101arrowz/fzstd/blob/master/LICENSE

The generated `.LEGAL.txt` contains upstream comments retained by esbuild. To rebuild, install those four versions and esbuild in a temporary directory, then bundle `../buzz-import.mjs` for `browser` as ESM with linked legal comments.
