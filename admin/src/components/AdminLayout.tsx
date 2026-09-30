import {
  AlertOutlined,
  AuditOutlined,
  BellOutlined,
  CopyrightOutlined,
  DashboardOutlined,
  FileTextOutlined,
  KeyOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  ToolOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Dropdown,
  Grid,
  Input,
  Layout,
  Menu,
  Space,
  Typography,
} from "antd";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

const { Header, Content, Sider } = Layout;

type NavigationItem = {
  key: string;
  label: string;
  description: string;
  icon: ReactNode;
};

const navigationGroups: {
  label: string;
  items: NavigationItem[];
}[] = [
  {
    label: "Tổng quan",
    items: [
      {
        key: "/",
        label: "Dashboard",
        description: "Sức khỏe và chỉ số hệ thống",
        icon: <DashboardOutlined />,
      },
    ],
  },
  {
    label: "Cộng đồng",
    items: [
      {
        key: "/users",
        label: "Người dùng",
        description: "Tài khoản và trạng thái",
        icon: <UserOutlined />,
      },
      {
        key: "/groups",
        label: "Nhóm",
        description: "Nhóm công khai và riêng tư",
        icon: <TeamOutlined />,
      },
      {
        key: "/sports",
        label: "Thẻ thể thao",
        description: "Danh mục hiển thị trên Mobile",
        icon: <TrophyOutlined />,
      },
    ],
  },
  {
    label: "Nội dung & an toàn",
    items: [
      {
        key: "/posts",
        label: "Bài viết",
        description: "Nội dung toàn hệ thống",
        icon: <FileTextOutlined />,
      },
      {
        key: "/reports",
        label: "Báo cáo",
        description: "Xem đối tượng trước khi xử lý",
        icon: <SafetyCertificateOutlined />,
      },
      {
        key: "/copyright",
        label: "Bản quyền",
        description: "Reference và quét video",
        icon: <CopyrightOutlined />,
      },
    ],
  },
  {
    label: "Quản trị hệ thống",
    items: [
      {
        key: "/roles",
        label: "Vai trò & quyền",
        description: "System Administrator",
        icon: <KeyOutlined />,
      },
      {
        key: "/operations",
        label: "Vận hành & thay đổi",
        description: "Task và change request",
        icon: <ToolOutlined />,
      },
      {
        key: "/incidents",
        label: "Sự cố & dự phòng",
        description: "Incident và contingency",
        icon: <AlertOutlined />,
      },
      {
        key: "/audit",
        label: "Nhật ký hệ thống",
        description: "Truy vết thao tác quản trị",
        icon: <AuditOutlined />,
      },
    ],
  },
];

const allItems = navigationGroups.flatMap((group) => group.items);

const menuItems: MenuProps["items"] = navigationGroups.map((group) => ({
  type: "group",
  label: group.label,
  children: group.items.map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
  })),
}));

export function AdminLayout({ logout }: { logout: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = screens.lg === false;

  const current =
    allItems.find((item) =>
      item.key === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.key),
    ) ?? allItems[0];

  const searchItems = useMemo<MenuProps["items"]>(() => {
    const value = search.trim().toLocaleLowerCase("vi");

    if (!value) {
      return [];
    }

    return allItems
      .filter((item) =>
        `${item.label} ${item.description}`
          .toLocaleLowerCase("vi")
          .includes(value),
      )
      .map((item) => ({
        key: item.key,
        icon: item.icon,
        label: (
          <div>
            <Typography.Text strong>{item.label}</Typography.Text>
            <Typography.Text type="secondary" className="block text-xs">
              {item.description}
            </Typography.Text>
          </div>
        ),
      }));
  }, [search]);

  const profileItems: MenuProps["items"] = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
      onClick: logout,
    },
  ];

  const navigateTo: MenuProps["onClick"] = ({ key }) => {
    navigate(key);
    setSearch("");
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        breakpoint="lg"
        collapsedWidth={isMobile ? 0 : 80}
        collapsible
        collapsed={collapsed}
        trigger={null}
        onCollapse={setCollapsed}
        width={260}
        className="fixed inset-y-0 left-0 z-30 overflow-auto"
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#16794f] text-base font-bold text-white">
            S
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <Typography.Text className="block font-semibold text-white">
                SocialSport
              </Typography.Text>
              <Typography.Text className="block text-xs text-slate-400">
                System Administration
              </Typography.Text>
            </div>
          ) : null}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[current.key]}
          items={menuItems}
          onClick={navigateTo}
          className="border-0 py-3"
        />
      </Sider>

      <Layout
        className="transition-[margin] duration-200"
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : 260,
        }}
      >
        <Header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 px-5 shadow-sm">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            onClick={() => setCollapsed((value) => !value)}
          />

          <div className="hidden min-w-48 md:block">
            <Breadcrumb
              items={[
                {
                  title: "Quản trị",
                },
                {
                  title: current.label,
                },
              ]}
            />
          </div>

          <Dropdown
            menu={{
              items: searchItems,
              onClick: navigateTo,
            }}
            open={Boolean(search.trim())}
            trigger={["click"]}
          >
            <Input
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Tìm chức năng quản trị"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="ml-auto max-w-md"
            />
          </Dropdown>

          <Button
            type="text"
            icon={
              <Badge dot>
                <BellOutlined className="text-lg" />
              </Badge>
            }
            aria-label="Cảnh báo quản trị"
          />

          <Dropdown menu={{ items: profileItems }} placement="bottomRight">
            <Button type="text" className="h-auto px-2">
              <Space>
                <Avatar size="small" className="bg-[#16794f]">
                  SA
                </Avatar>
                <span className="hidden font-medium sm:inline">
                  System Admin
                </span>
              </Space>
            </Button>
          </Dropdown>
        </Header>

        <Content className="min-w-0 p-4 md:p-6 xl:p-8">
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
