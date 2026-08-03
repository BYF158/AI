// NEBULA 星云图库 — 云端存储版 (Cloudinary unsigned upload)
// 图片上传至 Cloudinary 云服务器，所有人可见。
(() => {
  // ===== 配置区（按需修改）=====
  const CLOUD_NAME = 'xdg5jjqx';       // 你的 Cloudinary Cloud Name
  const UPLOAD_PRESET = 'github-web';  // 你的 unsigned upload preset
  // ================================

  // 图库清单的存储 key（存图片 URL 列表）。纯静态站点只能存在浏览器本地，
  // 因此"所有人可见"指的是图片本身在云端，清单仍保存在各访客浏览器。
  const MANIFEST_KEY = 'nebula-manifest';

  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const gallery = document.getElementById('gallery');
  const countEl = document.getElementById('count');
  const clearAllBtn = document.getElementById('clear-all');
  const statusEl = document.getElementById('upload-status');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  // ---- 清单（本地存储 URL 列表）----
  function loadManifest() {
    try { return JSON.parse(localStorage.getItem(MANIFEST_KEY)) || []; }
    catch { return []; }
  }
  function saveManifest(list) {
    localStorage.setItem(MANIFEST_KEY, JSON.stringify(list));
  }
  function addToManifest(item) {
    const list = loadManifest();
    list.unshift(item);
    saveManifest(list);
  }
  function removeFromManifest(id) {
    saveManifest(loadManifest().filter(i => i.id !== id));
  }

  // ---- 上传到 Cloudinary ----
  async function uploadToCloud(file) {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', UPLOAD_PRESET);

    const res = await fetch(CLOUD_URL, { method: 'POST', body: form });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`上传失败 (${res.status}): ${err}`);
    }
    const data = await res.json();
    return {
      id: String(data.public_id),
      url: data.secure_url || data.url,
      name: file.name,
      size: file.size,
      ts: Date.now()
    };
  }

  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / 1048576).toFixed(1) + 'MB';
  }
  function fmtTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function setStatus(msg, isError) {
    statusEl.textContent = msg;
    statusEl.className = 'upload-status' + (isError ? ' error' : '');
  }

  // ---- 渲染 ----
  function render() {
    const list = loadManifest();
    countEl.textContent = list.length;
    if (list.length === 0) {
      gallery.innerHTML = '<div class="empty">◈ 暂无云端影像，请上传 ◈</div>';
      return;
    }
    gallery.innerHTML = '';
    list.forEach(img => {
      const card = document.createElement('div');
      card.className = 'card';
      const el = document.createElement('img');
      el.src = img.url;
      el.alt = img.name;
      el.title = '点击放大';
      el.addEventListener('click', () => openLightbox(img.url));
      const meta = document.createElement('div');
      meta.className = 'meta';
      const info = document.createElement('span');
      info.textContent = `${fmtTime(img.ts)} · ${fmtSize(img.size)}`;
      const del = document.createElement('button');
      del.className = 'del';
      del.textContent = '✕';
      del.title = '从列表移除';
      del.addEventListener('click', () => {
        removeFromManifest(img.id);
        render();
      });
      meta.appendChild(info);
      meta.appendChild(del);
      card.appendChild(el);
      card.appendChild(meta);
      gallery.appendChild(card);
    });
  }

  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.hidden = false;
  }
  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = '';
  }

  // ---- 事件 ----
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
    fileInput.value = '';
  });

  async function handleFiles(files) {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imgs.length === 0) return;
    setStatus(`⏳ 正在上传 ${imgs.length} 张到云端…`);
    let ok = 0;
    try {
      for (const f of imgs) {
        const item = await uploadToCloud(f);
        addToManifest(item);
        ok++;
        setStatus(`⏳ 已上传 ${ok}/${imgs.length}…`);
      }
      setStatus(`✅ 上传完成，共 ${ok} 张`);
      render();
    } catch (err) {
      console.error(err);
      setStatus(`⚠ ${err.message}`, true);
    }
  }

  clearAllBtn.addEventListener('click', () => {
    const list = loadManifest();
    if (list.length === 0) return;
    if (confirm('确定要清空当前浏览器中的影像列表吗？')) {
      saveManifest([]);
      render();
    }
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  // ---- 启动 ----
  render();
})();
