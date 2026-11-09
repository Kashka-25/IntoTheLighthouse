// IntoTheLighthouse demo walkthrough. Everything here is invented and stays on this page:
// no fetch, no storage, no third-party scripts. Forms only move between steps.
(() => {
  const practitioners = [
    {
      id: "mara", name: "Mara Ellison", initials: "ME", tone: "#d9c9aa",
      focus: ["Grief and loss", "Life transitions"],
      bio: "Mara listens slowly and kindly, making room for whatever the day has brought.",
      status: "Available now", available: true,
      slots: ["Mon 10:00", "Mon 14:30", "Wed 09:00", "Thu 18:00"],
    },
    {
      id: "tomas", name: "Tomás Reyes", initials: "TR", tone: "#cfd9c4",
      focus: ["Anxiety and overwhelm", "Work stress"],
      bio: "Tomás helps people find steady ground and one manageable next step.",
      status: "Next example time: Tue 11:00", available: false,
      slots: ["Tue 11:00", "Tue 16:00", "Fri 10:30"],
    },
    {
      id: "aroha", name: "Aroha Bennett", initials: "AB", tone: "#e6d3c3",
      focus: ["Young people and families", "Big feelings"],
      bio: "Aroha holds the legal qualifications to support young people under 18, alongside adults.",
      status: "Available now", available: true,
      slots: ["Mon 16:00", "Wed 15:30", "Sat 10:00"],
    },
  ];

  const $ = (id) => document.getElementById(id);
  const steps = [...document.querySelectorAll(".demo-step")];
  let chosenPerson = null;
  let chosenSlot = null;

  function go(name) {
    steps.forEach((step) => { step.hidden = step.dataset.step !== name; });
    const current = steps.find((step) => step.dataset.step === name);
    window.scrollTo({ top: 0 });
    current.querySelector("h1")?.focus({ preventScroll: true });
  }

  function el(tag, props = {}, children = []) {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
  }

  // Step 2: example practitioners.
  for (const p of practitioners) {
    const avatar = el("span", { className: "demo-avatar", textContent: p.initials, ariaHidden: "true" });
    avatar.style.background = p.tone;
    $("demo-people").append(el("article", { className: "demo-person" }, [
      avatar,
      el("div", {}, [
        el("p", { className: "demo-fictional", textContent: "Fictional example" }),
        el("h2", { textContent: p.name }),
        el("p", { className: "demo-focus", textContent: p.focus.join(" · ") }),
        el("p", { className: "demo-bio", textContent: p.bio }),
        el("p", { className: `demo-status${p.available ? " is-available" : ""}`, textContent: `${p.status} (example)` }),
      ]),
    ]));
  }

  // Step 4a: booking with invented times.
  function renderSlots() {
    const box = $("book-slots");
    box.replaceChildren();
    chosenSlot = null;
    if (!chosenPerson) {
      box.append(el("p", { className: "demo-hint", textContent: "Choose a practitioner to see example times." }));
      return;
    }
    for (const slot of chosenPerson.slots) {
      const button = el("button", { type: "button", className: "demo-slot", textContent: slot });
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        chosenSlot = slot;
        box.querySelectorAll(".demo-slot").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      });
      box.append(button);
    }
  }
  for (const p of practitioners) {
    const input = el("input", { type: "radio", name: "book-person", value: p.id, id: `book-${p.id}` });
    input.addEventListener("change", () => { chosenPerson = p; renderSlots(); });
    $("book-people").append(el("label", { className: "demo-option", htmlFor: `book-${p.id}` }, [input, ` ${p.name}`]));
  }
  renderSlots();

  function finish(summary, next) {
    $("demo-summary").textContent = summary;
    $("demo-next").replaceChildren(...next.map((t) => el("li", { textContent: t })));
    document.querySelectorAll(".demo-form").forEach((f) => f.reset());
    chosenPerson = null;
    renderSlots();
    go("done");
  }

  $("demo-book").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("book-name").value.trim();
    const error = !chosenPerson ? "Please choose a practitioner." : !chosenSlot ? "Please choose an example time." : !name ? "Please add a first name (any name is fine)." : "";
    $("book-error").textContent = error;
    if (error) return;
    finish(`Example booking: ${name} with ${chosenPerson.name}, ${chosenSlot}.`, [
      "You'd get a confirmation email with the time and how you'll meet.",
      `${chosenPerson.name.split(" ")[0]} would get it too, in their own calendar and email.`,
      "The company inbox would get a copy, so nothing falls through the cracks.",
      "Session length, any contribution and how to reschedule would be clear before you confirm.",
    ]);
  });

  $("demo-request").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("req-name").value.trim();
    const contact = $("req-contact").value.trim();
    const error = !name ? "Please add a name (any name is fine)." : !contact ? "Please add an example contact detail." : !$("req-consent").checked ? "Please tick the consent box to continue." : "";
    $("req-error").textContent = error;
    if (error) return;
    const available = practitioners.filter((p) => p.available).map((p) => p.name.split(" ")[0]);
    finish(`Example request from ${name}, by ${$("req-method").value.toLowerCase()}.`, [
      "Your request would be stored securely in the EU, and deleted automatically after 30 days.",
      `The practitioners marked available right now (${available.join(" and ")}, in this example) and the company inbox would get a short notice. Your note stays out of email.`,
      "A practitioner would contact you as soon as they can, using the details you chose.",
      "If you needed help sooner, the emergency numbers and crisis lines are always one tap away.",
    ]);
  });

  document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));
  document.querySelectorAll("[data-restart]").forEach((b) => b.addEventListener("click", () => go("welcome")));
  steps.forEach((s) => s.querySelector("h1")?.setAttribute("tabindex", "-1"));
})();
