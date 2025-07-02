import { env } from '@/env';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const db = drizzle(env.DATABASE_URL, { schema });

export default db;
