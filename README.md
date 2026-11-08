# IntoTheLighthouse

IntoTheLighthouse (I.T.L) is a timely human-support service within the Empatherapy ecosystem. It is designed to make reaching out during emotionally difficult moments simple, welcoming and low-friction.

## Current experience
- `index.html` — concise landing page and primary call to action.
- `support.html` — two pathways: book a session or request the practitioner's earliest available time.
- `booking.html` — honest placeholder until a real practitioner calendar is connected.
- `request.html` — short request-form interface. It is not yet connected to secure delivery or practitioner notifications; do not treat it as a live submission channel.

## Run locally
From this folder, run `py -m http.server 8000`, then open http://localhost:8000.

## Before accepting real requests
1. Connect a real scheduling provider or calendar integration and display only confirmed availability.
2. Connect the request form to a secure backend with practitioner notifications and a reliable response workflow.
3. Configure and verify practitioner contact details.
4. Add appropriate privacy, consent, data-retention and safeguarding information.
5. Add clear local crisis and emergency resources for the countries in which the service operates.

Do not present the booking calendar or request form as operational until these integrations have been tested end-to-end.
