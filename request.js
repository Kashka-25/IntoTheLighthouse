// Request form. While ITL_CONFIG.requestsLive is false it sends nothing and says so plainly.
// Turn it on only after storage and notification emails have been tested end to end.
(() => {
  const form = document.getElementById("request-form");
  const note = document.getElementById("form-note");
  if (!form || !note) return;
  const config = window.ITL_CONFIG || {};
  const button = form.querySelector("button[type=submit]");

  const say = (text, warning) => {
    note.textContent = text;
    note.classList.toggle("form-warning", Boolean(warning));
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!config.requestsLive) {
      say("This form is not connected to the practitioner yet, so your request has not been sent. If you need help now, please see the emergency numbers and crisis lines on our Safety page.", true);
      return;
    }

    const data = new FormData(form);
    button.disabled = true;
    say("Sending your request…");
    try {
      const response = await fetch(`${config.supabaseUrl}/functions/v1/submit-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: config.supabasePublishableKey },
        body: JSON.stringify({
          name: data.get("name"),
          method: data.get("method"),
          contact: data.get("contact"),
          message: data.get("message"),
          website: data.get("website"),
          consent: form.querySelector("#consent").checked,
        }),
      });
      if (response.ok) {
        form.reset();
        say("Thank you. Your request has been sent, and a practitioner will contact you as soon as they can. If you need help right now, please use the emergency numbers and crisis lines on our Safety page.");
        return;
      }
      if (response.status === 429) say("We've received several requests from you in the last hour. A practitioner will be in touch; please wait before sending another.", true);
      else if (response.status === 422) say("Please check your name and contact details, then try again.", true);
      else say("Something went wrong and your request was not sent. Please try again in a few minutes.", true);
    } catch {
      say("Your request couldn't be sent. Please check your connection and try again.", true);
    } finally {
      button.disabled = false;
    }
  });
})();
