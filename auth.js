// frontend/src/pages/Dashboard.jsx
// Main dashboard — shows combined feed from Facebook + Instagram

import React, { useState } from "react";
import { useMetaFeed } from "../hooks/useMetaFeed";
import { getLoginUrl } from "../utils/api";

// ---- Platform icons (inline SVG) ----
function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#E4405F">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/>
    </svg>
  );
}

// ---- Post Card ----
function PostCard({ post }) {
  const isVideo = ["video", "VIDEO", "REEL", "reel"].includes(post.mediaType);
  const text = post.message || post.caption || "";

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.cardHeader}>
        {post.accountImage ? (
          <img src={post.accountImage} alt="" style={styles.avatar} />
        ) : (
          <div style={styles.avatarPlaceholder}>{(post.accountName || "?")[0]}</div>
        )}
        <div style={styles.headerInfo}>
          <span style={styles.accountName}>{post.accountName}</span>
          <span style={styles.date}>
            {new Date(post.publishedAt).toLocaleDateString()} ·{" "}
            {post.platform === "facebook" ? <FacebookIcon /> : <InstagramIcon />}
          </span>
        </div>
      </div>

      {/* Text */}
      {text && <p style={styles.text}>{text.length > 280 ? text.slice(0, 280) + "…" : text}</p>}

      {/* Media */}
      {post.mediaUrl && (
        <div style={styles.mediaContainer}>
          {isVideo ? (
            <video src={post.mediaUrl} controls style={styles.media} />
          ) : (
            <img src={post.thumbnailUrl || post.mediaUrl} alt="" style={styles.media} />
          )}
        </div>
      )}

      {/* Engagement */}
      <div style={styles.engagement}>
        <span>❤️ {post.likesCount || 0}</span>
        <span>💬 {post.commentsCount || 0}</span>
        {post.sharesCount !== undefined && <span>🔁 {post.sharesCount}</span>}
        {post.permalink && (
          <a href={post.permalink} target="_blank" rel="noopener noreferrer" style={styles.link}>
            View original ↗
          </a>
        )}
      </div>
    </div>
  );
}

// ---- Main Dashboard ----
export default function Dashboard() {
  const { user, posts, loading, error, filter, setFilter, refresh } = useMetaFeed();
  const [search, setSearch] = useState("");

  // Handle OAuth redirect
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("meta_app_token", token);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

  const isLoggedIn = !!localStorage.getItem("meta_app_token");

  if (!isLoggedIn) {
    return (
      <div style={styles.loginContainer}>
        <h1>Meta Social Feed</h1>
        <p>Connect your Facebook & Instagram accounts to see all posts in one place.</p>
        <a href={getLoginUrl()} style={styles.loginBtn}>
          <FacebookIcon /> Connect with Facebook
        </a>
      </div>
    );
  }

  const displayedPosts = posts.filter(
    (p) =>
      !search ||
      (p.message || p.caption || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.accountName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Social Feed</h1>
        {user && <span style={styles.welcome}>Hi, {user.user?.name}</span>}
        <button onClick={refresh} style={styles.refreshBtn}>↻ Refresh</button>
      </header>

      {/* Filters */}
      <div style={styles.filters}>
        {["all", "facebook", "instagram"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterBtn,
              ...(filter === f ? styles.filterBtnActive : {}),
            }}
          >
            {f === "all" ? "All" : f === "facebook" ? "Facebook" : "Instagram"}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search posts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Content */}
      {error && <div style={styles.error}>Error: {error}</div>}
      {loading && <div style={styles.loading}>Loading posts…</div>}

      <div style={styles.feed}>
        {displayedPosts.map((post, i) => (
          <PostCard key={post.postId || i} post={post} />
        ))}
        {!loading && displayedPosts.length === 0 && (
          <p style={styles.empty}>No posts found. Make sure you have connected accounts with content.</p>
        )}
      </div>
    </div>
  );
}

// ---- Styles ----
const styles = {
  container: { maxWidth: 680, margin: "0 auto", padding: 20, fontFamily: "'Segoe UI', sans-serif" },
  header: { display: "flex", alignItems: "center", gap: 16, marginBottom: 20 },
  title: { fontSize: 24, margin: 0, flex: 1 },
  welcome: { fontSize: 14, color: "#666" },
  refreshBtn: { padding: "8px 16px", border: "1px solid #ddd", borderRadius: 8, background: "#fff", cursor: "pointer" },
  filters: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
  filterBtn: { padding: "8px 16px", border: "1px solid #ddd", borderRadius: 20, background: "#fff", cursor: "pointer", fontSize: 14 },
  filterBtnActive: { background: "#1877F2", color: "#fff", borderColor: "#1877F2" },
  searchInput: { flex: 1, minWidth: 200, padding: "8px 16px", border: "1px solid #ddd", borderRadius: 20, fontSize: 14, outline: "none" },
  feed: { display: "flex", flexDirection: "column", gap: 16 },
  card: { border: "1px solid #e4e4e4", borderRadius: 12, padding: 16, background: "#fff" },
  cardHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: "50%", objectFit: "cover" },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: "50%", background: "#1877F2", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 },
  headerInfo: { display: "flex", flexDirection: "column" },
  accountName: { fontWeight: 600, fontSize: 15 },
  date: { fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 4 },
  text: { fontSize: 14, lineHeight: 1.5, margin: "0 0 12px 0", color: "#333" },
  mediaContainer: { borderRadius: 8, overflow: "hidden", marginBottom: 12 },
  media: { width: "100%", display: "block", maxHeight: 500, objectFit: "cover" },
  engagement: { display: "flex", gap: 16, fontSize: 13, color: "#666", alignItems: "center" },
  link: { marginLeft: "auto", color: "#1877F2", textDecoration: "none", fontSize: 13 },
  loginContainer: { maxWidth: 400, margin: "100px auto", textAlign: "center", fontFamily: "'Segoe UI', sans-serif" },
  loginBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#1877F2", color: "#fff", textDecoration: "none", borderRadius: 8, fontSize: 16, fontWeight: 600 },
  loading: { textAlign: "center", padding: 40, color: "#888" },
  error: { padding: 12, background: "#fee", color: "#c00", borderRadius: 8, marginBottom: 16 },
  empty: { textAlign: "center", padding: 40, color: "#888" },
};
