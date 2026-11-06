# Environmental Interactivity Report

**Status: the event system is built and tested, with its first event, the far flock. Pointer depth parallax and chapter orientation are built. Clickable landmarks are designed but not built: they need your decision on content.** 2026-11-06.

## Principle

Interactions reward attention without asking for it. Nothing blinks, no HUD, no buttons on the art. Each interaction either responds to the visitor's own movement (scroll, pointer) or tells them where they are.

## Built

### 1. Event clocks (`src/events.js`)

The rule from the [effects plan](ENVIRONMENT_EFFECTS_TECH_PLAN.md): **scroll decides what state the world is in; time only decides how it gets there.** Each event has a clock from 0 to 1, aiming at 1 once the walk passes its mark. The clock moves at real-time speed, 2.5 times faster backwards, and is capped at 0.25 s a step so a tab switch can't skip it. Clocks are uniforms, so no event ever compiles a shader.

| Check | Result |
|---|---|
| Visitor stops at the mark | The clock keeps rising in real time: the event finishes |
| Visitor scrolls back | The clock falls 2.5 times faster: 0.222 → 0.153 → 0.083 → 0.014 → 0 in four steps |
| **Settled state:** the same position reached from before and from after | **0 differing pixels** |
| Reduced motion | Clocks jump to their targets; the flock does not fly at all |

Raw data: `measure/cinematic/results/flock.json`.

### 2. The far flock

**When:** the camera cranes over the crest (p 0.19) and the gate appears. Twenty-three birds lift from the western plain and cross the northern sky over about 9 s.

**What:** brush marks, not models. Each bird is two tapered strokes whose tips rise and fall. In ink they are literally marks on the page; in memory they are umber, in colour deep indigo; by night they have gone. Never thinner than about 1.5 px, so they don't shimmer. Hidden behind anything nearer, with a per-pixel depth test against the G-buffer.

**Why there:** the crest is the first big reveal. Something alive, far off, gives the empty land scale and time, without competing with the gate.

**Cost:** one draw call of 23 points, only while the clock is between 0 and 1.

### 3. Pointer depth parallax

A few centimetres of real camera movement towards the pointer, through a critically damped spring of about 0.6 s. Foreground and background move against each other, which is the depth cue; the view does not rotate. Strength depends on the shot: 0.35 m in the open landscape, 0 in the passage. **Off** for reduced motion, coarse pointers (touch) and test captures.

### 4. Orientation

| Element | Behaviour |
|---|---|
| **Chapter caption** | When a chapter begins, a small plate fades in at the bottom left for 3.6 s: "3 / 6", then "The First Gate". Parchment on ink, mono 13–15 px, text never on raw art. Announced politely to screen readers |
| **Chapter index** | Hidden until focused (Tab from the top), like a skip link. Six links, the current one marked. Keyboard and screen reader friendly |
| **Deep links** | `#landscape` … `#night`. On arrival the camera cuts to the chapter instead of flying through the whole journey |

## Not built, and why

| Your idea | Status | Reason |
|---|---|---|
| **Crows react to events** | Planned | Needs the crow downloads. The event clock and the flock are the system they will use |
| **Clicking landmarks opens project information** | **Designed, waiting for you** | Which landmark stands for which chapter or project is a story decision, and the projects' facts are still mostly `[NEEDS CONFIRMATION]`. I won't invent copy. Proposal below |
| Fireflies respond to progression | Planned | The star system already flies particles from the stone; fireflies are that with new sources (the plain's flowers) |
| Wind affects vegetation | Built earlier (grass, plants); the Witness Tree is static | Tree sway needs a height-weighted vertex shader like the plants'. Cheap; not done tonight |
| Dust responds to light | Planned | For the passage, in memory |
| Hidden details at camera angles | Planned | The best candidate is the second spire, which the storyboard says is not a spire. That is a story reveal for you to approve |

## Proposal: landmarks as chapter doors

At most **three** landmarks, each tied to a real chapter, discovered rather than advertised:

| Landmark | Opens | Why it fits |
|---|---|---|
| The First Gate's arch | Selected Works | The threshold into the work |
| The Witness Tree | Journey (education, timeline) | The oldest living thing here: growth over time |
| The far mountain (The Works) | Contact | The destination |

**How it would work:** the pointer over a landmark draws a thin red leader line and a DM Mono annotation, the style your type proposal already defines. A click or Enter opens an ink plate with that chapter's verified content; the same content is always in the page's HTML for anyone who doesn't explore. Picking costs one pixel read of the G-buffer under the pointer, not a 3D ray cast.

**I need from you:** whether these three, and the content you want in each.

## Known limitations

- The flock is the only event; one event cannot show whether the pacing of several works.
- Parallax was judged only in captures and the recordings, which have no pointer movement. **It needs your hand on a mouse.**
