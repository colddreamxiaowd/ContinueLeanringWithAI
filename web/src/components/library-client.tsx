"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronRight, File, FileImage,
  FileText, Folder, FolderOpen, LoaderCircle, RefreshCw, Search, ShieldCheck,
  Unplug, ExternalLink, Download,
} from "lucide-react";
import { previewKind, type PreviewKind } from "@/lib/file-types.mjs";

type Connection = {
  connected: boolean;
  name?: string;
  open_id?: string | null;
  connected_at?: string;
  last_synced_at?: string | null;
  refresh_available?: boolean;
};
type DriveItem = {
  token: string;
  name: string;
  type: string;
  mime_type: string | null;
  size: number | null;
  modified_time: string | number | null;
  url: string | null;
};
type LibraryItem = {
  id: string;
  source_token: string;
  parent_source_token: string | null;
  root_folder_token: string;
  name: string;
  item_type: string;
  mime_type: string | null;
  size_bytes: number | null;
  modified_time: string | null;
  web_url: string | null;
  relative_path: string;
  last_seen_at: string;
};
type Crumb = { token: string | null; name: string };
type SyncProgress = { status: string; items_seen: number; folders_seen: number; pages_processed: number };

function humanSize(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value < 0) return "";
  if (value < 1024) return value + " B";
  if (value < 1024 * 1024) return (value / 1024).toFixed(1) + " KB";
  if (value < 1024 * 1024 * 1024) return (value / (1024 * 1024)).toFixed(1) + " MB";
  return (value / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

function errorText(code: string): string {
  const messages: Record<string, string> = {
    feishu_config: "网站还未完成飞书应用配置。部署者需要补齐服务端环境变量。",
    feishu_denied: "你取消了飞书授权。需要同步资料时可以重新连接。",
    feishu_state: "飞书授权状态校验失败，请重新发起连接。",
    feishu_token: "飞书没有返回有效授权。请检查应用权限和回调地址后重试。",
    feishu_connect_failed: "飞书连接失败。请确认应用已发布、云空间只读权限已启用。",
    login_required: "请先登录网站账号，再连接飞书。",
    FEISHU_NOT_CONNECTED: "请先连接自己的飞书账号。",
    FEISHU_REAUTH_REQUIRED: "飞书授权已过期，请重新连接飞书。",
    FEISHU_PERMISSION_DENIED: "飞书拒绝访问该资料。请检查文件夹分享权限及云空间读取/下载权限。",
    FEISHU_API_FAILED: "读取飞书目录失败，请稍后重试。",
    FEISHU_DOWNLOAD_FAILED: "文件读取失败，可能是文件类型或下载权限不支持。",
    LIBRARY_UNAVAILABLE: "资料索引暂时不可用，请检查数据库配置。",
  };
  return messages[code] || code.replaceAll("_", " ");
}

export function LibraryClient({ accountEmail }: { accountEmail: string }) {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"browse" | "synced">("browse");
  const [browsePath, setBrowsePath] = useState<Crumb[]>([{ token: null, name: "我的飞书" }]);
  const [driveItems, setDriveItems] = useState<DriveItem[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [search, setSearch] = useState("");
  const [syncedFolderPath, setSyncedFolderPath] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [textPreview, setTextPreview] = useState("");
  const [textLoading, setTextLoading] = useState(false);

  const currentFolder = browsePath[browsePath.length - 1];

  const setMessage = (message: string, error = false) => {
    setNotice(message);
    setIsError(error);
  };

  const loadDriveFolder = useCallback(async (token: string | null) => {
    setBrowseLoading(true);
    try {
      const query = token ? "?folder_token=" + encodeURIComponent(token) : "";
      const response = await fetch("/api/feishu/files" + query, { cache: "no-store" });
      const result = (await response.json()) as { files?: DriveItem[]; error?: string };
      if (!response.ok) throw new Error(result.error || "FEISHU_API_FAILED");
      setDriveItems(result.files || []);
    } catch (error) {
      setDriveItems([]);
      setMessage(errorText(error instanceof Error ? error.message : "FEISHU_API_FAILED"), true);
    } finally {
      setBrowseLoading(false);
    }
  }, []);

  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const response = await fetch("/api/library/items", { cache: "no-store" });
      const result = (await response.json()) as { items?: LibraryItem[]; error?: string };
      if (!response.ok) throw new Error(result.error || "LIBRARY_UNAVAILABLE");
      setItems(result.items || []);
    } catch (error) {
      setMessage(errorText(error instanceof Error ? error.message : "LIBRARY_UNAVAILABLE"), true);
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  const loadConnection = useCallback(async () => {
    setConnectionLoading(true);
    try {
      const response = await fetch("/api/feishu/status", { cache: "no-store" });
      if (response.status === 401) {
        window.location.href = "/login?next=%2Flibrary";
        return;
      }
      const result = (await response.json()) as Connection & { error?: string };
      if (!response.ok) throw new Error(result.error || "SERVER_NOT_CONFIGURED");
      setConnection(result);
      if (result.connected) {
        await loadDriveFolder(browsePath[browsePath.length - 1]?.token || null);
        await loadLibrary();
      }
    } catch (error) {
      setMessage(errorText(error instanceof Error ? error.message : "SERVER_NOT_CONFIGURED"), true);
    } finally {
      setConnectionLoading(false);
    }
  }, [loadDriveFolder, loadLibrary, browsePath]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) setMessage(errorText(error), true);
    if (params.get("connected") === "1") setMessage("飞书已连接。现在可以浏览并同步选定文件夹。");
    void loadConnection();
  }, [loadConnection]);

  useEffect(() => {
    let cancelled = false;
    async function loadText() {
      if (!selectedItem || previewKind(selectedItem.name, selectedItem.item_type) !== "text" || selectedItem.item_type !== "file") {
        setTextPreview("");
        setTextLoading(false);
        return;
      }
      setTextLoading(true);
      try {
        const response = await fetch("/api/library/items/" + selectedItem.id + "/content", { cache: "no-store" });
        if (!response.ok) {
          const result = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(result.error || "FEISHU_DOWNLOAD_FAILED");
        }
        const text = await response.text();
        if (!cancelled) setTextPreview(text);
      } catch (error) {
        if (!cancelled) setTextPreview("读取失败：" + errorText(error instanceof Error ? error.message : "FEISHU_DOWNLOAD_FAILED"));
      } finally {
        if (!cancelled) setTextLoading(false);
      }
    }
    void loadText();
    return () => { cancelled = true; };
  }, [selectedItem]);

  async function openDriveFolder(item: DriveItem) {
    const next = [...browsePath, { token: item.token, name: item.name }];
    setBrowsePath(next);
    setMessage("");
    await loadDriveFolder(item.token);
  }

  async function syncCurrentFolder() {
    if (!currentFolder.token) {
      setMessage("请先打开你要同步的资料文件夹，再点击“同步当前文件夹”。", true);
      return;
    }
    setBusy(true);
    setProgress({ status: "running", items_seen: 0, folders_seen: 0, pages_processed: 0 });
    setMessage("正在开始递归同步。大文件内容不会上传到公开仓库，预览时会通过你的授权从飞书读取。");
    try {
      const startResponse = await fetch("/api/library/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_token: currentFolder.token, folder_name: currentFolder.name }),
      });
      const start = (await startResponse.json()) as { job_id?: string; error?: string };
      if (!startResponse.ok || !start.job_id) throw new Error(start.error || "SYNC_START_FAILED");

      let finished = false;
      for (let stepNumber = 0; stepNumber < 2000; stepNumber++) {
        const response = await fetch("/api/library/sync/step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: start.job_id }),
        });
        const result = (await response.json()) as { job?: SyncProgress & { id?: string; pending_count?: number; last_error?: string }; error?: string };
        if (!response.ok) throw new Error(result.error || "SYNC_STEP_FAILED");
        const job = result.job;
        if (!job) throw new Error("SYNC_STEP_FAILED");
        setProgress(job);
        if (job.status === "failed") throw new Error(job.last_error || "SYNC_STEP_FAILED");
        if (job.status === "completed") {
          finished = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 180));
      }
      if (!finished) throw new Error("SYNC_PAGE_LIMIT");
      await loadLibrary();
      setActiveTab("synced");
      setSyncedFolderPath(null);
      setSelectedItem(null);
      setMessage("同步完成。已索引 " + (progress?.items_seen ?? 0) + " 项；打开“我的资料”即可预览支持的文件。");
    } catch (error) {
      const code = error instanceof Error ? error.message : "SYNC_FAILED";
      setMessage(errorText(code), true);
    } finally {
      setBusy(false);
    }
  }

  const visibleSyncedItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter(item => {
      const parentPath = item.relative_path.includes("/")
        ? item.relative_path.slice(0, item.relative_path.lastIndexOf("/"))
        : null;
      if (parentPath !== syncedFolderPath) return false;
      if (!needle) return true;
      return item.name.toLowerCase().includes(needle) || item.relative_path.toLowerCase().includes(needle);
    });
  }, [items, search, syncedFolderPath]);

  const syncedBreadcrumbs = useMemo(() => {
    if (!syncedFolderPath) return [];
    return syncedFolderPath.split("/").map((name, index, all) => ({
      name,
      path: all.slice(0, index + 1).join("/"),
    }));
  }, [syncedFolderPath]);

  function renderPreview(item: LibraryItem) {
    const kind: PreviewKind = previewKind(item.name, item.item_type);
    const contentUrl = "/api/library/items/" + item.id + "/content";
    if (item.item_type !== "file") {
      return <div className="library-empty-preview"><ExternalLink size={24}/><strong>这是飞书在线文档或其他云端对象</strong><p>当前版本优先支持云盘文件的 TXT、图片、PDF 在线预览；在线文档可直接回到飞书打开。</p>{item.web_url && <a className="button button-primary" href={item.web_url} target="_blank" rel="noreferrer">在飞书打开 <ExternalLink size={15}/></a>}</div>;
    }
    if (kind === "image") {
      return <div className="library-image-preview"><img src={contentUrl} alt={item.name}/><a className="button button-ghost" href={contentUrl + "?download=1"}>下载原图 <Download size={15}/></a></div>;
    }
    if (kind === "text") {
      return <div className="library-text-preview">{textLoading ? <p className="library-muted">正在读取文本…</p> : <pre>{textPreview}</pre>}<a className="button button-ghost" href={contentUrl + "?download=1"}>下载原文件 <Download size={15}/></a></div>;
    }
    if (kind === "pdf") {
      return <div className="library-pdf-preview"><iframe title={item.name} src={contentUrl}/><a className="button button-ghost" href={contentUrl + "?download=1"}>下载 PDF <Download size={15}/></a></div>;
    }
    return <div className="library-empty-preview"><File size={26}/><strong>{item.name}</strong><p>此格式可通过网站安全代理下载。PPTX、DOCX、XLSX 等二进制文件不会被误当成文本渲染。</p><a className="button button-primary" href={contentUrl + "?download=1"}>下载文件 <Download size={15}/></a>{item.web_url && <a className="button button-ghost" href={item.web_url} target="_blank" rel="noreferrer">在飞书打开 <ExternalLink size={15}/></a>}</div>;
  }

  if (connectionLoading) {
    return <div className="library-loading"><LoaderCircle className="spin" size={22}/> 正在检查账号与飞书连接…</div>;
  }

  return (
    <div className="library-workspace">
      <section className="library-account-card">
        <div className="library-account-icon"><ShieldCheck size={22}/></div>
        <div className="library-account-copy"><strong>{accountEmail}</strong><span>{connection?.connected ? "已连接飞书账号：" + (connection.name || "已授权") : "网站账号已登录，尚未连接飞书"}</span></div>
        {connection?.connected ? <span className="tag tag-success"><CheckCircle2 size={13}/> 飞书已连接</span> : <a className="button button-primary" href="/api/feishu/connect">连接我的飞书 <ArrowRight size={15}/></a>}
      </section>

      {connection?.connected && !connection.refresh_available && <div className="inline-info"><Unplug size={17}/><p>当前授权没有可用的长期刷新凭证。若同步一段时间后提示重新授权，请重新连接飞书；请在飞书授权页允许离线访问。</p></div>}

      {notice && <div className={isError ? "library-notice library-notice--error" : "library-notice"} role="status">{notice}</div>}

      {connection?.connected && <>
        <div className="library-toolbar">
          <div className="library-tabs">
            <button className={activeTab === "browse" ? "library-tab library-tab--active" : "library-tab"} onClick={() => setActiveTab("browse")}><FolderOpen size={16}/> 浏览飞书</button>
            <button className={activeTab === "synced" ? "library-tab library-tab--active" : "library-tab"} onClick={() => { setActiveTab("synced"); void loadLibrary(); }}><BookOpen size={16}/> 我的资料 <span>{items.length}</span></button>
          </div>
          <button className="button button-ghost" onClick={() => { void loadConnection(); }} disabled={busy}><RefreshCw size={15}/> 刷新</button>
        </div>

        {activeTab === "browse" && <section className="library-browser panel">
          <div className="library-browser-head">
            <div><span className="section-kicker">FEISHU DRIVE</span><h2>选择要同步的文件夹</h2><p>同步会递归扫描当前文件夹中的子文件夹。你可以只同步放学习资料的目录，不必同步整个云盘。</p></div>
            <button className="button button-primary" onClick={syncCurrentFolder} disabled={busy || !currentFolder.token}>{busy ? <LoaderCircle className="spin" size={15}/> : <RefreshCw size={15}/>} 同步当前文件夹</button>
          </div>
          <div className="library-breadcrumbs">
            {browsePath.map((crumb, index) => <span key={(crumb.token || "root") + index}><button onClick={async () => { const next = browsePath.slice(0, index + 1); setBrowsePath(next); await loadDriveFolder(crumb.token); }}>{crumb.name}</button>{index < browsePath.length - 1 && <ChevronRight size={14}/>}</span>)}
          </div>
          {browseLoading ? <div className="library-loading"><LoaderCircle className="spin" size={18}/> 正在读取目录…</div> : driveItems.length === 0 ? <div className="library-empty-row">此目录没有可列出的资料，或当前授权无法读取该目录。</div> : <div className="library-drive-list">
            {driveItems.map(item => {
              const folder = item.type === "folder";
              const kind = previewKind(item.name, item.type);
              const Icon = folder ? Folder : kind === "image" ? FileImage : kind === "text" ? FileText : File;
              return <div className="library-drive-row" key={item.token}>
                <Icon size={18} className={folder ? "library-folder-icon" : "library-file-icon"}/>
                <div className="library-drive-name"><strong>{item.name}</strong><span>{folder ? "文件夹" : item.type}{item.size ? " · " + humanSize(item.size) : ""}</span></div>
                {folder ? <button className="icon-button" aria-label={"打开 " + item.name} onClick={() => void openDriveFolder(item)}><ChevronRight size={18}/></button> : item.url ? <a className="icon-button" aria-label={"在飞书打开 " + item.name} href={item.url} target="_blank" rel="noreferrer"><ExternalLink size={16}/></a> : <span className="library-muted">文件</span>}
              </div>;
            })}
          </div>}
          {busy && progress && <div className="library-progress"><div className="library-progress-copy"><LoaderCircle className="spin" size={16}/> 正在递归同步：已处理 {progress.items_seen} 项、发现 {progress.folders_seen} 个子文件夹、完成 {progress.pages_processed} 页目录</div><div className="library-progress-track"><span style={{ width: progress.status === "completed" ? "100%" : Math.min(92, progress.pages_processed * 4) + "%" }}/></div></div>}
        </section>}

        {activeTab === "synced" && <section className="library-synced-layout">
          <div className="panel library-files-panel">
            <div className="library-list-head"><div><span className="section-kicker">SYNCED MATERIALS</span><h2>我的资料</h2><p>{items.length} 个文件与文件夹</p></div><button className="icon-button" aria-label="刷新资料列表" onClick={() => void loadLibrary()}><RefreshCw size={16}/></button></div>
            <div className="library-search"><Search size={16}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索当前目录…"/></div>
            <div className="library-breadcrumbs library-breadcrumbs--synced">
              <button onClick={() => { setSyncedFolderPath(null); setSelectedItem(null); }}>我的资料</button>
              {syncedBreadcrumbs.map(crumb => <span key={crumb.path}><ChevronRight size={13}/><button onClick={() => { setSyncedFolderPath(crumb.path); setSelectedItem(null); }}>{crumb.name}</button></span>)}
            </div>
            {libraryLoading ? <div className="library-loading"><LoaderCircle className="spin" size={18}/> 正在加载…</div> : visibleSyncedItems.length === 0 ? <div className="library-empty-row">这里暂时没有资料。到“浏览飞书”选择文件夹并同步即可。</div> : <div className="library-drive-list">
              {visibleSyncedItems.map(item => {
                const folder = item.item_type === "folder";
                const kind = previewKind(item.name, item.item_type);
                const Icon = folder ? Folder : kind === "image" ? FileImage : kind === "text" ? FileText : File;
                return <button className={selectedItem?.id === item.id ? "library-drive-row library-drive-row--selected" : "library-drive-row"} key={item.id} onClick={() => {
                  if (folder) { setSyncedFolderPath(item.relative_path); setSelectedItem(null); }
                  else { setSelectedItem(item); }
                }}>
                  <Icon size={18} className={folder ? "library-folder-icon" : "library-file-icon"}/>
                  <span className="library-drive-name"><strong>{item.name}</strong><span>{item.relative_path}{item.size_bytes ? " · " + humanSize(item.size_bytes) : ""}</span></span>
                  {folder ? <ChevronRight size={16}/> : <span className="library-muted">{kind === "download" ? "下载" : "预览"}</span>}
                </button>;
              })}
            </div>}
            {syncedFolderPath && <button className="button button-ghost library-back-button" onClick={() => { const parts = syncedFolderPath.split("/"); parts.pop(); setSyncedFolderPath(parts.length ? parts.join("/") : null); setSelectedItem(null); }}><ArrowLeft size={15}/> 返回上级</button>}
          </div>
          <div className="panel library-preview-panel">
            {selectedItem ? <>
              <div className="library-preview-head"><div><span className="section-kicker">FILE PREVIEW</span><h2>{selectedItem.name}</h2><p>{selectedItem.relative_path}</p></div><a className="icon-button" aria-label="下载文件" href={"/api/library/items/" + selectedItem.id + "/content?download=1"}><Download size={17}/></a></div>
              {renderPreview(selectedItem)}
            </> : <div className="library-empty-preview"><FileText size={28}/><strong>选择一份资料</strong><p>文本、图片和 PDF 可在线预览；其他文件可下载或回到飞书打开。</p></div>}
          </div>
        </section>}
      </>}
    </div>
  );
}
