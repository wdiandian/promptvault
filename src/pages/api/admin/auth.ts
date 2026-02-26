import type { APIRoute } from 'astro';
import { generateSessionToken } from '@/middleware';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { username, password } = await request.json();

    const adminUser = import.meta.env.ADMIN_USER ?? 'admin';
    const adminPassword = import.meta.env.ADMIN_PASSWORD ?? '';

    if (!adminPassword) {
      return new Response(JSON.stringify({ error: 'Admin password not configured' }), { status: 500 });
    }

    if (username !== adminUser || password !== adminPassword) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

    const token = generateSessionToken();

    cookies.set('admin_session', token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
