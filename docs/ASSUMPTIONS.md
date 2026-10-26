# Assumptions — V1.1.4

- New fish-time functions should remain local-only and require no backend.
- “下班倒计时” means countdown to the configured workday `endTime`, not background push notification.
- 3/5/10/15 minute quick timers auto-save at the selected target duration when the app returns after the target.
- Daily fish allowance is guidance, not a hard lock; users can continue timing after the limit and see an over-limit state.
- Streak means consecutive local foreground-use days.
- Daily report is for personal use and can be saved locally; it is not uploaded automatically.
- Stealth/boss mode hides sensitive wording and optionally amounts but does not alter stored data.
