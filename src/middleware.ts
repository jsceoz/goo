import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

// 不需要身份验证的路径
const publicPaths = [
  '/login',
  '/api/auth/send-code',
  '/api/auth/verify',
  '/manifest.json',
  // 图标路径
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  // 截图路径
  '/screenshots/desktop.png',
  '/screenshots/mobile.png',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 跳过静态资源文件
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/static') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/screenshots/')
  ) {
    return NextResponse.next();
  }

  // 处理 manifest.json 请求
  if (pathname === '/manifest.json') {
    return NextResponse.next({
      headers: {
        'Content-Type': 'application/manifest+json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // 允许访问公开路径
  if (publicPaths.includes(pathname)) {
    console.log(`[Middleware] Allowing public path: ${pathname}`);
    return NextResponse.next();
  }

  // 获取 token
  const token = request.cookies.get('token')?.value;

  if (!token) {
    console.log(`[Middleware] No token found, redirecting to login from: ${pathname}`);
    // 如果没有 token，重定向到登录页面
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 验证 token
    console.log(`[Middleware] Verifying token: ${token}`);
    console.log(`[Middleware] Using secret: ${JWT_SECRET}`);
    await jose.jwtVerify(token, secret);
    console.log(`[Middleware] Token verified successfully for: ${pathname}`);
    return NextResponse.next();
  } catch (error) {
    console.log(`[Middleware] Token verification failed:`, error);
    console.log(`[Middleware] Invalid token, redirecting to login from: ${pathname}`);
    // token 无效，重定向到登录页面
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - api 路由 (除了 /api/auth/*)
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico
     */
    '/((?!api/(?!auth)|_next/static|_next/image|favicon.ico).*)',
    '/manifest.json',
  ],
}; 