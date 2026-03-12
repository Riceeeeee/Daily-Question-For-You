const SUPABASE_URL = "https://aatkndfnrbuglnubuspw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0m4EuLUDVottY4flU40OsQ_ZgHSfB2E";

const { createClient } = window.supabase || {};

let supabaseClient = null;

if (typeof createClient === "function" && SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

window.supabase = supabaseClient;

