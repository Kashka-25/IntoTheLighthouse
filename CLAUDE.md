# IntoTheLighthouse (I.T.L)

A small, static website for a timely human-support service: a calm place where someone
going through a difficult moment can reach out to a practitioner (Cassidy) for a focused
conversation. Plain HTML/CSS/JS, no build step, served by GitHub Pages.

- Repo: Kashka-25/IntoTheLighthouse (renamed from Kashka-25/HOPEIUM on 8 Nov 2026)
- Live: https://kashka-25.github.io/IntoTheLighthouse/ (Pages builds from `main`, root)
- Local folder: `C:\Users\cassi\Projects\IntoTheLighthouse`
- Run locally: `py -m http.server 8000`, then open http://localhost:8000

## Files
- `index.html` — landing page, practitioner profile, "what to expect" accordion
- `support.html` — two pathways: book a session, or request the earliest available time
- `booking.html` — honest placeholder until a real calendar is connected
- `request.html` / `request.js` — request form UI; NOT connected to any delivery yet
- `styles.css`, `support.css`, `script.js`, `assets/` (practitioner photos)

## Decisions (Cassidy, 8 Nov 2026)
- Renamed HOPEIUM → **IntoTheLighthouse**; short form **"I.T.L"** only where a short form is
  clearly needed. The old acronym tagline ("Helping Our People Evolve in Uneasy Moments")
  was removed; no replacement tagline has been chosen yet — don't invent one.
- The wordmark draws the "i" of "Lighthouse" as an inline SVG lighthouse (`.lighthouse-i`).
  Accessible name comes from `aria-label="IntoTheLighthouse"` on the wrapping element.
- It keeps its **own project space** (this repo), and stays ready to **integrate into the
  Empatherapy ecosystem** later ("Part of the Empatherapy ecosystem" wording stays).
- The vision is **warm, poetic, safe, simple and friendly** — NOT immersive. No 3D, no heavy
  animation, no gamified journeys. Fonts: Cormorant Garamond + DM Sans; deep green and gold palette.

## Not built yet (from README)
1. Real scheduling — a calendar/provider that shows only confirmed availability
2. Secure request backend — delivery, practitioner notifications, response workflow
3. Verified practitioner contact details
4. Privacy, consent, data-retention and safeguarding copy
5. Clear local crisis and emergency resources for each country served

**Safeguarding and crisis content must come before any real booking or request goes live.**
Never present the booking calendar or request form as operational until they are tested
end to end. Never show invented availability.

## Related
- Hub: Kashka-25/creative-universe (Creative Universe, the central hub for Cassidy's projects)
- Hub proposal: https://claude.ai/artifact/Bz16tnjtbRq71HYoFKsvVc
- Empatherapy: Kashka-25/next.empatherapy (the rebuild that leads Empatherapy) and
  Kashka-25/empatherapy (live legacy site). A `feature/hopeium-gentle-landing` branch in
  next.empatherapy and draft PR #5 in empatherapy predate the rename.
- Roadmap: `docs/ROADMAP.md`

## Working rules
- Branch + PR for every change; never push to `main` directly; never merge PRs.
- Change only what the task asks for; keep the existing design and copy otherwise.
