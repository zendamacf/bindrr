import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/Login/LoginForm';
import { PublicPage } from '@/components/Page/PublicPage';
import { routes } from '@/routes';
import { getSession } from '@/utils/auth/session';

export default async function Login() {
  const user = await getSession();
  if (user) redirect(routes.home);

  return (
    <PublicPage title={'Welcome back!'} subtitle={null}>
      <LoginForm />
    </PublicPage>
  );
}
