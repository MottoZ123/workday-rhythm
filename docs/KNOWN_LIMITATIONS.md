# Known Limitations

- Only one reusable daily fixed template is provided; weekday-specific templates are not yet implemented.
- Daily micro-adjustments are retained within the local history cleanup window.
- No account/cloud sync, backend, analytics SDK or ad SDK.
- No background notification service. Off-work countdown updates while the mini program is open/foregrounded.
- Daily report image save depends on WeChat Canvas and photo-album permission on the actual device.
- Achievement streak is based on local foreground-open dates; reinstalling/clearing Storage resets it.
- Automated checks do not substitute for WeChat Developer Tools compile/render or real-device testing.
- `touristappid` must be replaced for real-device preview, upload and production release.
