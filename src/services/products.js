import { supabase } from '../supabase';

export async function getProductsByStore(storeUuid) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_uuid', storeUuid)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createProduct(product) {
  const { data, error } = await supabase.from('products').insert([product]).select();
  if (error) throw error;
  return data[0];
}

export async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}
