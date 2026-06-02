"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * 登录页 — 乡村振兴创新服务平台
 */
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { email, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "操作失败");
        setLoading(false);
        return;
      }

      // 登录/注册成功后跳转
      if (mode === "register") {
        // 注册后切换到登录
        setMode("login");
        setError("注册成功，请登录");
        setPassword("");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("网络错误，请稍后重试");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* 左侧品牌区 */}
      <div className="hidden w-1/2 bg-gradient-to-br from-green-700 to-green-900 lg:flex lg:flex-col lg:justify-center lg:px-20">
        <div className="space-y-6 text-white">
          <h1 className="text-4xl font-bold tracking-tight">
            乡村振兴创新服务平台
          </h1>
          <p className="text-lg text-green-100">
            从"种什么"到"怎么卖"，AI 赋能农产品全链路决策
          </p>
          <div className="space-y-3 pt-8">
            {[
              "市场分析 · 数据驱动选品决策",
              "电商主图 · AI 生成专业营销素材",
              "合规检查 · GB 7718 标签自动诊断",
              "种植决策 · 品类推荐与投入产出测算",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-300" />
                <span className="text-green-50">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="flex w-full items-center justify-center bg-white px-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === "login" ? "登录" : "注册"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {mode === "login"
                ? "欢迎回来，请登录你的账户"
                : "创建账户，获取30积分免费额度"}
            </p>
          </div>

          {error && (
            <div
              className={`rounded-lg p-3 text-sm ${
                error.includes("成功")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  姓名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="你的姓名"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="至少 8 位字符"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-700 px-4 py-3 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
            >
              {loading
                ? "处理中..."
                : mode === "login"
                  ? "登录"
                  : "注册并获取 30 积分"}
            </button>
          </form>

          <div className="text-center text-sm text-gray-600">
            {mode === "login" ? (
              <>
                还没有账户？{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  className="font-medium text-green-700 hover:text-green-800"
                >
                  立即注册
                </button>
              </>
            ) : (
              <>
                已有账户？{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className="font-medium text-green-700 hover:text-green-800"
                >
                  去登录
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
