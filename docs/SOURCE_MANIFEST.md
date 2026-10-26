# Public source manifest

## Source data retained
- `source/default_categories.snapshot.json`: anonymous generic 6-category / 90-item default checklist used by `tests/source_alignment.test.js`.

## Runtime assets retained
- `miniprogram/assets/app-icon-144.png`
- `miniprogram/assets/tab/*.png`
- `miniprogram/assets/illustrations/*.png` (cartoon app illustrations)
- `reference-hero-strip.png` was recreated for the public release using the local `cat-lounge.png` illustration, **not extracted from a private screenshot**.

## Deliberately excluded (do not re-add)
- User-uploaded original HTML and notes
- Visual issue screenshots, UI references, and image-generation study files
- User-provided social-media short links and any private account/export data

Only anonymous generic preset text is in `defaults.js` and the matching snapshot. The app stores real salary and checklist data only in each user's local WeChat storage.
