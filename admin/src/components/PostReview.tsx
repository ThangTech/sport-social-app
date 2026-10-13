import { Alert, Button, Input, Modal, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { api, apiBlob } from "../lib/api";
import type { AdminRow } from "../lib/types";

type Detection = {
  label: string;
  confidence: number;
  bbox: number[];
};

type Analysis = {
  status: string;
  message: string;
  width: number;
  height: number;
  data: Detection[];
};

type ReviewMedia = {
  id: string;
  url: string;
  mediaType: number;
  logoAnalysisJson?: string;
};

type Review = {
  title: string;
  subtitle: string;
  rowVersion: string;
  media: ReviewMedia[];
};

function MediaPreview({ media }: { media: ReviewMedia }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  let analysis: Analysis | null = null;

  try {
    analysis = media.logoAnalysisJson
      ? JSON.parse(media.logoAnalysisJson)
      : null;
  } catch {
    analysis = null;
  }

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    void apiBlob(media.url)
      .then((blob) => {
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error ? reason.message : "Không tải được media.",
          );
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [media.url]);

  if (error) return <Alert type="error" title={error} />;

  return (
    <div style={{ marginTop: 16 }}>
      {url && media.mediaType === 2 && (
        <video controls src={url} style={{ width: "100%" }} />
      )}
      {url && media.mediaType === 1 && (
        <div style={{ position: "relative" }}>
          <img
            src={url}
            alt="Ảnh đính kèm bài viết"
            style={{ display: "block", width: "100%" }}
          />
          {analysis &&
            analysis.width > 0 &&
            analysis.height > 0 &&
            analysis.data.map((item, index) => (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: `${(item.bbox[0] / analysis.width) * 100}%`,
                  top: `${(item.bbox[1] / analysis.height) * 100}%`,
                  width: `${((item.bbox[2] - item.bbox[0]) / analysis.width) * 100}%`,
                  height: `${((item.bbox[3] - item.bbox[1]) / analysis.height) * 100}%`,
                  border: "2px solid #ef4444",
                  pointerEvents: "none",
                }}
              >
                <span
                  style={{ background: "#fff", color: "#111", fontSize: 12 }}
                >
                  {item.label} · {Math.round(item.confidence * 100)}%
                </span>
              </div>
            ))}
        </div>
      )}
      <Typography.Paragraph type="secondary">
        {analysis?.message || "Chưa phân tích tự động. Cần xem media thủ công."}
      </Typography.Paragraph>
    </div>
  );
}

export function PostReview({
  row,
  onClose,
  onUpdated,
}: {
  row: AdminRow;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    let active = true;
    void api<Review>(`/admin/posts/${row.id}/review`)
      .then((value) => {
        if (active) setReview(value);
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Không tải được bài viết.",
          );
      });
    return () => {
      active = false;
    };
  }, [row.id]);

  const decide = async (status: number) => {
    if (!review || saving) return;
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do duyệt hoặc từ chối bài viết.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api(`/admin/posts/${row.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, reason: reason.trim(), rowVersion: review.rowVersion }),
      });
      await onUpdated();
      onClose();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể duyệt bài.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title="Xem và duyệt bài viết"
      onCancel={onClose}
      width={760}
      styles={{ body: { maxHeight: "65vh", overflowY: "auto" } }}
      footer={
        <Space>
          <Button onClick={onClose}>Đóng</Button>
          <Button
            danger
            disabled={!review || saving}
            onClick={() => void decide(3)}
          >
            Từ chối / gỡ bài
          </Button>
          <Button
            type="primary"
            disabled={!review || saving}
            loading={saving}
            onClick={() => void decide(1)}
          >
            Duyệt đăng
          </Button>
        </Space>
      }
    >
      {error && <Alert type="error" title={error} />}
      {!review && !error && <p>Đang tải bài viết...</p>}
      {review && (
        <>
          <Typography.Paragraph type="secondary">
            {review.subtitle}
          </Typography.Paragraph>
          <Typography.Paragraph style={{ whiteSpace: "pre-wrap" }}>
            {review.title}
          </Typography.Paragraph>
          {review.media.map((media) => (
            <MediaPreview key={media.id} media={media} />
          ))}
          <label htmlFor="post-review-reason">Lý do quyết định (bắt buộc)</label>
          <Input.TextArea
            id="post-review-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={1000}
            showCount
            autoSize={{ minRows: 3, maxRows: 6 }}
            placeholder="Nêu lý do duyệt hoặc từ chối. Tác giả sẽ nhận được nội dung này."
          />
        </>
      )}
    </Modal>
  );
}
