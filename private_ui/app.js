(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);
  const loginPanel = byId("login-panel");
  const libraryPanel = byId("library-panel");
  const loginForm = byId("login-form");
  const tokenInput = byId("access-token");
  const listNode = byId("document-list");
  const detailNode = byId("document-detail");
  const statusNode = byId("status-message");
  const globalNode = byId("global-message");
  const logoutButton = byId("logout-button");

  function setMessage(node, message, isError) {
    node.textContent = message || "";
    node.classList.toggle("error", Boolean(isError));
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  async function api(path, options) {
    const opts = options || {};
    const response = await fetch(path, {
      method: opts.method || "GET",
      headers: opts.headers || {},
      body: opts.body,
      credentials: "same-origin",
      cache: "no-store"
    });
    let payload = {};
    try {
      payload = await response.json();
    } catch (_error) {
      payload = {};
    }
    if (!response.ok) {
      const error = new Error(payload.error || "REQUEST_FAILED");
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function showLogin() {
    loginPanel.classList.remove("hidden");
    libraryPanel.classList.add("hidden");
    listNode.replaceChildren();
    detailNode.replaceChildren();
  }

  function showLibrary() {
    loginPanel.classList.add("hidden");
    libraryPanel.classList.remove("hidden");
    setMessage(globalNode, "");
  }

  function renderDocuments(documents) {
    listNode.replaceChildren();
    if (!documents.length) {
      listNode.appendChild(element("p", "muted", "当前存储没有可浏览资料。"));
      return;
    }
    documents.forEach((item) => {
      const button = element("button", "document-card");
      button.type = "button";
      button.dataset.documentId = item.document_id;
      button.appendChild(element("span", "document-card-title", "资料 " + item.document_id.slice(0, 12)));
      button.appendChild(element("span", "document-card-meta", String(item.slide_count) + " 页 · " + item.schema_version));
      button.addEventListener("click", () => loadDocument(item.document_id));
      listNode.appendChild(button);
    });
  }

  function renderDocument(payload) {
    detailNode.replaceChildren();
    const content = payload.content || {};
    const slides = Array.isArray(content.slides) ? content.slides : [];
    detailNode.appendChild(element("p", "eyebrow", "PRIVATE DOCUMENT"));
    detailNode.appendChild(element("h2", "detail-title", "资料 " + payload.document_id.slice(0, 12)));
    detailNode.appendChild(element("p", "muted", slides.length + " 页 · 版本 " + String(content.schema_version || "unknown")));

    if (!slides.length) {
      detailNode.appendChild(element("p", "muted", "这份资料没有可展示的幻灯片内容。"));
      return;
    }

    slides.forEach((slide, index) => {
      const section = element("section", "slide-card");
      const slideNumber = Number(slide.slide_number || index + 1);
      section.appendChild(element("h3", "slide-title", slide.title || ("第 " + slideNumber + " 页")));
      section.appendChild(element("p", "slide-meta", "来源页码：" + slideNumber));
      const blocks = Array.isArray(slide.blocks) ? slide.blocks : [];
      blocks.forEach((block) => {
        const shapeIndex = Number.isInteger(block.shape_index) ? block.shape_index : "—";
        if (block.type === "text") {
          const paragraphs = Array.isArray(block.paragraphs) ? block.paragraphs : [];
          paragraphs.forEach((paragraph) => {
            const p = element("p", "text-block", paragraph.text || "");
            const level = Math.max(0, Math.min(6, Number(paragraph.level) || 0));
            p.classList.add("level-" + level);
            p.dataset.shapeIndex = String(shapeIndex);
            section.appendChild(p);
          });
        } else if (block.type === "table") {
          section.appendChild(element("p", "block-meta", "表格 · shape_index " + shapeIndex));
          const table = element("table", "content-table");
          const tbody = element("tbody");
          (Array.isArray(block.rows) ? block.rows : []).forEach((row) => {
            const tr = element("tr");
            (Array.isArray(row) ? row : []).forEach((cell) => {
              tr.appendChild(element("td", "", cell === null ? "" : String(cell)));
            });
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          section.appendChild(table);
        } else {
          const kind = block.shape_type || block.type || "unknown";
          const note = block.note || "此内容类型暂未解析。";
          section.appendChild(element("p", "unsupported", "未解析对象（" + kind + "）： " + note + " · shape_index " + shapeIndex));
        }
      });
      detailNode.appendChild(section);
    });
  }

  async function loadDocuments() {
    const result = await api("/api/private/documents");
    const documents = Array.isArray(result.documents) ? result.documents : [];
    renderDocuments(documents);
    setMessage(statusNode, "已加载 " + documents.length + " 份本机资料。");
  }

  async function loadDocument(documentId) {
    setMessage(statusNode, "正在读取资料…");
    try {
      const result = await api("/api/private/documents/" + encodeURIComponent(documentId));
      renderDocument(result);
      setMessage(statusNode, "");
    } catch (error) {
      setMessage(statusNode, error.status === 401 ? "会话已失效，请重新登录。" : "读取失败：" + error.message, true);
      if (error.status === 401) showLogin();
    }
  }

  async function refreshSession() {
    try {
      const result = await api("/api/private/session");
      if (!result.authenticated) {
        showLogin();
        return;
      }
      showLibrary();
      await loadDocuments();
    } catch (_error) {
      showLogin();
      setMessage(globalNode, "无法连接本机服务，请确认服务仍在运行。", true);
    }
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const token = tokenInput.value;
    tokenInput.value = "";
    setMessage(globalNode, "正在验证…");
    try {
      await api("/api/private/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token })
      });
      showLibrary();
      await loadDocuments();
    } catch (error) {
      showLogin();
      setMessage(globalNode, error.status === 401 ? "访问令牌不正确。" : "登录失败：" + error.message, true);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      await api("/api/private/session", { method: "DELETE" });
    } finally {
      showLogin();
      setMessage(globalNode, "已注销。");
    }
  });

  refreshSession();
})();
