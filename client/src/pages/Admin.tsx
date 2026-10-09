import React, { useState } from "react";
import { Card, Button, Space, Tabs, message } from "antd";
import { LogOut, Trash2 } from "lucide-react";
import { BeatPublishForm } from "../components/BeatPublishForm";
import OracleBeatsModal from "../components/OracleBeatsModal";

export default function Admin() {
  const [isLoading, setIsLoading] = useState(false);
  const [oracleModalVisible, setOracleModalVisible] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        message.success("Logged out");
        window.location.href = "/";
      }
    } catch (err) {
      message.error("Logout failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      const res = await fetch("/api/cache/clear", { method: "POST" });
      if (res.ok) {
        message.success("Cache cleared");
      }
    } catch (err) {
      message.error("Failed to clear cache");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <Card>
        <div style={{ marginBottom: "20px" }}>
          <h1>🔧 Admin Panel</h1>
          <p>Manage beats and media</p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <Space>
            <Button
              type="primary"
              size="large"
              onClick={() => setOracleModalVisible(true)}
              style={{ backgroundColor: "#722ed1" }}
            >
              🎛️ ORACLE BEATS
            </Button>
            <Button onClick={handleClearCache}>
              <Trash2 size={16} style={{ marginRight: "4px" }} /> Clear Cache
            </Button>
            <Button
              type="primary"
              danger
              loading={isLoading}
              onClick={handleLogout}
            >
              <LogOut size={16} style={{ marginRight: "4px" }} /> Logout
            </Button>
          </Space>
        </div>

        <Tabs
          items={[
            {
              key: "publish",
              label: "Publish New Beat",
              children: <BeatPublishForm />,
            },
          ]}
        />
      </Card>

      <OracleBeatsModal visible={oracleModalVisible} onClose={() => setOracleModalVisible(false)} />
    </div>
  );
}
