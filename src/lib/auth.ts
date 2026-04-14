import { SUPABASE_ENV_ERROR, supabase } from "@/lib/supabase";

function getClient() {
  if (!supabase) {
    throw new Error(SUPABASE_ENV_ERROR);
  }

  return supabase;
}

export function getCurrentSession() {
  return getClient().auth.getSession();
}

export function signInAsGuest() {
  return getClient().auth.signInAnonymously();
}
