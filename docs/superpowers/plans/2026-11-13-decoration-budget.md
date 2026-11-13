# Decoration and Compositing Budget Implementation Plan

> **For agentic workers:** Use the already-loaded executing-plans and test-driven-development guidance. Implement in this checkout without another approval, commit, push, or deployment.

**Goal:** Bound decorative work and composition hints while preserving the portfolio's existing visual states, interactions, and server/client boundaries.

**Architecture:** Reuse DesktopOS's existing surface visibility observer to gate decoration and Clock activity. Keep counts at 46 desktop stars / 16 mobile stars / 6 click stars, with mobile twinkling only. Pulse temporary scroll composition hints with a small cancellable helper; pet and drag hints follow actual motion state. Rewrite folder photos with fixed layout dimensions and transform-only interpolation.

**Spec:** User approved the five-part decoration-budget proposal in chat on 2026-11-13.

## Constraints

- Preserve the already-completed, uncommitted Xiaojing loading/runtime changes and unrelated .codegraph/ directory.
- Keep content, palette, type, geometry endpoints, S-curve flight, keyboard access, mobile document flow, and server-rendered Works.
- Desktop navbar may retain its blur; desktop menubar and mobile navbar have none.
- Remove interpolation of shadows; preserve their end states. Change moving filters only if recorded painting evidence justifies it.
- No runtime dependencies, default FPS cap, commit, push, or deployment.

## Tasks

- [x] Record baseline tracing, computed geometry, and desktop/mobile screenshots in ignored `.tmp-deploy/decoration-qa/`.
- [x] Write browser regressions for counts, click eviction, pauses, temporary hints, filters, transform-only photo animation, and keyboard/mobile behavior; reproduce failures before edits.
- [x] Implement desktop decoration counts, bounded click stars, shared visibility gating, offscreen cleanup, and blur budget.
- [x] Add a tested cancellable 180ms motion-hint controller; use it for AboutFlight and ExitSection. Enable pet hints only during walking/dragging; retain existing conditional drag hints; remove screenshot's permanent hint.
- [x] Rewrite photo closed/open transforms at desktop and mobile sizes; remove shadow interpolation and broad `transition: all`.
- [x] Repeat equivalent tracing and compare geometry/end-state screenshots. Inspect suspect drop-shadow painting before deciding whether to change it.
- [x] Run unit tests, lint, type/build checks, focused browser and existing interaction regressions; review diff and leave changes uncommitted.
