import React, { useState } from "react";
import { Form, Input, message } from "antd";
import { useNavigate } from "react-router-dom";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import BackgroundLayout from "../components/BackgroundLayout";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function SignupPage(): JSX.Element {
  const { isDarkMode } = useTheme();
  const { signup, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm<SignupFormData>();
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSignup = async (values: SignupFormData) => {
    const success = await signup(values.name, values.email, values.password);

    if (success) {
      message.success("Account created successfully!");
      setSignupSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  };

  if (signupSuccess) {
    return (
      <BackgroundLayout>
        <div className="flex flex-col items-center justify-center h-full px-8">
          <GlassCard padding="lg" className="w-full max-w-md">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✓</div>
              <h2
                className={`text-2xl font-semibold mb-2 ${
                  isDarkMode ? "text-white" : "text-slate-800"
                }`}
              >
                Account Created Successfully!
              </h2>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-white/70" : "text-slate-600"
                }`}
              >
                Redirecting to login page...
              </p>
            </div>
          </GlassCard>
        </div>
      </BackgroundLayout>
    );
  }

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
              Create Account
            </h1>
            <p
              className={`text-sm ${
                isDarkMode ? "text-white/70" : "text-slate-600"
              }`}
            >
              Join Sonorus to start analyzing heart sounds
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
            onFinish={handleSignup}
          >
            <Form.Item
              name="name"
              label="Full Name"
              rules={[
                { required: true, message: "Please enter your full name" },
                {
                  min: 2,
                  message: "Name must be at least 2 characters",
                },
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-white/60" />}
                placeholder="Enter your full name"
                size="large"
                className="search-input"
                disabled={loading}
              />
            </Form.Item>

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
                {
                  min: 6,
                  message: "Password must be at least 6 characters",
                },
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

            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("The two passwords do not match"),
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-white/60" />}
                placeholder="Confirm your password"
                size="large"
                className="search-input"
                disabled={loading}
              />
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
                {loading ? "Creating account..." : "Create Account"}
              </GlassButton>
            </Form.Item>
          </Form>

          <div className="mt-6 text-center">
            <p
              className={`text-sm ${
                isDarkMode ? "text-white/60" : "text-slate-600"
              }`}
            >
              Already have an account?{" "}
              <a
                href="#/login"
                className={`text-sm font-medium hover:underline ${
                  isDarkMode ? "text-primary-400" : "text-primary-600"
                }`}
              >
                Sign in
              </a>
            </p>
          </div>
        </GlassCard>
      </div>
    </BackgroundLayout>
  );
}

export default SignupPage;
