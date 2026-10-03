import { supabase } from '../supabase';

export async function createSale({ storeUuid, productId, qty, paymentMethod = 'cash' }) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  const { data, error } = await supabase.rpc('create_sale', {
    p_store_uuid: storeUuid,
    p_product_id: productId,
    p_qty: qty,
    p_user_id: userId,
    p_payment_method: paymentMethod,
  });

  if (error) throw error;
  return data;
}

export async function getTransactionsByStore(storeUuid) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('store_uuid', storeUuid)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
