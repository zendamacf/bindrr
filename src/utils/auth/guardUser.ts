import { SupabaseSafeSession } from '../supabase/safeSession';
import { createClient } from '../supabase/server';

export const guardUser = async () => {
  const supabase = await createClient();

  if (!process.env.SUPABASE_AUTH_JWT_SECRET) throw new Error('SUPABASE_AUTH_JWT_SECRET is not set');
  const safeSession = new SupabaseSafeSession(supabase, process.env.SUPABASE_AUTH_JWT_SECRET);

  const { data, error } = await safeSession.getUser();
  if (error || !data) return null;
  return data;
};
