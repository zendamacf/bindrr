import { redirect } from 'next/navigation';
import { routes } from '@/routes';

export default async function Home() {
  return redirect(routes.collection);
}
