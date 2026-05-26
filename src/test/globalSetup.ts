import { loadEnvFile } from './loadEnvFile';

export default async function globalSetup() {
  loadEnvFile('.env.test');
  if (!process.env.DATABASE_URL) return;

  const { realignTestSerialSequences } = await import('./db-fixture');
  await realignTestSerialSequences();
}
