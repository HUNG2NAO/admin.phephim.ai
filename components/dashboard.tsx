"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clapperboard, LayoutGrid, Search, RefreshCw, ShieldCheck,
  Pencil, EyeOff, Eye, X, Save, UploadCloud, Link2,
  ExternalLink, Film, Clock3, SlidersHorizontal, AlertTriangle, ImageIcon,
  ChevronLeft, ChevronRight, CircleCheck, Menu, LogOut, User,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import type { Movie } from "@/lib/movies";

type MoviePage = {
  items: Movie[]; total: number; page: number; pageSize: number;
  totals: { total: number; visible: number; hidden: number; draft: number };
};

type Filter = "all" | "visible" | "hidden" | "draft";
const filterLabels: Record<Filter, string> = { all: "Tất cả phim", visible: "Đang hiển thị", hidden: "Đã ẩn", draft: "Bản nháp" };
const emptyPage: MoviePage = { items: [], total: 0, page: 1, pageSize: 24, totals: { total: 0, visible: 0, hidden: 0, draft: 0 } };

const SIDEBAR_KEY = "phephim-sidebar-collapsed";
const MOBILE_BREAKPOINT = 850;

function Poster({ movie }: { movie: Movie }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [movie.poster]);
  return (
    <div className="poster-frame">
      {movie.poster && !failed ? <img src={movie.poster} alt={`Bìa ${movie.title}`} loading="lazy" onError={() => setFailed(true)} /> : <div className="no-poster"><Clapperboard size={29} /><span>NO POSTER</span></div>}
    </div>
  );
}

export function Dashboard() {
  const [data, setData] = useState<MoviePage>(emptyPage);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<Movie | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const latestRequest = useRef(0);
  const sidebarRef = useRef<HTMLDivElement>(null);

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      window.location.href = "/login";
    });
  }

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored !== null) {
      setSidebarCollapsed(stored === "true");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const handleResize = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileDrawerOpen, mounted]);

  useEffect(() => { const timer = setTimeout(() => { setSearch(query); setPage(1); }, 300); return () => clearTimeout(timer); }, [query]);

  const load = useCallback(async () => {
    const id = ++latestRequest.current;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ q: search, status: filter, page: String(page), pageSize: "24" });
      const res = await fetch(`/api/movies?${params}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error === "NOT_CONFIGURED" ? "Chưa cấu hình quản trị viên trong Vercel." : body.error || "Không tải được danh sách phim");
      if (latestRequest.current === id) setData(body as MoviePage);
    } catch (e) {
      if (latestRequest.current === id) setError(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      if (latestRequest.current === id) setLoading(false);
    }
  }, [search, filter, page]);

  useEffect(() => { void load(); }, [load]);

  function chooseFilter(value: Filter) {
    setFilter(value);
    setPage(1);
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      setMobileDrawerOpen(false);
    }
  }

  async function saveMovie(movie: Movie, payload: Record<string, unknown>) {
    const response = await fetch(`/api/movies/${encodeURIComponent(movie.slug)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, expectedVersion: movie.version }),
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 409) throw new Error("Phim đã được thay đổi ở phiên khác. Hãy tải lại rồi chỉnh sửa.");
      throw new Error(result.error || "Không thể lưu thay đổi");
    }
    setSelected(null);
    setNotice("Đã lưu thay đổi. Website sẽ hiển thị sau khi lớp metadata được tích hợp.");
    await load();
  }

  const cards = [
    { label: "Tổng số phim", value: data.totals.total, icon: Film },
    { label: "Đang hiển thị", value: data.totals.visible, icon: Eye },
    { label: "Đã ẩn", value: data.totals.hidden, icon: EyeOff },
    { label: "Bản nháp", value: data.totals.draft, icon: Clock3 },
  ];

  const isDesktop = mounted && window.innerWidth >= MOBILE_BREAKPOINT;

  return (
    <div className="app-shell">
      {mobileDrawerOpen && (
        <button
          className="mobile-scrim"
          onClick={() => setMobileDrawerOpen(false)}
          aria-label="Đóng menu"
          aria-hidden={!mobileDrawerOpen}
        />
      )}
      <aside
        ref={sidebarRef}
        className={`sidebar ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${mobileDrawerOpen ? "sidebar-open" : ""}`}
        aria-label="Menu điều hướng"
      >
        <div className="brand">
          <div className="brand-mark">P</div>
          {!sidebarCollapsed && (
            <div className="brand-copy">
              <strong>PHE PHIM AI</strong>
              <span>CONTROL ROOM</span>
            </div>
          )}
        </div>
        {!sidebarCollapsed && (
          <div className="sidebar-group-label">QUẢN TRỊ NỘI DUNG</div>
        )}
        <nav className="nav-list" aria-label="Chức năng quản trị">
          <button
            className={`nav-link ${filter === "all" ? "active" : ""}`}
            onClick={() => chooseFilter("all")}
            aria-current={filter === "all" ? "page" : undefined}
            title={sidebarCollapsed ? "Tổng quan phim" : ""}
          >
            <LayoutGrid size={18} aria-hidden="true" />
            {!sidebarCollapsed && <>Tổng quan phim <span className="nav-count">{data.totals.total}</span></>}
          </button>
          <button
            className={`nav-link ${filter === "visible" ? "active" : ""}`}
            onClick={() => chooseFilter("visible")}
            aria-current={filter === "visible" ? "page" : undefined}
            title={sidebarCollapsed ? "Phim hiển thị" : ""}
          >
            <Eye size={18} aria-hidden="true" />
            {!sidebarCollapsed && "Phim hiển thị"}
          </button>
          <button
            className={`nav-link ${filter === "draft" ? "active" : ""}`}
            onClick={() => chooseFilter("draft")}
            aria-current={filter === "draft" ? "page" : undefined}
            title={sidebarCollapsed ? "Bản nháp" : ""}
          >
            <Clock3 size={18} aria-hidden="true" />
            {!sidebarCollapsed && "Bản nháp"}
          </button>
          <button
            className={`nav-link ${filter === "hidden" ? "active" : ""}`}
            onClick={() => chooseFilter("hidden")}
            aria-current={filter === "hidden" ? "page" : undefined}
            title={sidebarCollapsed ? "Phim đã ẩn" : ""}
          >
            <EyeOff size={18} aria-hidden="true" />
            {!sidebarCollapsed && "Phim đã ẩn"}
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button
            className="collapse-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            aria-expanded={!sidebarCollapsed}
            title={sidebarCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
          {!sidebarCollapsed && (
            <>
              <div className="secure-note"><ShieldCheck size={16} /><span>Dữ liệu quản lý riêng · Không xóa media</span></div>
              <a href="https://www.phephim.ai" target="_blank" rel="noreferrer" className="website-link">Mở PHEPHIM.AI <ExternalLink size={14}/></a>
            </>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            aria-label={mobileDrawerOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileDrawerOpen}
            aria-controls="sidebar"
          >
            {mobileDrawerOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="breadcrumb">Workspace <span>/</span> PHE PHIM AI <span>/</span> <b>Kho phim</b></div>
          <div className="top-right">
            <span className="environment-dot"/>
            <span className="environment-text">ADMIN PANEL</span>
            <div className="user-menu">
              <span>admin</span>
              <button onClick={handleLogout} className="logout-btn" title="Đăng xuất"><LogOut size={18}/></button>
            </div>
          </div>
        </header>
        <div className="content-container">
          <div className="heading"><div><span className="eyebrow">CONTENT MANAGEMENT</span><h1>Quản lý kho phim</h1><p>Chỉnh sửa tên phim, ảnh bìa và khả năng hiển thị trên PHEPHIM.AI.</p></div><button className="secondary-button refresh-btn" onClick={() => void load()} disabled={loading}><RefreshCw size={16} className={loading ? "spin" : ""}/> Đồng bộ dữ liệu</button></div>
          <section className="stats-grid" aria-label="Thống kê phim">{cards.map(({ label, value, icon: Icon }) => <div className="stat-card" key={label}><div className="stat-label">{label}<Icon size={18}/></div><div className="stat-number">{value.toLocaleString("vi-VN")}</div><div className="stat-caption">Dữ liệu từ thư viện phim</div></div>)}</section>
          <section className="movie-section"><div className="section-top"><div><div className="section-title"><Clapperboard size={21}/><h2>Thư viện phim</h2></div><p>Tìm kiếm và quản lý từng tựa phim</p></div><div className="section-count">{data.total} phim</div></div>
            <div className="toolbar"><div className="search-control"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên phim, BVID, slug..." aria-label="Tìm phim"/></div><div className="filter-control"><SlidersHorizontal size={17}/><select value={filter} onChange={(e) => chooseFilter(e.target.value as Filter)} aria-label="Lọc phim">{Object.entries(filterLabels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></div></div>
            {error && <div className="alert error-alert"><AlertTriangle size={19}/>{error}<button onClick={() => void load()}>Thử lại</button></div>}
            {notice && <div className="alert success-alert"><CircleCheck size={18}/>{notice}<button onClick={() => setNotice("")} aria-label="Đóng thông báo"><X size={16}/></button></div>}
            <div className="table-wrap"><table className="movies-table"><thead><tr><th>PHIM</th><th>TRẠNG THÁI</th><th>NGUỒN</th><th>TẬP</th><th>THAO TÁC</th></tr></thead><tbody>{loading ? Array.from({length: 6},(_,i)=><tr key={i}><td colSpan={5}><div className="loading-line"/></td></tr>) : data.items.map(movie=><tr key={movie.slug}><td><div className="movie-identity"><Poster movie={movie}/><div className="movie-titles"><strong>{movie.title}</strong><span>{movie.slug}</span></div></div></td><td><span className={`status-chip ${movie.hidden ? "chip-hidden" : movie.status === "DRAFT" ? "chip-draft" : "chip-live"}`}><span className="status-dot"/>{movie.hidden ? "Đã ẩn" : movie.status === "DRAFT" ? "Bản nháp" : "Hiển thị"}</span></td><td><span className="source-type">{movie.source === "NEON" ? "Bilibili / Neon" : "Catalog"}</span></td><td><span className="episode-count">{movie.episodeCount || "—"}</span></td><td><div className="actions"><button className="edit-button" onClick={() => setSelected(movie)}><Pencil size={14}/> Chỉnh sửa</button><a className="view-button" href={`https://www.phephim.ai/phim/${encodeURIComponent(movie.slug)}/`} target="_blank" rel="noreferrer" title="Xem trên website"><ExternalLink size={16}/></a></div></td></tr>)}</tbody></table>
              {!loading && !data.items.length && <div className="empty-state"><ImageIcon size={30}/><h3>Không tìm thấy phim</h3><p>Thử từ khóa khác hoặc thay đổi bộ lọc.</p></div>}
            </div>
            <div className="pagination"><span>Trang {page} / {Math.max(1, Math.ceil(data.total / data.pageSize))}</span><div><button disabled={page <= 1 || loading} onClick={() => setPage((n) => n - 1)} aria-label="Trang trước"><ChevronLeft size={17}/></button><button disabled={page * data.pageSize >= data.total || loading} onClick={() => setPage((n) => n + 1)} aria-label="Trang tiếp"><ChevronRight size={17}/></button></div></div>
          </section>
          <footer className="footer-caption">© PHE PHIM AI · Administration workspace</footer>
        </div>
      </main>
      {selected && <EditDialog movie={selected} onClose={() => setSelected(null)} onSave={async (patch) => saveMovie(selected, patch)}/>}
    </div>
  );
}

function EditDialog({ movie, onClose, onSave }: { movie: Movie; onClose: () => void; onSave: (patch: Record<string, unknown>) => Promise<void> }) {
  const [title, setTitle] = useState(movie.titleOverride ?? movie.originalTitle);
  const [poster, setPoster] = useState(movie.posterOverride ?? movie.poster);
  const [hidden, setHidden] = useState(movie.hidden);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [confirmHide, setConfirmHide] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true); setError("");
    try {
      const data = new FormData(); data.append("file", file); data.append("slug", movie.slug);
      const response = await fetch("/api/uploads", { method: "POST", body: data });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error === "BLOB_NOT_CONFIGURED" ? "Chưa kết nối Vercel Blob. Có thể dán đường dẫn ảnh HTTPS." : json.error || "Upload thất bại");
      setPoster(json.url);
    } catch (err) { setError(err instanceof Error ? err.message : "Upload thất bại"); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  async function submit() {
    if (!title.trim()) { setError("Tên phim không được bỏ trống"); return; }
    if (hidden && !movie.hidden && !confirmHide) { setConfirmHide(true); return; }
    setBusy(true); setError("");
    try {
      const titleOverride = title.trim() === movie.originalTitle ? null : title.trim();
      const posterOverride = poster.trim() === movie.poster && movie.posterOverride === null ? null : poster.trim() || null;
      await onSave({ titleOverride, posterOverride, hidden });
    } catch (err) { setError(err instanceof Error ? err.message : "Không lưu được thay đổi"); }
    finally { setBusy(false); }
  }

  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} role="presentation"><div className="dialog" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div className="dialog-header"><div><div className="eyebrow">MOVIE EDITOR</div><h2 id="edit-title">Chỉnh sửa thông tin phim</h2></div><button className="close-button" onClick={onClose} aria-label="Đóng"><X size={21}/></button></div>
    <div className="dialog-body"><div className="edit-preview"><div className="poster-preview">{poster ? <img src={poster} alt="Bìa phim" onError={(e) => { e.currentTarget.style.opacity = "0.15"; }}/> : <ImageIcon size={32}/>}</div><div className="preview-copy"><strong>{movie.originalTitle}</strong><span>Slug: {movie.slug}</span><span>Nguồn: {movie.source === "NEON" ? "Neon" : "Catalog tĩnh"}</span></div></div>
      <label className="field-label" htmlFor="movie-title">Tên phim hiển thị</label><input id="movie-title" className="field-input" value={title} maxLength={180} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tên phim"/>
      <label className="field-label" htmlFor="movie-poster">Ảnh bìa phim</label><div className="poster-url-field"><Link2 size={17}/><input id="movie-poster" value={poster} onChange={(e) => setPoster(e.target.value)} placeholder="https://.../poster.webp"/></div>
      <div className="poster-controls"><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void upload(e.target.files?.[0])}/><button className="secondary-button" disabled={uploading} onClick={() => inputRef.current?.click()}><UploadCloud size={17}/>{uploading ? "Đang tải ảnh..." : "Tải ảnh từ thiết bị"}</button><span>JPG, PNG, WebP · tối đa 4MB</span></div>
      <div className="visibility-section"><div><strong>Hiển thị trên website</strong><p>Ẩn phim chỉ gỡ khỏi danh sách, không xóa dữ liệu video hoặc nguồn phát.</p></div><button className={`toggle ${!hidden ? "toggle-on" : ""}`} role="switch" aria-checked={!hidden} onClick={() => {setHidden(!hidden); setConfirmHide(false)}}><span/></button></div>
      <button className="visibility-action" onClick={() => { setHidden(!hidden); setConfirmHide(false); }}>{hidden ? "Khôi phục phim vào danh sách" : "Ẩn / Xóa khỏi danh sách công khai"}</button>
      {confirmHide && <div className="confirm-box"><AlertTriangle size={19}/><div><strong>Xác nhận ẩn phim?</strong><p>Phim sẽ biến mất khỏi danh sách công khai sau khi website được tích hợp. Nhấn Lưu thay đổi thêm lần nữa để xác nhận.</p></div></div>}
      {error && <div className="alert error-alert"><AlertTriangle size={18}/>{error}</div>}
    </div>
    <div className="dialog-footer"><button className="secondary-button" onClick={onClose} disabled={busy}>Hủy</button><button className="primary-button" onClick={() => void submit()} disabled={busy || uploading}><Save size={17}/>{busy ? "Đang lưu..." : "Lưu thay đổi"}</button></div>
  </div></div>;
}