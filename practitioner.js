// Practitioner desk: invite-only sign-in by emailed link, one-tap availability, recent requests.
(() => {
  const config = window.ITL_CONFIG;
  const pageNote = document.getElementById("page-note");
  if (!config || !window.supabase) {
    pageNote.textContent = "The practitioner desk couldn't load. Please refresh the page or try again later.";
    return;
  }

  const db = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey);
  const $ = (id) => document.getElementById(id);
  const views = { out: $("signed-out"), none: $("not-practitioner"), in: $("signed-in") };
  const show = (name) => Object.entries(views).forEach(([key, el]) => { el.hidden = key !== name; });

  const toggle = $("availability-toggle");
  const label = $("availability-label");
  const renderAvailability = (available) => {
    toggle.setAttribute("aria-pressed", String(available));
    label.textContent = available ? "Available" : "Not available";
  };

  const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
  const renderRequests = (rows) => {
    const list = $("request-list");
    list.replaceChildren();
    $("requests-note").textContent = rows.length ? "" : "No requests in the last 30 days.";
    for (const row of rows) {
      const li = document.createElement("li");
      const meta = document.createElement("p");
      meta.className = "request-meta";
      meta.textContent = dateFormat.format(new Date(row.created_at));
      const who = document.createElement("p");
      who.className = "request-who";
      who.textContent = `${row.name}: ${row.contact_method.toLowerCase()} ${row.contact}`;
      li.append(meta, who);
      if (row.message) {
        const note = document.createElement("p");
        note.className = "request-note";
        note.textContent = row.message;
        li.append(note);
      }
      list.append(li);
    }
  };

  async function load() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return show("out");

    const { data: me, error } = await db.from("practitioners")
      .select("display_name, is_available, is_active").eq("id", session.user.id).maybeSingle();
    if (error) {
      pageNote.textContent = "Something went wrong loading your details. Please refresh the page.";
      return;
    }
    if (!me || !me.is_active) return show("none");

    $("practitioner-name").textContent = me.display_name;
    renderAvailability(me.is_available);
    show("in");

    const { data: rows, error: requestsError } = await db.from("support_requests")
      .select("created_at, name, contact_method, contact, message")
      .order("created_at", { ascending: false }).limit(100);
    if (requestsError) $("requests-note").textContent = "Requests couldn't be loaded. Please refresh the page.";
    else renderRequests(rows ?? []);
  }

  $("signin-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const note = $("signin-note");
    const email = $("signin-email").value.trim();
    note.textContent = "Sending…";
    const { error } = await db.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname },
    });
    // Same message either way, so the page never reveals who is on the practitioner list.
    note.textContent = error && error.status === 429
      ? "Too many attempts. Please wait a few minutes and try again."
      : "If that address belongs to an invited practitioner, a sign-in link is on its way. Check your inbox.";
  });

  toggle.addEventListener("click", async () => {
    const next = toggle.getAttribute("aria-pressed") !== "true";
    toggle.disabled = true;
    $("availability-note").textContent = "";
    const { data, error } = await db.rpc("set_my_availability", { available: next });
    toggle.disabled = false;
    if (error) {
      $("availability-note").textContent = "That didn't save. Please try again.";
      return;
    }
    renderAvailability(data.is_available);
    $("availability-note").textContent = data.is_available
      ? "You're available. New requests will come to you."
      : "You're not available. New requests will go to others first.";
  });

  document.querySelectorAll(".sign-out").forEach((button) => button.addEventListener("click", async () => {
    await db.auth.signOut();
    show("out");
  }));

  db.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN") load();
  });
  load();
})();
