# BREACH — Game Design Document
**Version 1.0 | Confidential Development Reference**

---

## 1. Overview

| Field | Value |
|-------|-------|
| **Title** | BREACH |
| **Genre** | Horizontal Shoot-Em-Up (Shmup) |
| **Platform** | Browser (Canvas 2D / HTML5) |
| **Players** | 1–2 simultaneous (shared keyboard or gamepad) |
| **Target Audience** | Shmup fans, retro gaming enthusiasts, ages 13+ |
| **Tone** | Pulse-pounding action, anime-adjacent cinematic opener, jazz/electronica soundtrack |
| **Visual Style** | TurboGrafx-16 / PC Engine — jewel-tone 512-color palette, pixel art |
| **Resolution** | 480 × 270 logical (letterboxed, aspect-preserved) |

---

## 2. Premise & Narrative

**Year 2187.** A rift tears open in Earth's upper atmosphere. Through it pours an alien armada of unknown origin and purpose. Earth's defense forces scramble every available ship. The war is immediate and brutal.

High Command identifies an opportunity: the rift itself may be a weakness. While the bulk of Earth's fleet engages the invaders, three rookie pilots are given the most dangerous mission in human history — fly into the rift, push through to the alien home world, and find a way to close it from the other side.

No backup. No support fleet. Just three ships, their skills, and each other.

---

## 3. Characters

### Amy Chen — "Blue Leader"
- **Ship Color:** Deep blue / cyan
- **Role:** Balanced interceptor, twin-barrel rapid fire
- **Personality:** Bubbly, seemingly ditzy, fashion-conscious — actually a tactical genius with lightning-fast reflexes. Often makes light of danger. Secretly terrified but never lets it show.
- **Special Ability:** Double-barrel mode fires two simultaneous beams; charge shot fires twin heavy beams.
- **Stats:** Speed ★★★ | Fire Rate ★★★★★ | Armor ★★★ | Special ★★★
- **Signature Line:** *"Finally, something interesting."*

### Rohan Mehta — "Green Two"
- **Ship Color:** Deep green / teal
- **Role:** Heavy weapons specialist, lock-on missile volley
- **Personality:** Sardonic smartass who hides genuine competence behind a wall of sarcasm. Deeply loyal. Has memorized every alien weapons system scan he could get his hands on.
- **Special Ability:** Lock-on missile salvo — targets up to 3 enemies simultaneously. Highest special ammo count.
- **Stats:** Speed ★★★ | Fire Rate ★★★ | Armor ★★★ | Special ★★★★★
- **Signature Line:** *"Three ships vs. an entire alien armada. I love terrible odds."*

### Akane Miyamoto — "Red Three"
- **Ship Color:** Deep red / amber
- **Role:** Speed fighter, beyond-limit velocity burst
- **Personality:** Calm, precise, polite at all times — even in the heat of battle. Her composure is genuine, not a performance. She speaks rarely and says exactly what needs to be said.
- **Special Ability:** Speed burst — pushes the ship's drives past safe limits for 1.2 seconds, enabling extreme evasive maneuvers and ramming speed.
- **Stats:** Speed ★★★★★ | Fire Rate ★★★ | Armor ★★ | Special ★★★
- **Signature Line:** *"We will return. I am certain."*

---

## 4. Core Gameplay Loop

```
SPAWN AT LEVEL START
      ↓
NAVIGATE + SHOOT advancing enemies
      ↓
COLLECT POWER-UPS from defeated enemies
      ↓
SURVIVE MID-BOSS encounter (camera pauses)
      ↓
PRESS THROUGH elite wave gauntlet
      ↓
DEFEAT LEVEL BOSS (camera pauses)
      ↓
LEVEL CLEAR → next level
```

The game scrolls automatically left-to-right at a constant speed (55 px/s base). Players control their ship in the left ~40% of the screen. Enemies spawn from the right edge and move toward the player.

---

## 5. Controls

| Action | Player 1 | Player 2 |
|--------|----------|----------|
| Move | Arrow Keys or WASD | Numpad 8/4/5/6 |
| Fire (tap) | Space / Z | Numpad 0 / Ctrl Right |
| Charge Fire (hold then release) | Space / Z | Numpad 0 / Ctrl Right |
| Special Weapon | Shift / X | Shift Right |
| Pause | Escape | Escape |
| Confirm (menus) | Enter / Space | Numpad Enter |
| Back (menus) | Escape / Backspace | Backspace |

**Gamepad (Standard Layout):** A=Fire, X=Special, Start=Pause, D-Pad/Stick=Move

---

## 6. Weapons System

### Standard Fire
- **Tap:** Single rapid shot (standard damage, high speed)
- **Hold:** Begins charge. Visual indicator on ship grows as charge fills.
- **Release at 85%+ charge:** Charged shot — slow but high damage, large hitbox
- **Hold without charging (< 0.25s):** Auto-fires rapid shots at rate determined by pilot's fire rate stat

### Pilot Specials
| Pilot | Special | Ammo |
|-------|---------|------|
| Amy | (passive) Double-barrel — all shots are twin-beam | 8 |
| Rohan | Lock-on missile salvo — 3 homing missiles, 4 damage each | 12 |
| Akane | Speed burst — 2.4× speed for 1.2s, triggered by special button | 8 |

---

## 7. Power-Up System

Power-ups drop from defeated enemies (random roll) and spawn at fixed intervals in level event timelines.

| Icon | Name | Effect |
|------|------|--------|
| **S** | Speed Up | +20% movement speed (stacks to +80%) |
| **R** | Rapid Fire | Reduces fire interval by 15% (stacks × 3) |
| **C** | Charge Up | Increases charged shot damage multiplier by +0.5 (stacks to ×3) |
| **P** | Shield | Absorbs 3 hits before breaking (stacks to 6) |
| **+** | Special Ammo | +2 special ammo |
| **1** | Extra Life | +1 life (max 9) |

All power-ups drift left slowly, bobbing vertically. They despawn after 15 seconds.

---

## 8. Level Design

The game unfolds across 8 levels with escalating enemy density and environmental storytelling.

### Level 1 — Earth Upper Atmosphere
- **Theme:** Deep blue/navy sky, aurora bands, cloud layers, distant Earth surface
- **Music:** Jazz/electronica fusion — E minor, 128 BPM, driving bass-line
- **Enemies:** Fighter Drones (straight/sine/dive patterns), Missile Frigates (hold positions, aimed shots), Armor Cruisers (slow, high HP, dual cannons)
- **Mid-Boss:** Sentinel Platform — rotating cannon arms, aimed shots
- **Boss:** Stratocruiser Leviathan — massive multi-turret capital ship, 3 attack phases

### Level 2 — Between Earth and Moon
- **Theme:** Deep black space, Earth visible far behind, Moon ahead
- **Music:** More aggressive electronica, higher BPM

### Level 3 — Near Moon Surface
- **Theme:** Crater-pocked grey surface scrolling beneath, hard vacuum black above
- **Music:** Eerie jazz, dissonant chords

### Level 4 — Hyperspace
- **Theme:** Warp tunnel, purple energy lines, warped color palette
- **Music:** Frantic electronica, distorted bass

### Level 5 — Near the Extra-Dimensional Portal
- **Theme:** Reality-warping portal effects, alien geometry beginning to appear
- **Music:** Jazz/alien fusion, irregular meter

### Level 6 — The Layer Between Universes
- **Theme:** Void between dimensions — no stars, impossible colors, fractured space
- **Music:** Ambient bass with percussive electronica

### Level 7 — Alien Space
- **Theme:** Alien star systems, bioluminescent nebulae, unknown planetary bodies
- **Music:** Fast alien electronica, driving

### Level 8 — Alien Home World
- **Theme:** Massive alien planet surface, alien cities, final battle above the homeworld
- **Music:** Epic boss track, jazz-meets-orchestral

---

## 9. Enemy Roster

### Standard Enemies

| Enemy | Width | Height | HP | Speed | Behavior |
|-------|-------|--------|----|-------|----------|
| Fighter Drone | 14 | 8 | 1 | Fast | Straight, Sine wave, Diving |
| Missile Frigate | 26 | 16 | 3 | Medium | Hold position, aimed missiles |
| Armor Cruiser | 38 | 20 | 6+ | Slow | Straight push, spray + aimed fire |

**Drone Patterns:**
- `straight` — moves left at constant speed, fires forward
- `sine` — oscillates vertically while moving left
- `dive` — initially straight, then dives toward nearest player

**Frigate Pattern:**
- `hold` — maintains relative screen position while firing aimed missiles

**Cruiser Pattern:**
- `straight` — slow advance, fires aimed + spray combination

### Bosses

| Boss | Level | HP | Mechanics |
|------|-------|-----|-----------|
| Sentinel Platform | Level 1 (mid) | 40 | Rotating cannon arms (4), aimed shots, phase 2 frantic fire |
| Stratocruiser Leviathan | Level 1 (final) | 120 | 4 turrets, 3 phases, phase 3 triple-spread |

**Boss Encounter Rules:**
- Camera stops scrolling on boss spawn
- Music switches to boss track
- Boss displays HP bar at bottom of screen
- Boss death drops power-ups and resumes camera

---

## 10. Scoring

| Event | Points |
|-------|--------|
| Drone destroyed | 100 |
| Frigate destroyed | 300 |
| Cruiser destroyed | 800 |
| Sentinel killed | 5,000 |
| Leviathan (Level 1 boss) killed | 20,000 |
| Extra Life collected | — (saves hi-score) |

Hi-score is saved to browser localStorage and persists between sessions.

---

## 11. Game Modes

### New Game
Standard playthrough, Levels 1–8 in sequence.

### Continue
Resumes from a checkpoint. Saves pilot choice, level, score, and lives.

### Options
- Music volume
- SFX volume
- Return to menu

### Extras
- **Ship Palette Editor** — Customize each pilot's ship colors across 4 color channels (main body, highlight, cockpit, engine). Changes are saved per pilot.

### New Game + (Hidden)
- Unlocked by completing the normal game once
- Revealed by holding UP on the Extras menu item for 2 seconds
- Level order is randomized each run
- Enemies have increased HP and speed
- New enemy patterns unlocked

---

## 12. Unlockable Pilots

Two secret pilots and one alien pilot are locked behind in-game achievements.

| Pilot | Unlock Condition |
|-------|-----------------|
| **Secret Pilot A** | Complete Level 5 without losing a life |
| **Secret Pilot B** | Score 1,000,000 total points |
| **Alien Pilot** | Complete the normal game once |

Locked pilots appear as "?????" on the character select screen.

---

## 13. Cinematic Opener

A 7-panel anime-style cinematic plays before character selection on New Game:

1. **Year 2187** — Space rift tears open, alien fleet emerges
2. **Battle** — Earth forces engage, explosions across Earth orbit
3. **Command Center** — Mission briefing: *"We need pilots inside it. Now."*
4. **Amy's cockpit** — *"Finally, something interesting."*
5. **Rohan's cockpit** — *"Three ships vs. an entire alien armada. I love terrible odds."*
6. **Akane's cockpit** — *"We will return. I am certain of it."*
7. **Launch** — *"Operation BREACH. Three ships launch. Earth's fate depends on them."*

Press Fire to skip individual panels or the full sequence.

---

## 14. Audio Design

### Music
- **Style:** Fusion of Jazz and Electronic (bass-driven, rhythmic, energetic)
- **Menu Theme:** Atmospheric drone melody, 90 BPM, minor scale
- **Level 1 Theme:** Jazz-electronica, E minor, 128 BPM — kick/hi-hat/bass walk/melodic arpeggios/chord pads
- **Boss Theme:** Aggressive electronica, 160 BPM, chromatic bass riff, heavy kick pattern
- All music is procedurally synthesized via Web Audio API — no external audio files required

### Sound Effects (synthesized)
- Laser fire (rapid/charged variants per pilot)
- Explosions (small, large)
- Hit confirmation
- Power-up collect / life up
- Menu navigation / selection

---

## 15. Visual Style Reference

**Inspiration:** TurboGrafx-16 / PC Engine shmups — *Blazing Lazers*, *Gate of Thunder*, *Lords of Thunder*, *R-Type*

**Palette philosophy:**
- 3-bit per channel (8 values per R/G/B): `0x00 0x24 0x49 0x6D 0x92 0xB6 0xDB 0xFF`
- Total: 512 colors available
- Jewel-like saturated primaries, deep blacks, vivid specular highlights

**Ship design language:**
- Clean, bold silhouettes readable at 24×12 pixels
- 6–8 distinct color zones per ship
- Animated engine glow (flickering hot core → orange plume)
- Glowing cockpit glass with specular highlight dot
- Metallic barrel/cannon elements

**Background design:**
- 4-layer parallax starfield with mixed warm/cool star colors
- Theme-specific atmospheric effects (aurora, nebulae, warp lines)
- Colored nebula cloud layers in all themes
- Dithered gradient edges for planet/atmospheric elements

---

## 16. Technical Specification

| Item | Detail |
|------|--------|
| Engine | Vanilla Canvas 2D, ES Modules |
| Build | Vite 7.x |
| Resolution | 480 × 270 logical (aspect-preserved letterbox) |
| Frame Rate | 60 FPS target (rAF) |
| Input | Keyboard + Standard Gamepad API |
| Audio | Web Audio API (procedural synthesis) |
| Save | localStorage (save, palette, unlocks, hi-score) |
| Assets | 100% code-generated (no external image/audio files) |

---

## 17. Development Roadmap

### Phase 1 — Core Loop ✓
- Main menu, cinematic, character select, Level 1 gameplay
- All 3 pilots with unique abilities
- Power-up system
- Boss encounters
- Basic audio (music + SFX)

### Phase 2 — Content Expansion
- Levels 2–8 full implementation
- Boss encounters for each level
- New enemy types per zone
- Full soundtrack (8 level tracks)

### Phase 3 — Polish
- Extras scene (palette editor fully functional)
- NG+ mode
- Hi-score leaderboard
- Secret pilot unlocks
- Full opening cinematic with portraits

### Phase 4 — Post-Launch
- Level editor (unlockable)
- User level sharing
- Additional secret content

---

*BREACH — Infiltrate the Rift*
*© 2025 All Rights Reserved*
