import { logout } from '@/actions/auth/actions';

export async function GET() {
  await logout();
}
