# Retro Visual Lab

A dependency-free browser workstation combining three local image tools:

- **Win98 Layout**: arrange editable Win98-style event widgets over the bundled default poster or an uploaded image, with full-state restore and two persistent snapshots.
- **CRT Processor**: apply real-time WebGL CRT simulation, distortion, signal artifacts, and color adjustments, with source-image-aware snapshots.
- **Invitation Maker**: personalize a Win98 invitation card and export the live CRT-rendered result.

All image processing happens locally in the browser. Uploaded images are not sent to a server.

## Run locally

```bash
python3 -m http.server 4174
```

Open `http://127.0.0.1:4174/`.
