// NEBULA 星云画廊 — 云端存储版 (Cloudinary unsigned upload)
// 炫酷 3D 卡片画廊 + 底部悬浮上传按钮 + 弹窗上传
(() => {
  // ===== 配置区（按需修改）=====
  const CLOUD_NAME = 'xdg5jjqx';       // 你的 Cloudinary Cloud Name
  const UPLOAD_PRESET = 'github-web';  // 你的 unsigned upload preset
  // ================================

  const MANIFEST_KEY = 'nebula-manifest';

  const gallery = document.getElementById('track');
  const carouselWrap = document.querySelector('.carousel-wrap');
  const fab = document.getElementById('fab');
  const modal = document.getElementById('upload-modal');
  const modalClose = document.getElementById('modal-close');
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
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

  // ---- 3D 倾斜效果 ----
  function attachTilt(card) {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (0.5 - py) * 14;  // 绕 X 轴
      const ry = (px - 0.5) * 14;  // 绕 Y 轴
      card.classList.add('tilting');
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.06) translateY(-8px)`;
      // 高光跟随鼠标
      const shine = card.querySelector('.shine');
      if (shine) {
        shine.style.setProperty('--mx', `${px * 100}%`);
        shine.style.setProperty('--my', `${py * 100}%`);
      }
    });
    card.addEventListener('mouseleave', () => {
      card.classList.remove('tilting');
      card.style.transform = '';
    });
  }

  // 创建一个卡片
  function buildCard(img) {
    const card = document.createElement('div');
    card.className = 'card';

    const el = document.createElement('img');
    el.src = img.url;
    el.alt = img.name;
    el.title = img.name;
    el.loading = 'lazy';

    const shine = document.createElement('div');
    shine.className = 'shine';

    const meta = document.createElement('div');
    meta.className = 'meta';
    const info = document.createElement('span');
    info.textContent = `${fmtTime(img.ts)} · ${fmtSize(img.size)}`;
    const del = document.createElement('button');
    del.className = 'del';
    del.textContent = '✕';
    del.title = '从列表移除';
    del.addEventListener('click', e => {
      e.stopPropagation();
      removeFromManifest(img.id);
      render();
    });
    meta.appendChild(info);
    meta.appendChild(del);

    card.appendChild(el);
    card.appendChild(shine);
    card.appendChild(meta);

    el.addEventListener('click', () => openLightbox(img.url));
    card.addEventListener('click', () => openLightbox(img.url));
    attachTilt(card);
    return card;
  }

  // ---- 渲染（自动滚动：渲染两份实现无缝循环）----
  function render() {
    const list = loadManifest();
    if (list.length === 0) {
      gallery.innerHTML = '<div class="empty">◈ 画廊空空如也，点击右下角按钮上传第一张图 ◈</div>';
      carouselWrap.classList.remove('playing');
      return;
    }
    gallery.innerHTML = '';
    // 渲染两组，保证 translateX(-50%) 时无缝衔接
    [...list, ...list].forEach(img => gallery.appendChild(buildCard(img)));

    // 设置滚动速度：图片越多滚得越慢，更从容
    const speed = Math.max(25, Math.min(80, list.length * 6));
    carouselWrap.style.setProperty('--speed', speed + 's');
    carouselWrap.classList.add('playing');
  }

  // ---- 灯箱 ----
  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.hidden = false;
  }
  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = '';
  }

  // ---- 弹窗控制 ----
  function openModal() {
    modal.hidden = false;
    setStatus('');
  }
  function closeModal() {
    modal.hidden = true;
    setStatus('');
  }

  fab.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  // ---- 上传事件 ----
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
      // 上传完成后稍等关闭弹窗
      setTimeout(closeModal, 900);
    } catch (err) {
      console.error(err);
      setStatus(`⚠ ${err.message}`, true);
    }
  }

  // ---- 灯箱关闭 ----
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeLightbox();
      if (!modal.hidden) closeModal();
    }
  });

  // ---- 启动 ----
  render();
})();
