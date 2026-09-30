import {
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Space, Typography } from "antd";
import { useState } from "react";
import { api, tokenKey } from "../lib/api";

type LoginValues = {
  email: string;
  password: string;
};

export function LoginPage({ done }: { done: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (values: LoginValues) => {
    setLoading(true);
    setError("");

    try {
      const result = await api<{
        accessToken: string;
        user: {
          roles: string[];
        };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });

      if (!result.user.roles.includes("ADMIN")) {
        throw new Error("Tài khoản không có quyền System Admin.");
      }

      localStorage.setItem(tokenKey, result.accessToken);
      done();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể đăng nhập.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#eef2f1] p-5">
      <Card className="w-full max-w-md shadow-xl">
        <Space align="start" size={14} className="mb-6">
          <div className="grid size-12 place-items-center rounded-xl bg-[#16794f] text-xl font-bold text-white">
            S
          </div>
          <div>
            <Typography.Text type="secondary">SocialSport</Typography.Text>
            <Typography.Title level={2} className="mb-0 mt-0">
              System Admin
            </Typography.Title>
          </div>
        </Space>

        <Alert
          type="info"
          showIcon
          icon={<SafetyCertificateOutlined />}
          title="Khu vực quản trị hệ thống"
          description="Chỉ tài khoản có role ADMIN được phép truy cập. Các thay đổi quan trọng đều được ghi nhật ký."
          className="mb-6"
        />

        {error ? (
          <Alert
            type="error"
            showIcon
            title={error}
            className="mb-5"
          />
        ) : null}

        <Form<LoginValues>
          layout="vertical"
          requiredMark={false}
          onFinish={(values) => void submit(values)}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Nhập email quản trị.",
              },
              {
                type: "email",
                message: "Email không hợp lệ.",
              },
            ]}
          >
            <Input
              size="large"
              prefix={<UserOutlined />}
              autoComplete="email"
              placeholder="admin@example.com"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              {
                required: true,
                message: "Nhập mật khẩu.",
              },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              autoComplete="current-password"
              placeholder="Mật khẩu"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            block
          >
            Đăng nhập an toàn
          </Button>
        </Form>
      </Card>
    </main>
  );
}
