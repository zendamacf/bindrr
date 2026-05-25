import { getSession } from './session';
import type { AuthUser } from './types';

export const guardUser = async (): Promise<AuthUser | null> => getSession();
