import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
}

/**
 * 从请求中验证认证信息并获取用户ID
 * @param request 请求对象
 * @returns 认证结果，包含成功状态和用户ID（如果成功）
 */
export async function verifyAuth(request: Request): Promise<AuthResult> {
  try {
    // 从请求头中获取 cookie
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return { success: false, error: '未找到认证令牌' };
    }

    // 从 cookie 中提取 token
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return { success: false, error: '未找到认证令牌' };
    }

    // 验证 token
    const { payload } = await jose.jwtVerify(token, secret);
    
    if (!payload.userId) {
      return { success: false, error: '无效的用户信息' };
    }

    return {
      success: true,
      userId: payload.userId as string
    };
  } catch (error) {
    console.error('认证验证失败:', error);
    return {
      success: false,
      error: '认证验证失败'
    };
  }
}

/**
 * 生成 JWT token
 * @param userId 用户ID
 * @param phone 用户手机号
 * @returns JWT token
 */
export async function generateToken(userId: string, phone: string): Promise<string> {
  return await new jose.SignJWT({ userId, phone })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

/**
 * 从 token 中解码用户信息（不验证签名）
 * @param token JWT token
 * @returns 解码后的用户信息
 */
export function decodeToken(token: string) {
  try {
    const decoded = jose.decodeJwt(token);
    return {
      userId: decoded.userId as string,
      phone: decoded.phone as string
    };
  } catch (error) {
    console.error('Token 解码失败:', error);
    return null;
  }
} 