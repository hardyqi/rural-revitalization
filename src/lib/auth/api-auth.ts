import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jwtVerify } from "jose";

// ============================================================
// 认证中间件 — 乡村振兴平台
// 复用 gongmei-digital 的认证鉴权模式，适配新业务实体
// ============================================================

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: "user" | "admin" | "super_admin";
  accountId: string;
};

export type AuthError = {
  status: 401 | 403 | 500;
  code: string;
  message: string;
};

// ============================================================
// 基础认证：从 JWT 解析用户身份
// ============================================================

export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: AuthenticatedUser | null; error: AuthError | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        user: null,
        error: {
          status: 401,
          code: "UNAUTHORIZED",
          message: "未登录或登录已过期",
        },
      };
    }

    if (!user.email) {
      return {
        user: null,
        error: {
          status: 401,
          code: "INVALID_USER",
          message: "账号信息不完整",
        },
      };
    }

    // 查询用户在 profiles 表中的角色和账户信息
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, account_id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return {
        user: null,
        error: {
          status: 403,
          code: "NO_PROFILE",
          message: "用户档案不存在",
        },
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: profile.role as AuthenticatedUser["role"],
        accountId: profile.account_id,
      },
      error: null,
    };
  } catch {
    return {
      user: null,
      error: {
        status: 500,
        code: "AUTH_ERROR",
        message: "认证服务异常",
      },
    };
  }
}

// ============================================================
// 高阶函数：带认证和积分校验的 API Handler
// 复用 gongmei-digital 的 withAuthAndCredits 模式
// ============================================================

type ApiHandler = (
  request: NextRequest,
  user: AuthenticatedUser
) => Promise<NextResponse>;

type CreditsConfig = {
  /** 本次操作消耗积分 */
  cost: number;
  /** 积分不足时的提示 */
  description: string;
};

export function withAuthAndCredits(
  handler: ApiHandler,
  credits?: CreditsConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // 1. 认证
    const { user, error } = await authenticateRequest(request);
    if (error || !user) {
      return NextResponse.json(
        { error: error?.message || "认证失败" },
        { status: error?.status || 401 }
      );
    }

    // 2. 积分校验
    if (credits) {
      const supabase = await createClient();

      const { data: account } = await supabase
        .from("accounts")
        .select("credits_balance")
        .eq("id", user.accountId)
        .single();

      if (!account || account.credits_balance < credits.cost) {
        return NextResponse.json(
          {
            error: `积分不足，${credits.description}需要 ${credits.cost} 积分，当前余额 ${account?.credits_balance ?? 0}`,
            code: "INSUFFICIENT_CREDITS",
            required: credits.cost,
            balance: account?.credits_balance ?? 0,
          },
          { status: 402 }
        );
      }
    }

    // 3. 执行处理器
    try {
      return await handler(request, user);
    } catch (e) {
      console.error("[API Error]", e);
      return NextResponse.json(
        { error: "服务器内部错误" },
        { status: 500 }
      );
    }
  };
}

// ============================================================
// 资源所有权校验：防止 IDOR
// 复用 gongmei-digital 的 verifyCustomerOwnership 模式
// ============================================================

export async function verifyProductOwnership(
  productId: string,
  accountId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("account_id", accountId)
    .single();
  return !!data;
}

export async function verifyAreaOwnership(
  areaId: string,
  accountId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("areas")
    .select("id")
    .eq("id", areaId)
    .eq("account_id", accountId)
    .single();
  return !!data;
}
