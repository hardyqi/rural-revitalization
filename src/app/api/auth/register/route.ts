import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/register
 * 邮箱注册 + 创建档案和账户
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "邮箱、密码和姓名不能为空" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "密码长度不能少于8位" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. 注册用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "注册失败，请稍后重试" },
        { status: 500 }
      );
    }

    // 2. 创建账户
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .insert({
        name: `${name}的账户`,
        plan: "free",
        credits_balance: 30, // 新用户赠送30积分
      })
      .select("id")
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: "创建账户失败" },
        { status: 500 }
      );
    }

    // 3. 创建用户档案
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: authData.user.id,
      account_id: account.id,
      role: "owner",
      display_name: name,
    });

    if (profileError) {
      return NextResponse.json(
        { error: "创建档案失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "注册成功",
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "注册服务异常" },
      { status: 500 }
    );
  }
}
