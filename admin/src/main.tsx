import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: "#16794f",
          colorInfo: "#16794f",
          colorBgLayout: "#f4f6f8",
          borderRadius: 8,
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        components: {
          Layout: {
            bodyBg: "#f4f6f8",
            headerBg: "#ffffff",
            siderBg: "#17212b",
          },
          Menu: {
            darkItemBg: "#17212b",
            darkSubMenuItemBg: "#17212b",
            darkItemSelectedBg: "#16794f",
          },
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>,
);
