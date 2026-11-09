// IntoTheLighthouse site settings shared by the request form and the practitioner page.
// The publishable key is meant to be public: database access is limited by row-level security.
window.ITL_CONFIG = {
  supabaseUrl: "https://icjnqanwottjvxjjfwzp.supabase.co",
  supabasePublishableKey: "sb_publishable_1Sn0t94k2SkXiUX6sZaobg_4txJwEQV",
  // Keep false until the request flow (storage + emails) has been tested end to end.
  // While false, the form explains it isn't connected and sends nothing.
  requestsLive: false,
};
