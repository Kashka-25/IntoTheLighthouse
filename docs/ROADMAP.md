# IntoTheLighthouse roadmap

## Done
- [x] Static landing, support, booking-placeholder and request-form pages
- [x] Rename HOPEIUM → IntoTheLighthouse (repo, Pages URL, site text, wordmark)

## Open decisions
- [ ] Tagline: the old acronym line was removed with the rename. Cassidy (8 Nov 2026): no new tagline yet.

## Before any real booking or request (safety first)
- [ ] Safeguarding information (on `safety.html`; wording approved by Cassidy, 9 Nov 2026; under-18s only with legally qualified practitioners)
- [ ] Clear local crisis and emergency resources for each country the service operates in (drafted for UK, Ireland, US, Canada, Australia, most of Europe + findahelpline.com; Cassidy confirmed keeping all of these, 8 Nov 2026)
- [ ] Privacy, consent and data-retention information (interim notice with promises approved by Cassidy, 9 Nov 2026; full details needed before the form or booking goes live)

## Then
- [ ] Connect a real scheduling provider or calendar; display only confirmed availability (Cal.com chosen: one account per practitioner, linked to Google Calendar)
- [ ] Connect the request form to a secure backend with practitioner notifications and a reliable response workflow
  - [x] Supabase project (Ireland), locked-down tables, `submit-request` function, practitioner availability page, 30-day auto-delete (9 Nov 2026)
  - [ ] Email sending (company inbox + practitioner), custom auth SMTP, Pro plan, then switch `requestsLive` on (checklist in `docs/BACKEND.md`)
- [ ] Configure and verify practitioner contact details
- [ ] Test booking and request flows end to end before presenting them as operational

## Later
- [ ] Integrate into the Empatherapy ecosystem (via next.empatherapy) when both are ready
