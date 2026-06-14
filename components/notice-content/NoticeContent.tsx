"use client";

import { useEffect, useState } from "react";

// Notice types for categorization
export type NoticeType = "announcement" | "update" | "reminder" | "important";

// Notice interface - defines the data structure for API/database integration
export interface Notice {
  id: string;
  title: string;
  description: string;
  notice_type: NoticeType;
  is_pinned: boolean;
  created_at: string;
}

// Props interface for the component
interface NoticeContentProps {
  maxNotices?: number; // Optional limit on number of notices to display
  showPinnedFirst?: boolean; // Whether to show pinned notices at the top
  filterType?: NoticeType | "all"; // Filter by specific notice type
}

// Helper function to get badge styles based on notice type
const getNoticeTypeStyles = (
  type: NoticeType,
): { bg: string; text: string; label: string } => {
  switch (type) {
    case "important":
      return { bg: "bg-danger", text: "text-white", label: "Important" };
    case "announcement":
      return {
        bg: "bg-custom-primary",
        text: "text-white",
        label: "Announcement",
      };
    case "update":
      return { bg: "bg-info", text: "text-white", label: "Update" };
    case "reminder":
      return { bg: "bg-warning", text: "text-dark", label: "Reminder" };
    default:
      return { bg: "bg-secondary", text: "text-white", label: "Notice" };
  }
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
};

// Individual notice card component
const NoticeCard: React.FC<{ notice: Notice }> = ({ notice }) => {
  const typeStyles = getNoticeTypeStyles(notice.notice_type);

  return (
    <div
      className={`notice-card border rounded-3 p-3 mb-3 shadow-sm ${
        notice.is_pinned ? "border-warning border-2" : "border-2"
      }`}
      style={{
        backgroundColor: "#ffffff",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {notice.is_pinned && (
        <div className="d-flex align-items-center gap-1 mb-2">
          <i className="bi bi-pin-angle-fill text-warning"></i>
          <span className="badge bg-warning text-dark">Pinned</span>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
        <h5
          className="fw-bold text-dark mb-0"
          style={{ flex: 1, minWidth: "200px" }}
        >
          {notice.title}
        </h5>
        <span
          className={`badge ${typeStyles.bg} ${typeStyles.text} flex-shrink-0`}
        >
          {typeStyles.label}
        </span>
      </div>

      <div
        className="notice-description text-secondary small mb-3"
        dangerouslySetInnerHTML={{ __html: notice.description || "" }}
      />

      <div className="d-flex align-items-center text-muted small">
        <i className="bi bi-calendar3 me-1"></i>
        <span>{formatDate(notice.created_at)}</span>
      </div>
    </div>
  );
};

// Empty state component
const EmptyState: React.FC = () => (
  <div className="text-center py-5">
    <i className="bi bi-bell-slash display-1 text-muted mb-3 d-block"></i>
    <p className="text-muted">No notices available at the moment.</p>
  </div>
);

// Loading skeleton component
const NoticeSkeleton: React.FC = () => (
  <div className="border rounded-3 p-3 mb-3 shadow-sm">
    <div className="d-flex justify-content-between align-items-center mb-3">
      <div
        className="skeleton-text bg-secondary rounded"
        style={{ width: "60%", height: "24px" }}
      ></div>
      <div
        className="skeleton-badge bg-secondary rounded px-3 py-2"
        style={{ width: "80px" }}
      ></div>
    </div>
    <div
      className="skeleton-text bg-secondary rounded mb-2"
      style={{ width: "100%", height: "16px" }}
    ></div>
    <div
      className="skeleton-text bg-secondary rounded mb-2"
      style={{ width: "90%", height: "16px" }}
    ></div>
    <div
      className="skeleton-text bg-secondary rounded"
      style={{ width: "70%", height: "16px" }}
    ></div>
  </div>
);

export default function NoticeContent({
  maxNotices = 10,
  showPinnedFirst = true,
  filterType = "all",
}: NoticeContentProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotices = async () => {
      const formData = new FormData();
      formData.append("action", "get-notices");

      try {
        const res = await fetch(process.env.NEXT_PUBLIC_PHP_API_URL!, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data?.status === 200 && Array.isArray(data.data)) {
          for (const notice of data.data) {
            if (notice.is_pinned === "1") {
              notice.is_pinned = true;
            } else {
              notice.is_pinned = false;
            }
          }
          setNotices(data.data);
        } else {
          setError(
            data?.message ||
              "Backend logic implementation in progress. Notices will be displayed here soon. Thanks for your patience.",
          );
        }
      } catch (err) {
        console.error("Error fetching notices:", err);
        setError("An error occurred while loading notices.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  // Filter and sort notices
  const processedNotices = (() => {
    let result = [...notices];

    // Filter by type if specified
    if (filterType !== "all") {
      result = result.filter((notice) => notice.notice_type === filterType);
    }

    // Sort: pinned first, then by date
    if (showPinnedFirst) {
      result.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    }

    // Limit results
    return result.slice(0, maxNotices);
  })();

  return (
    notices.length > 0 && (
      <section
        id="notices"
        className="py-5 px-3"
        style={{ backgroundColor: "#002341" }}
      >
        <div className="container">
          {/* Title Section - In the blue background */}
          <div className="text-center mb-4 position-relative">
            <h2
              className="fw-bold display-6 d-inline-block pb-3 position-relative text-white"
              style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}
            >
              Notices & Announcements
              <img
                src="/images/border_v1.png"
                alt="underline"
                width={160}
                height={8}
                className="position-absolute start-50 translate-middle-x bottom-0"
                style={{ height: "8px", width: "160px", objectFit: "cover" }}
              />
            </h2>
          </div>

          {/* White Card Container for Notice Content */}
          <div className="card border-0 rounded-4 shadow-lg overflow-hidden">
            <div className="card-body p-4 p-md-5">
              {/* Loading State */}
              {loading && (
                <div className="notices-list">
                  {[1, 2, 3].map((i) => (
                    <NoticeSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* Error State */}
              {!loading && error && (
                <div className="alert alert-danger text-center" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && processedNotices.length === 0 && (
                <EmptyState />
              )}

              {/* Notices List */}
              {!loading && !error && processedNotices.length > 0 && (
                <div className="notices-list">
                  {processedNotices.map((notice) => (
                    <NoticeCard key={notice.id} notice={notice} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CSS for hover effects */}
        <style jsx>{`
          .notice-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          }

          .notice-description :global(a) {
            color: #f2a155;
            text-decoration: underline;
          }

          .notice-description :global(a:hover) {
            color: #e58a34;
          }

          .skeleton-text,
          .skeleton-badge {
            animation: pulse 1.5s ease-in-out infinite;
          }

          @keyframes pulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </section>
    )
  );
}
