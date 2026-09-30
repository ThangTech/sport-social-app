import { ReloadOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Empty,
  Flex,
  Skeleton,
  Statistic,
  Tag,
  Typography,
} from "antd";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Flex
      justify="space-between"
      align="flex-end"
      gap={16}
      wrap="wrap"
      className="mb-6"
    >
      <div>
        <Typography.Text
          type="secondary"
          className="text-xs font-semibold uppercase tracking-wider"
        >
          {eyebrow}
        </Typography.Text>
        <Typography.Title level={2} className="mb-1 mt-1">
          {title}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className="mb-0 max-w-3xl">
          {description}
        </Typography.Paragraph>
      </div>
      {action}
    </Flex>
  );
}

export function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      title={
        title ? (
          <div className="py-1">
            <Typography.Text strong>{title}</Typography.Text>
            {subtitle ? (
              <Typography.Text type="secondary" className="mt-1 block text-xs">
                {subtitle}
              </Typography.Text>
            ) : null}
          </div>
        ) : undefined
      }
      className={className}
    >
      {children}
    </Card>
  );
}

export function MetricCard({
  label,
  value,
  helper,
  tone = "brand",
}: {
  label: string;
  value: number | string;
  helper?: string;
  tone?: "brand" | "amber" | "red" | "slate";
}) {
  const colors = {
    brand: "#16794f",
    amber: "#d97706",
    red: "#dc2626",
    slate: "#475569",
  };

  return (
    <Card>
      <Statistic
        title={label}
        value={value}
        valueStyle={{
          color: colors[tone],
          fontWeight: 700,
        }}
      />
      {helper ? (
        <Typography.Text type="secondary" className="mt-2 block text-xs">
          {helper}
        </Typography.Text>
      ) : null}
    </Card>
  );
}

export function StatusBadge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "green" | "amber" | "red" | "blue" | "slate";
}) {
  const colors = {
    green: "success",
    amber: "warning",
    red: "error",
    blue: "processing",
    slate: "default",
  } as const;

  return <Tag color={colors[tone]}>{children}</Tag>;
}

export function PageState({
  loading,
  error,
  empty,
  retry,
  children,
}: {
  loading: boolean;
  error: string;
  empty?: boolean;
  retry?: () => void;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        title="Không thể tải dữ liệu"
        description={error}
        action={
          retry ? (
            <Button icon={<ReloadOutlined />} onClick={retry}>
              Thử lại
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (empty) {
    return (
      <Card>
        <Empty description="Chưa có dữ liệu" />
      </Card>
    );
  }

  return <>{children}</>;
}
