import { supabase } from '../supabase';

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile() {
  const user = await supabase.auth.getUser();
  if (!user.data?.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.data.user.id)
    .single();

  if (error) throw error;
  return data;
}
