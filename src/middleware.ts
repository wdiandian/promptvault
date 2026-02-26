import { defineMiddleware } from 'astro:middleware';

const ADMIN_EMAIL = import.meta.env.ADMIN_EMAIL ?? 'admin@promptvault.com';
const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD ?? '';

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  if (!isAdminRoute(url.pathname)) {
    return next();
  }

  if (url.pathname === '/admin/login') {
    return next();
  }

  if (url.pathname === '/api/admin/auth') {
    return next();
  }

  const session = cookies.get('admin_session')?.value;

  if (!session || session !== generateSessionToken()) {
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return redirect('/admin/login');
  }

  return next();
});

export function generateSessionToken(): string {
  const raw = `${ADMIN_EMAIL}:${ADMIN_PASSWORD}:promptvault-session`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `pv_${Math.abs(hash).toString(36)}`;
}
