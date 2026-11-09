# Requests and availability backend

This covers the "request the next available time" form and the practitioners' private page
(`practitioner.html`). Booking through Cal.com comes next and is not built yet.

## Where it lives
- **Supabase project:** `intothelighthouse`, ref `icjnqanwottjvxjjfwzp`, region **Ireland (eu-west-1)**.
- **Organisation:** "IntoTheLighthouse" (Free plan). It's kept apart from YOU, Wandering and CommYOUnity.
  - Upgrade this organisation to **Pro before going live**. Free projects pause after about a week without activity and have no backups.
- **Dashboard:** https://supabase.com/dashboard/project/icjnqanwottjvxjjfwzp
- **Database password:** kept by Cassidy. A copy was saved at `C:\Users\cassi\.secrets\intothelighthouse-supabase-db-password.txt`; move it into a password manager.

## How it works
1. **Sending a request.** `request.html` posts to the Edge Function `submit-request`, but only when `requestsLive` is `true` in `itl-config.js`.
2. **Checks the function makes before saving:**
   - It validates every field and requires consent.
   - It ignores bots that fill the hidden "website" field.
   - It allows at most 5 requests per hour from the same sender. Senders are recognised only by a salted hash of their IP address; the raw IP is never stored.
3. **Saving.** The request goes into `support_requests`.
4. **Notifying.** The function emails one short notice to:
   - the company inbox (`COMPANY_EMAIL`), and
   - the personal email of every practitioner switched to **Available**. If nobody is, it goes to every active practitioner.

   The person's note is **not** included in the email. Practitioners read it after signing in.
5. **The practitioner page.** Practitioners sign in with an emailed link. Sign-in is invite-only and public sign-up is off. On the page they:
   - switch **Available / Not available** with one tap (`set_my_availability()`);
   - read recent requests.
6. **Automatic deletion.** A daily job (`pg_cron`, 03:17 UTC) deletes requests older than **30 days**.
   - To change this, edit `delete_expired_requests(30)` in a new migration and update `safety.html`.

**Who can access what:**
- Visitors can't read or write any table. Every change goes through the function.
- Practitioners can read requests and their own practitioner row. The only thing they can change is their own availability.

## Adding a practitioner (admin)
1. **Invite them:** Dashboard → Authentication → Users → **Invite user** → their email.
2. **Add them to the practitioner list:** Dashboard → SQL editor, using the new user's id:
   ```sql
   insert into public.practitioners (id, display_name, personal_email, qualified_under_18)
   values ('<auth user id>', 'First name', 'their.personal@email', false);
   ```
   Set `qualified_under_18` to `true` only for practitioners who hold the legal qualifications to work with under-18s.
3. **They sign in:** at `/practitioner.html`, using the emailed link.

To pause someone, set `is_active = false`. Deleting their auth user removes their row.

## Before switching requests on (`requestsLive: true`)
- [ ] **Company inbox and sending domain chosen.** Create a Resend account, verify the domain, then:
      `supabase secrets set RESEND_API_KEY=... EMAIL_FROM="IntoTheLighthouse <requests@domain>" COMPANY_EMAIL=...`
- [ ] **Auth emails sent from that domain.** Supabase's built-in email sender is only for testing and has tight limits. Set custom SMTP under Dashboard → Authentication → Emails.
- [ ] **All three practitioners invited**, added to the list, and able to sign in and switch availability.
- [ ] **Retention period confirmed** (30 days for now), and `safety.html`'s privacy section updated with:
  - what's collected and why;
  - where it's kept (Supabase, Ireland, EU);
  - who can see it;
  - how long it's kept;
  - how to ask for deletion.
- [ ] **Organisation upgraded to Pro**, for backups and no pausing.
- [ ] **End-to-end test:** a request arrives, both emails land, the note shows on the practitioner page, and the availability switch routes correctly.
- [ ] **Request form button** changed from "Review request form status" to something like "Send my request".

## Commands
Run these from the repo root. The CLI is at `C:\Users\cassi\node_modules\.bin\supabase`.
```bash
supabase link --project-ref icjnqanwottjvxjjfwzp     # needs SUPABASE_DB_PASSWORD
supabase db push                                      # apply new migrations
supabase functions deploy submit-request --use-api
supabase config push --project-ref icjnqanwottjvxjjfwzp   # auth settings from supabase/config.toml
```
**Watch out with `supabase config push`:** it applies changes even when a "no" is piped in. Review the change summary first.

In `supabase/config.toml`, keep these two settings exactly as they are:
- `[auth] enable_signup = false`: blocks new sign-ups.
- `[auth.email] enable_signup = true`: keeps email sign-in links working. Setting it to false switches the email provider off completely.
