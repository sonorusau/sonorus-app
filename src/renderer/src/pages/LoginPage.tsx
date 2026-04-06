import React, { useState } from "react";
import { Form, Input, Checkbox, message } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import BackgroundLayout from "../components/BackgroundLayout";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

function LoginPage(): JSX.Element {
  const { isDarkMode } = useTheme();
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm<LoginFormData>();

  const handleLogin = async (values: LoginFormData) => {
    const success = await login(values.email, values.password);

    if (success) {
      message.success("Welcome back!");
      // Redirect to the intended destination or home
      const from = (location.state as { from?: string })?.from || "/";
      navigate(from);
    }
  };

  return (
    <BackgroundLayout>
      <div className="flex flex-col items-center justify-center h-full px-8">
        <GlassCard padding="lg" className="w-full max-w-md">
          <div className="mb-6">
            <h1
              className={`text-2xl font-semibold mb-2 ${
                isDarkMode ? "text-white" : "text-slate-800"
              }`}
            >
              Sign In
            </h1>
            <p
              className={`text-sm ${
                isDarkMode ? "text-white/70" : "text-slate-600"
              }`}
            >
              Welcome back to Sonorus. Please enter your credentials.
            </p>
          </div>

          {error && (
            <div
              className="mb-4 p-3 rounded-lg border-l-4"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderColor: "#ef4444",
              }}
            >
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={handleLogin}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-white/60" />}
                placeholder="Enter your email"
                size="large"
                className="search-input"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please enter your password" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-white/60" />}
                placeholder="Enter your password"
                size="large"
                className="search-input"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item name="rememberMe" valuePropName="checked">
              <Checkbox disabled={loading}>Remember me</Checkbox>
            </Form.Item>

            <Form.Item className="mb-0">
              <GlassButton
                variant="primary"
                size="lg"
                onClick={() => form.submit()}
                disabled={loading}
                loading={loading}
                className="w-full"
              >
                {loading ? "Signing in..." : "Sign In"}
              </GlassButton>
            </Form.Item>
          </Form>

          <div className="mt-6 text-center">
            <p
              className={`text-sm ${
                isDarkMode ? "text-white/60" : "text-slate-600"
              }`}
            >
              Don't have an account?{" "}
              <a
                href="#/signup"
                className={`text-sm font-medium hover:underline ${
                  isDarkMode ? "text-primary-400" : "text-primary-600"
                }`}
              >
                Sign up
              </a>
            </p>
          </div>
        </GlassCard>
      </div>
    </BackgroundLayout>
  );
}

export default LoginPage;
