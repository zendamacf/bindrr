import { loadEnvFile } from './loadEnvFile';

loadEnvFile('.env.test');

const { realignTestSerialSequences } = await import('./db-fixture');
await realignTestSerialSequences();
