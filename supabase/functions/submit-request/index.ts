// IntoTheLighthouse: receive a "request the next available time" form submission.
//
// Public endpoint (verify_jwt = false). It validates the form, stores it with the service
// role, and emails a short notice to the company inbox and to the practitioners who are
// switched to "available" (or to every active practitioner if nobody is).
//
// The notice deliberately leaves out the person's note: practitioners read it after signing
// in on practitioner.html, so sensitive words are not copied into email inboxes.
//
// Secrets (supabase secrets set ...):
//   ALLOWED_ORIGINS   comma-separated site origins allowed to call this function
//   IP_HASH_SALT      long random string; IPs are stored only as salted hashes
//   RESEND_API_KEY    optional until email is set up; without it requests are stored
//   EMAIL_FROM        e.g. "IntoTheLighthouse <requests@your-domain>" (verified in Resend)
//   COMPANY_EMAIL     the company inbox that receives every notice
//   SITE_URL          public site root, used for the sign-in link in emails
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const LIMITS = { name: 120, contact: 200, message: 2000 };
const MAX_PER_HOUR = 5;

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://kashka-25.github.io,http://localhost:8000")
  .split(",").map((o) => o.trim()).filter(Boolean);

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
    "Vary": "Origin",
  };
}

function reply(origin: string | null, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(origin) });
  if (req.method !== "POST") return reply(origin, 405, { ok: false, error: "method_not_allowed" });
  if (origin && !allowedOrigins.includes(origin)) {
    return reply(origin, 403, { ok: false, error: "origin_not_allowed" });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply(origin, 400, { ok: false, error: "invalid_json" });
  }

  // Honeypot: real people never see or fill the "website" field. Pretend success, store nothing.
  if (clean(body.website)) return reply(origin, 200, { ok: true });

  const name = clean(body.name);
  const method = clean(body.method);
  const contact = clean(body.contact);
  const message = clean(body.message);
  const errors: string[] = [];
  if (!name || name.length > LIMITS.name) errors.push("name");
  if (method !== "Email" && method !== "Phone") errors.push("method");
  if (contact.length < 3 || contact.length > LIMITS.contact) errors.push("contact");
  if (method === "Email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact)) errors.push("contact");
  if (method === "Phone" && !/^[+()\d\s.-]{6,}$/.test(contact)) errors.push("contact");
  if (message.length > LIMITS.message) errors.push("message");
  if (body.consent !== true) errors.push("consent");
  if (errors.length) return reply(origin, 422, { ok: false, error: "invalid", fields: [...new Set(errors)] });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // Gentle flood protection using a salted hash of the IP (never the raw IP).
  const salt = Deno.env.get("IP_HASH_SALT");
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const ipHash = salt && ip ? await sha256(`${salt}:${ip}`) : null;
  if (ipHash) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await db.from("support_requests").select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash).gte("created_at", since);
    if ((count ?? 0) >= MAX_PER_HOUR) return reply(origin, 429, { ok: false, error: "too_many" });
  }

  // Who to tell: practitioners switched to available, otherwise every active practitioner.
  const { data: team, error: teamError } = await db.from("practitioners")
    .select("id, display_name, personal_email, is_available").eq("is_active", true);
  if (teamError) {
    console.error("practitioners lookup failed", teamError.message);
    return reply(origin, 500, { ok: false, error: "server" });
  }
  const available = (team ?? []).filter((p) => p.is_available);
  const recipients = available.length ? available : (team ?? []);

  const { data: saved, error: insertError } = await db.from("support_requests").insert({
    name,
    contact_method: method,
    contact,
    message: message || null,
    ip_hash: ipHash,
    notified_practitioner_ids: recipients.map((p) => p.id),
  }).select("id").single();
  if (insertError || !saved) {
    console.error("insert failed", insertError?.message);
    return reply(origin, 500, { ok: false, error: "server" });
  }

  const status = await notify({ name, method, contact, hasNote: Boolean(message), recipients, available: available.length > 0 });
  await db.from("support_requests").update({ notification_status: status }).eq("id", saved.id);

  return reply(origin, 200, { ok: true });
});

async function notify(r: {
  name: string;
  method: string;
  contact: string;
  hasNote: boolean;
  recipients: { personal_email: string }[];
  available: boolean;
}): Promise<"sent" | "not_configured" | "failed"> {
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM");
  const company = Deno.env.get("COMPANY_EMAIL");
  if (!key || !from || !company) return "not_configured";

  const site = (Deno.env.get("SITE_URL") ?? "https://kashka-25.github.io/IntoTheLighthouse").replace(/\/$/, "");
  const to = [...new Set([company, ...r.recipients.map((p) => p.personal_email)])];
  const lines = [
    `A new request for the next available time has arrived.`,
    ``,
    `Name: ${r.name}`,
    `Preferred contact: ${r.method}, ${r.contact}`,
    r.hasNote ? `They left a note. Sign in to read it: ${site}/practitioner.html` : `They didn't leave a note.`,
    ``,
    r.available
      ? `Sent to the company inbox and to practitioners marked available.`
      : `Nobody was marked available, so this went to every practitioner.`,
  ];

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject: "New IntoTheLighthouse support request",
        text: lines.join("\n"),
        html: `<div style="font-family:Georgia,serif;line-height:1.6">${lines.map((l) => escapeHtml(l) || "&nbsp;").join("<br>")}</div>`,
      }),
    });
    if (!res.ok) {
      console.error("email failed", res.status, await res.text());
      return "failed";
    }
    return "sent";
  } catch (e) {
    console.error("email error", e);
    return "failed";
  }
}
