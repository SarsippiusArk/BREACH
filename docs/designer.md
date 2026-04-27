# Designer Guide — BREACH

## Visual Identity
BREACH is a sci-fi horizontal shmup with a serious-but-stylish aesthetic:
- **Palette**: Deep space navy/black backgrounds, electric blue UI accents, pilot-specific ship colors
- **Typography**: Press Start 2P pixel font for all in-game text
- **Ships**: Programmatic pixel-art drawn with Canvas 2D fillRect; integer coordinates, no anti-aliasing
- **Enemies**: Alien aesthetic — purples, blacks, magentas; organic/angular shapes
- **Explosions**: Orange/red/yellow pixel particle bursts with white flash center

## Pilot Color Identities
| Pilot | Primary | Accent |
|-------|---------|--------|
| Amy | #5599FF (blue) | #CCEEFF (light blue) |
| Rohan | #44CC77 (green) | #88DDAA (mint) |
| Akane | #FF5566 (red) | #FFAAAA (pink) |

## Ship Customization (Extras)
Each ship has 4 customizable color slots: MAIN, LITE (highlight), GLAS (cockpit), ENGN (engine glow).
Players choose from 8 preset options per slot. Saved to localStorage automatically.

## Level Themes
| Level | Theme Name | Visual Key |
|-------|-----------|-----------|
| 1 | Earth Upper Atmosphere | Blues, aurora, cloud parallax |
| 4 | Hyperspace | Purple warp lines, radial glow |
| 7–8 | Alien Space | Deep teal/purple nebula |

## Background Parallax Layers (Level 1)
- Stars (3 speed layers): 0.05, 0.12, 0.22 × scrollX
- Aurora bands: 0.18 × scrollX
- Earth horizon glow: static gradient
- Clouds: 0.35 × scrollX
- Debris: 0.55 × scrollX

## HUD Layout
- Top bar (18px tall): Score left, Hi-Score center
- P1 ship lives + HP dots lower-left
- P1 charge bar + special ammo dots lower-left-center
- P2 equivalent on right side
- Boss HP bar: wide bar centered at screen bottom during boss fights

## Cinematic Style
7 panels: space backgrounds drawn programmatically with gradients/shapes.
Each panel: 4 second display, fade in/out 0.5 sec. Fire/confirm to advance.
Pilot portraits drawn as simple pixel-art faces (placeholders for final art).

## Adding Future Art
All sprite draw functions in `src/draw/drawSprites.js` are pure Canvas 2D functions.
Replace any with image-based drawing (`ctx.drawImage`) for final pixel art sprites.
The function signatures remain the same — just swap the implementation.
