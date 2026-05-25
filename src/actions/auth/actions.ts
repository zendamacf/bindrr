'use server';

import { sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { verifyPassword } from '@/utils/auth/password';
import { createSession, destroySession } from '@/utils/auth/session';

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  if (!email || !password) throw new Error('Please provide both your email & password.');

  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new Error('Invalid email or password.');
  }

  await createSession({ id: user.id, email: user.email });
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function logout() {
  await destroySession();
  redirect('/login');
}
