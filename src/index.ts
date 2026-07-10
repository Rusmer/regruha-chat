import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { nanoid } from 'nanoid';
import { SignJWT, jwtVerify } from 'jose';
import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import userRoutes from './routes/users';
import { initializeDatabase } from './db/init';

interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize database on startup
app.all('*', async (c, next) => {
  const db = c.env.DB;
  try {
    await initializeDatabase(db);
  } catch (e) {
    console.error('DB init error:', e);
  }
  await next();
});

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/messages', messageRoutes);
app.route('/api/users', userRoutes);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static files
app.get('/', (c) => {
  return c.html('<h1>R-Chat API</h1><p>Regruha Chat Messenger Backend</p>');
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
