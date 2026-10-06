# Retro Visual Lab

A dependency-free browser workstation combining four local image tools:

- **Win98 Layout**: arrange editable Win98-style event widgets over the bundled default poster or an uploaded image, with full-state restore and two persistent snapshots.
- **CRT Processor**: apply real-time WebGL CRT simulation, distortion, signal artifacts, and color adjustments, with source-image-aware snapshots.
- **Invitation Maker**: personalize a Win98 invitation card and export the live CRT-rendered result.
- **WeChat Assets**: create 1080 × 2400 vertically seamless CRT backgrounds, editable Win98 Notepad, two-button Dialog and Paint 98 windows, plus a configurable segmented Progress 98 divider.

All image processing happens locally in the browser. Uploaded images are not sent to a server.

## Run locally

```bash
python3 -m http.server 4174
```

Open `http://127.0.0.1:4174/`.

## Paperplay / fifth tab

Open `/#paperplay` for the migrated extension studio: background slices, galleries, click reveals, perspective stacks, parallax, text, multi-selection/alignment, crop, undo, local drafts, project JSON and HTML/SVG/PNG export. The component/source library is available from the top toolbar, with local settings and copy/download.

The Windows 98 CD Player supports a custom cover (cover/contain), Artist, Track, window title and starting volume. Local audio / HTTPS audio links support play/pause, stop, ±10 seconds, seek. Playback volume is configured in the inspector; there is no volume slider on the player. Music service links open the official song page. Downloaded interactive HTML includes the same player. Static and WeChat exports retain its visual design; WeChat playback requires a native music card.

Extension drafts belong to a different browser origin. Download the project JSON from the extension and open it here to transfer existing work. Website drafts are stored separately in IndexedDB. Reading or modifying the WeChat editor requires the extension; the website provides copy/export instead.

The fifth tab and its export panel have been checked in a local browser. Phone WeChat compatibility still needs final-device verification before publication.
