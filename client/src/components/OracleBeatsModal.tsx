import React, { useState, useEffect } from "react";
import { Modal, Input, Table, Tag, Button, Space, Tooltip, Spin, message } from "antd";
import { CheckCircleOutlined, SearchOutlined } from "@ant-design/icons";

interface OracleBeat {
  filename: string;
  url: string;
  beatCode: string;
  size: number;
  modified: string;
  isPublished: boolean;
  publishedBeatId: number | null;
}

interface OracleBeatsResponse {
  total: number;
  published: number;
  unpublished: number;
  beats: OracleBeat[];
}

interface OracleBeatsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function OracleBeatsModal({ visible, onClose }: OracleBeatsModalProps) {
  const [data, setData] = useState<OracleBeatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadOracleBeats();
    }
  }, [visible]);

  const loadOracleBeats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/beat-files/oracle/all");
      const json = await res.json();
      setData(json);
    } catch (err) {
      message.error("Nepodařilo se načíst Oracle beats");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vyberte alespoň jeden beat");
      return;
    }

    setPublishing(true);
    try {
      const beatToPublish = data!.beats.find(b => b.filename === selectedRowKeys[0]);
      if (!beatToPublish || beatToPublish.isPublished) {
        message.warning("Beat je již publikován nebo nebyl vybrán");
        return;
      }

      const res = await fetch("/api/beats/publish-from-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: beatToPublish.beatCode,
          previewUrl: beatToPublish.url,
          bpm: null,
          key: null,
          artworkUrl: null,
          fileUrl: null,
          tags: [],
        }),
      });

      if (!res.ok) throw new Error("Chyba při publikování");
      const published = await res.json();

      message.success(`Beat "${beatToPublish.beatCode}" publikován!`);
      setSelectedRowKeys([]);
      await loadOracleBeats();
    } catch (err) {
      message.error("Nepodařilo se publikovat beat");
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  const filteredBeats = data?.beats.filter(b =>
    b.beatCode.toLowerCase().includes(search.toLowerCase()) ||
    b.filename.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const columns = [
    {
      title: "Beat Code",
      dataIndex: "beatCode",
      key: "beatCode",
      width: 150,
      render: (code: string, record: OracleBeat) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {record.isPublished && (
            <Tooltip title="Publikováno live">
              <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "16px" }} />
            </Tooltip>
          )}
          <span>{code}</span>
        </div>
      ),
    },
    {
      title: "Filename",
      dataIndex: "filename",
      key: "filename",
      width: 300,
      ellipsis: true,
      render: (filename: string) => <span style={{ fontSize: "12px" }}>{filename}</span>,
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_: any, record: OracleBeat) => (
        record.isPublished ? (
          <Tag color="green">Live</Tag>
        ) : (
          <Tag color="default">Unpublished</Tag>
        )
      ),
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 100,
      render: (size: number) => {
        const mb = (size / 1024 / 1024).toFixed(2);
        return `${mb} MB`;
      },
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🎛️ ORACLE BEATS</span>
          {data && (
            <div style={{ fontSize: "12px", color: "#666" }}>
              ({data.published}/{data.total} live)
            </div>
          )}
        </div>
      }
      open={visible}
      onCancel={onClose}
      width="90%"
      style={{ maxWidth: "1200px" }}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="publish"
          type="primary"
          loading={publishing}
          disabled={selectedRowKeys.length === 0 || data?.beats.find(b => b.filename === selectedRowKeys[0])?.isPublished}
          onClick={handlePublish}
        >
          Publish Selected to Live
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        {data && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Stats */}
            <div style={{ display: "flex", gap: "20px", padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#666" }}>Total Beats</div>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>{data.total}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#52c41a" }}>Published (Live)</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#52c41a" }}>{data.published}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#faad14" }}>Unpublished</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#faad14" }}>{data.unpublished}</div>
              </div>
            </div>

            {/* Search */}
            <Input
              placeholder="Search by beat code or filename..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="large"
            />

            {/* Table */}
            <Table
              dataSource={filteredBeats.map(b => ({ ...b, key: b.filename }))}
              columns={columns}
              pagination={{ pageSize: 20 }}
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => {
                  setSelectedRowKeys(keys.length === 0 ? [] : [keys[keys.length - 1] as string]);
                },
                type: "radio",
              }}
              size="small"
              scroll={{ x: "100%" }}
            />
          </div>
        )}
      </Spin>
    </Modal>
  );
}
