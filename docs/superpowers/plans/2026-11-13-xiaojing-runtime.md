# Xiaojing Loading and Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Load Xiaojing actions on demand, retain a usable image while loading, pause outside the active desktop, and replace idle RAF polling with a pausable wake-up timer.

**Architecture:** Keep Xiaojing mounted and preserve its position. Cache image preparation promises in a small asset module; the component only accepts the latest active action after decoding. DesktopOS observes its surface visibility. Xiaojing uses the existing pausable timer for waiting and owns RAF only while walking.

**Tech Stack:** Next.js 16.4.6, React 19.2, TypeScript, native Image/IntersectionObserver/requestAnimationFrame, Node test runner.

**Spec:** User-approved chat scope on 2026-11-13: implement proposal items 1, 2, 3, 4 only. Items 5 and 6 are excluded.

## Global Constraints

- Keep existing animation WebP assets, movement speed of 128 px/s, input interactions, and reduced-motion behavior.
- No idle prefetch, new runtime dependency, frame-rate cap, or performance-recording work.
- No static reduced-motion version in this change.
- Prioritize idle; prepare other actions only when requested. A failed action retains the current image.
- Preserve tab/background pausing and desktop state retention. Reuse usePausableTimeout for waiting and action delays.
- No commit, push, or deployment is authorized in this request.
- Leave the pre-existing untracked .codegraph/ directory untouched.

## Review Focus

- A slow earlier image must not replace a newer action; test controlled decode ordering.
- Image completion during pause/unmount must not update the component; test delayed completion and resume.
- Repeated requests share a pending preparation, while failed preparation can retry; unit-test both cases.
- Idle waits and offscreen pauses must leave no pet RAF; test scheduler ownership in real React.
- Slow wave decoding must not consume its action or delayed-jump lifetime; test timers after image acceptance.

---

### Task 1: On-demand action images

**Files:** Create `src/lib/pet-assets.ts`, `tests/pet-assets.test.mjs`; modify `src/components/Xiaojing.tsx`.

**Interfaces:** `createPetAssetCache(prepare: (src: string) => Promise<void>)` produces `load(src: string): Promise<void>`. `preparePetImage(src: string): Promise<void>` uses browser Image load/decode and only runs from effects. Xiaojing keeps requested and displayed action identities separately.

- [x] Test pending and successful request reuse, separate sources, and failed-request retry with controllable promises.
- [x] Run `node --experimental-strip-types --test tests/pet-assets.test.mjs`; confirm the missing module fails before implementing.
- [x] Implement the cache and browser preparation. Replace eager preload with latest-action guarded effect; switch src only after decode. Start emote/follow-up timers after acceptance; retain current image on failure.
- [x] Run the asset tests and lint; confirm they pass.

### Task 2: Visibility and event-driven wandering

**Files:** Modify `src/components/Xiaojing.tsx`, `src/components/DesktopOS.tsx`.

**Interfaces:** Preserve Xiaojing's public props. DesktopOS passes `running && surfaceVisible`. Xiaojing keeps a pausable wait task and a walking target; no walking target means no RAF.

- [x] Create an isolated browser harness in ignored `.tmp-deploy/pet-qa/` for controlled decoding, lifecycle changes, timer/RAF tracking, and actual pointer/keyboard events.
- [x] Replace busyUntil/nextWander polling with usePausableTimeout. Start RAF after a running sprite is ready; cancel on pause, interruption, drag, arrival, or unmount. Retain coordinates/target and reset frame time on resume.
- [x] Observe `.desktop-surface` with IntersectionObserver, release it on unmount, and gate only the pet's runtime.
- [x] Verify idle/no-RAF, wake/move/arrival, pause/resume, action replacement/failure, click/follow-up, drag/drop, keyboard, and unmount behavior.

### Task 3: Final verification

**Files:** Ignored QA scripts/results plus plan completion marks.

- [x] Run `npm test`, `npm run lint`, and `npm run build`.
- [x] Exercise the built app at desktop/mobile widths; verify first desktop use requests only idle until an action is actually needed, offscreen/tab/background pausing, and retained desktop windows/positions.
- [x] Review the diff, run `git diff --check`, and report the exact checks and remaining limitations without committing or deploying.
