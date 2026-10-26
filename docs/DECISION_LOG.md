# Decision Log

## D-001 Native implementation
Use WXML/WXSS/JavaScript rather than `web-view`.

## D-002 Stable item IDs
Completion and fixed-template selection are keyed by stable item IDs.

## D-003 Local-first privacy
All user data stays in versioned WeChat Storage unless a future version explicitly adds cloud sync.

## D-004 Three salary modes
Monthly, daily/intern and hourly modes share the same rate engine.

## D-005 Schedule-aware live income
Live income follows configured work/lunch/end intervals.

## D-006 Separate timer sessions
Fish/rest sessions are separate from the salary workday clock.

## D-007 Privacy-safe sharing
Only public app copy/path is shared; no serialized user data.

## D-008 Recycle before permanent delete
Categories/items first enter a local recycle bin.

## D-009 Three-layer daily checklist
Complete library, reusable fixed template and per-date micro-adjustments stay separate.

## D-010 Migration preserves visible behavior
Old states without dailyPlan start with all current items fixed rather than an empty Today page.

## D-011 Quick timer uses target cap
A quick break stores `targetSeconds`; on return from background, completion is capped to the target rather than raw elapsed time.

## D-012 Statistics are derived, not duplicated
Weekly charts/achievements derive from sessions, checks and visit dates instead of maintaining a second analytics database.

## D-013 Stealth is presentation-only
Boss mode hides/renames sensitive UI but leaves the underlying local state untouched.

## D-014 Daily report is local Canvas
Image export uses the mini-program Canvas + album API; no external rendering server is introduced.

## D-015 Reference-inspired, not screenshot-reimplemented
The user-provided visual reference guides hierarchy, palette and illustration mood; runtime UI is re-authored as responsive native components.
