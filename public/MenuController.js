window.MenuController = {
  initializeMenu() {
    // Override drawer button click handlers to use MenuController
    const bindBtn = (id, fn) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.onclick = (e) => {
          e.stopPropagation();
          // Hide dropdown
          const dd = document.getElementById('ifp-menu-dropdown');
          if (dd) dd.style.display = 'none';
          // Hide drawer
          if (typeof window.toggleDrawer === 'function') window.toggleDrawer(false);
          fn();
        };
      }
    };

    // Bind dropdown menu
    bindBtn('ifp-menu-dashboard', () => this.loadAssignedLesson());
    bindBtn('ifp-menu-import', () => this.importLocalFile());
    bindBtn('ifp-menu-theme', () => this.changeTheme());
    bindBtn('ifp-menu-blank', () => this.createBlankCanvas());
    bindBtn('ifp-menu-exit', () => this.backToDashboard());

    // Bind drawer buttons (only the ones without pre-existing addEventListener conflicts)
    // NOTE: drawer-btn-lessons is handled by the curriculum engine in index.html — do NOT rebind it.
    // NOTE: drawer-btn-dashboard is hidden by default — do NOT rebind it.

    // Auto restore theme on load
    this.restoreTheme();
  },

  loadAssignedLesson() {
    this.showAssignedLessonModal();
  },

  importLocalFile() {
    const importBtn = document.getElementById('file-import');
    if (importBtn) importBtn.click();
  },

  importLocalLesson() {
    this.importLocalFile();
  },

  createBlankCanvas() {
    if (confirm("Current work may be lost.\nCreate a new blank canvas?")) {
      this.clearCurrentLesson();
    }
  },

  changeTheme() {
    const oldModal = document.getElementById('ifp-theme-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'ifp-theme-modal';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(15, 15, 15, 0.8);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 750;
    `;

    modal.innerHTML = `
      <div style="
        background: rgba(15, 15, 15, 0.95);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 24px;
        width: 100%;
        max-width: 320px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        color: white;
        text-align: center;
      ">
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #e85c0d;">🎨 Board Theme</h3>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
          <button class="theme-opt" data-theme="light" style="
            background: #ffffff; color: #000; border: 1px solid #ddd;
            padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; text-align: left;
          ">⚪ Light Theme</button>
          
          <button class="theme-opt" data-theme="dark" style="
            background: #1e293b; color: #fff; border: 1px solid #475569;
            padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; text-align: left;
          ">⚫ Dark Theme</button>
          
          <button class="theme-opt" data-theme="green" style="
            background: #14532d; color: #fff; border: 1px solid #15803d;
            padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; text-align: left;
          ">🟢 Chalkboard Green</button>
          
          <button class="theme-opt" data-theme="black" style="
            background: #000000; color: #fff; border: 1px solid #333;
            padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; text-align: left;
          ">⚫ Blackboard Black</button>
          
          <button class="theme-opt" data-theme="white" style="
            background: #ffffff; color: #000; border: 1px solid #ccc;
            padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; text-align: left;
          ">⚪ Whiteboard White</button>
        </div>
        <button id="theme-cancel-btn" style="
          background: rgba(255,255,255,0.08); border: none; color: #ccc;
          padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
          width: 100%;
        ">Cancel</button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelectorAll('.theme-opt').forEach(btn => {
      btn.onclick = () => {
        const theme = btn.getAttribute('data-theme');
        this.applyTheme(theme);
        modal.remove();
      };
    });

    document.getElementById('theme-cancel-btn').onclick = () => modal.remove();
  },

  backToDashboard() {
    if (typeof window.deactivateIFPMode === 'function') window.deactivateIFPMode();
    const dbEl = document.getElementById('teacher-dashboard');
    if (dbEl) dbEl.classList.remove('hidden');
    const wbEl = document.getElementById('whiteboard-screen') || document.getElementById('board-screen');
    if (wbEl) wbEl.classList.add('hidden');
  },

  resetCanvasSession() {
    // Use window.clearCurrentPage if available — it handles canvas + page reset cleanly
    if (typeof window.clearCurrentPage === 'function') {
      window.clearCurrentPage(true);
    }

    // Use WhiteboardState accessor (live getters/setters into closure vars)
    const WS = window.WhiteboardState;
    if (WS) {
      WS.activeLessonId = null;
      WS.currentPageNum = 1;
      WS.totalPages = 1;
      WS.history = [];
      WS.historyStep = -1;
      WS.pageAnnotations = {};
      WS.pageAnnotations[1] = WS.createBlankPageData();
    }

    const titleEl = document.getElementById('lesson-title');
    if (titleEl) titleEl.innerText = 'Untitled Lesson';

    // Clear bgImage
    if (window.bgImage) {
      window.bgImage.src = '';
      window.bgImage.style.opacity = '0';
    }

    // Clear any PDF fallback iframe
    const pdfIframe = document.getElementById('pdf-fallback-iframe');
    if (pdfIframe) {
      pdfIframe.src = '';
      pdfIframe.classList.add('hidden');
    }

    // Remove any fullscreen gslide overlay
    const overlay = document.getElementById('gslide-overlay') || document.getElementById('gslide-wrapper');
    if (overlay) overlay.remove();

    // Hide multi-page controls
    const mpc = document.getElementById('multi-page-controls');
    if (mpc) mpc.classList.add('hidden');

    if (typeof window.updatePageCounter === 'function') window.updatePageCounter();
    if (typeof window.updatePagesGrid === 'function') window.updatePagesGrid();
    if (typeof window.updateUndoRedoButtons === 'function') window.updateUndoRedoButtons();
  },


  clearCurrentLesson() {
    this.resetCanvasSession();
  },

  showAssignedLessonModal() {
    const oldModal = document.getElementById('ifp-assigned-lessons-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'ifp-assigned-lessons-modal';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(15, 15, 15, 0.8);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 750;
    `;

    modal.innerHTML = `
      <div style="
        background: rgba(15, 15, 15, 0.95);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 24px;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        color: white;
        display: flex;
        flex-direction: column;
        max-height: 80vh;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 16px; font-weight: 700; color: #e85c0d; display: flex; align-items: center; gap: 8px;">
            📊 Assigned Lessons
          </h3>
          <button id="ifp-assigned-close" style="
            background: none; border: none; color: #aaa; font-size: 20px; cursor: pointer;
          ">×</button>
        </div>

        <input type="text" id="ifp-assigned-search" placeholder="Search lessons..." style="
          width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; padding: 8px 12px; font-size: 13px; color: white; margin-bottom: 12px;
          outline: none;
        ">

        <div id="ifp-assigned-list" style="
          flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;
          margin-bottom: 16px; max-height: 300px;
        ">
          <!-- Populated by JS -->
        </div>

        <button id="ifp-assigned-cancel" style="
          background: rgba(255,255,255,0.08); border: none; color: #ccc;
          padding: 8px; border-radius: 8px; font-size: 13px; cursor: pointer;
        ">Cancel</button>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = document.getElementById('ifp-assigned-close');
    const cancelBtn = document.getElementById('ifp-assigned-cancel');
    const searchInput = document.getElementById('ifp-assigned-search');

    const closeModal = () => modal.remove();
    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

    const fetchAndRender = async (query = '') => {
      const listContainer = document.getElementById('ifp-assigned-list');
      if (!listContainer) return;

      listContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; gap: 8px; color: #aaa; font-size: 12px;">
          <div class="animate-spin" style="width: 20px; height: 20px; border: 2px border-t-transparent rounded-full; border-color: #e85c0d;"></div>
          <span>Loading lessons...</span>
        </div>
      `;

      try {
        // Get Firestore db — prefer window.db (exported after init), fallback to firebase.firestore()
        const firestoreDb = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
        if (!firestoreDb) throw new Error('Firestore not available');

        const uid = (window.teacherSession && window.teacherSession.uid) || '';
        if (!uid) {
          listContainer.innerHTML = `<div style="text-align:center;padding:20px;color:#f87171;font-size:12px;">⚠️ Not logged in.</div>`;
          return;
        }

        const assignmentsSnap = await firestoreDb.collection('lessonAssignments')
          .where('teacherUid', '==', uid)
          .get();

        const lessonIds = [];
        assignmentsSnap.forEach(doc => {
          const data = doc.data();
          if (data.lessonId) {
            lessonIds.push(data.lessonId);
          }
        });

        if (lessonIds.length === 0) {
          listContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #777; font-size: 12px;">
              No lessons assigned by Admin.
            </div>
          `;
          return;
        }

        const lessons = [];
        for (const id of lessonIds) {
          const docSnap = await firestoreDb.collection('lessons').doc(id).get();
          if (docSnap.exists) {
            const d = docSnap.data();
            lessons.push({
              id: docSnap.id,
              title: d.lessonTitle || d.title || d.lessonName || 'Untitled',
              classLabel: d.class || d.className || 'N/A',
              subjectLabel: d.subject || d.subjectName || 'N/A',
              resourceURL: d.resourceURL || d.fileURL || d.cloudUrl || d.downloadURL || d.externalURL || ''
            });
          }
        }

        const filtered = lessons.filter(l => {
          const q = query.toLowerCase();
          return (l.title || '').toLowerCase().includes(q)
              || (l.classLabel || '').toLowerCase().includes(q)
              || (l.subjectLabel || '').toLowerCase().includes(q);
        });

        if (filtered.length === 0) {
          listContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #777; font-size: 12px;">
              No matching lessons found.
            </div>
          `;
          return;
        }

        listContainer.innerHTML = '';
        filtered.forEach(lesson => {
          const item = document.createElement('div');
          item.style.cssText = `
            display: flex; justify-content: space-between; align-items: center;
            padding: 10px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
            border-radius: 8px; cursor: pointer; transition: all 0.2s;
          `;
          item.onmouseover = () => {
            item.style.background = 'rgba(255,255,255,0.08)';
            item.style.borderColor = 'rgba(232, 92, 13, 0.4)';
          };
          item.onmouseout = () => {
            item.style.background = 'rgba(255,255,255,0.03)';
            item.style.borderColor = 'rgba(255,255,255,0.05)';
          };

          item.innerHTML = `
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-grow: 1; padding-right: 8px;">
              <div style="font-size: 13px; font-weight: 600; color: #fff;">\${lesson.title}</div>
              <div style="font-size: 10px; color: #777; margin-top: 4px;">🏫 \${lesson.classLabel} | 📚 \${lesson.subjectLabel}</div>
            </div>
            <span style="color: #777; font-size: 14px;">➔</span>
          `;

          item.onclick = async () => {
            closeModal();
            if (!lesson.resourceURL) {
              alert('This lesson has no file URL. Please contact Admin.');
              return;
            }
            if (typeof window.showGlobalLoading === 'function') window.showGlobalLoading('Loading "' + lesson.title + '"...');

            try {
              this.resetCanvasSession();
              await window.loadLessonFromURL(lesson.resourceURL, lesson.title, lesson.id);
            } catch (err) {
              alert('Failed to load lesson: ' + err.message);
            } finally {
              if (typeof window.hideGlobalLoading === 'function') window.hideGlobalLoading();
            }
          };

          listContainer.appendChild(item);
        });

      } catch (err) {
        listContainer.innerHTML = `
          <div style="text-align: center; padding: 20px; color: #f87171; font-size: 12px;">
            ⚠️ Error: \${err.message}
          </div>
        `;
      }
    };

    fetchAndRender();

    searchInput.oninput = (e) => {
      fetchAndRender(e.target.value);
    };
  },

  applyTheme(themeName) {
    const THEMES = {
      'light': {
        canvasBg: '#f8fafc',
        toolbarBg: 'rgba(255, 255, 255, 0.95)',
        toolbarBorder: '1px solid rgba(0, 0, 0, 0.08)',
        toolbarColor: '#0f172a',
        menuBg: 'rgba(255, 255, 255, 0.98)',
        menuColor: '#0f172a',
        dialogBg: '#ffffff',
        dialogColor: '#0f172a',
        thumbnailBg: '#ffffff',
        thumbnailBorder: '1px solid rgba(0, 0, 0, 0.08)',
        iconColor: '#475569',
        titleColor: '#0f172a'
      },
      'dark': {
        canvasBg: '#0f172a',
        toolbarBg: 'rgba(30, 41, 59, 0.88)',
        toolbarBorder: '1px solid rgba(255, 255, 255, 0.08)',
        toolbarColor: '#f1f5f9',
        menuBg: 'rgba(30, 41, 59, 0.95)',
        menuColor: '#f1f5f9',
        dialogBg: '#1e293b',
        dialogColor: '#f1f5f9',
        thumbnailBg: '#1e293b',
        thumbnailBorder: '1px solid rgba(255, 255, 255, 0.08)',
        iconColor: '#cbd5e1',
        titleColor: '#f1f5f9'
      },
      'green': {
        canvasBg: '#14532d',
        toolbarBg: 'rgba(15, 23, 42, 0.88)',
        toolbarBorder: '1px solid rgba(255, 255, 255, 0.08)',
        toolbarColor: '#f1f5f9',
        menuBg: 'rgba(15, 23, 42, 0.95)',
        menuColor: '#f1f5f9',
        dialogBg: '#0f172a',
        dialogColor: '#f1f5f9',
        thumbnailBg: '#14532d',
        thumbnailBorder: '1px solid rgba(255, 255, 255, 0.08)',
        iconColor: '#cbd5e1',
        titleColor: '#f1f5f9'
      },
      'black': {
        canvasBg: '#000000',
        toolbarBg: 'rgba(15, 15, 15, 0.88)',
        toolbarBorder: '1px solid rgba(255, 255, 255, 0.08)',
        toolbarColor: '#f1f5f9',
        menuBg: 'rgba(15, 15, 15, 0.95)',
        menuColor: '#f1f5f9',
        dialogBg: '#0a0a0a',
        dialogColor: '#f1f5f9',
        thumbnailBg: '#111111',
        thumbnailBorder: '1px solid rgba(255, 255, 255, 0.08)',
        iconColor: '#cbd5e1',
        titleColor: '#f1f5f9'
      },
      'white': {
        canvasBg: '#ffffff',
        toolbarBg: 'rgba(255, 255, 255, 0.95)',
        toolbarBorder: '1px solid rgba(0, 0, 0, 0.08)',
        toolbarColor: '#000000',
        menuBg: 'rgba(255, 255, 255, 0.98)',
        menuColor: '#000000',
        dialogBg: '#ffffff',
        dialogColor: '#000000',
        thumbnailBg: '#ffffff',
        thumbnailBorder: '1px solid rgba(0, 0, 0, 0.08)',
        iconColor: '#334155',
        titleColor: '#000000'
      }
    };

    const theme = THEMES[themeName] || THEMES['light'];
    this.saveTheme(themeName);

    const oldStyle = document.getElementById('ifp-theme-override-styles');
    if (oldStyle) oldStyle.remove();

    const style = document.createElement('style');
    style.id = 'ifp-theme-override-styles';
    style.innerHTML = `
      #bg-layer {
        background-color: ${theme.canvasBg} !important;
      }
      #footer {
        background: ${theme.toolbarBg} !important;
        border: ${theme.toolbarBorder} !important;
      }
      #footer button {
        color: ${theme.toolbarColor} !important;
      }
      #footer span.material-symbols-outlined {
        color: ${theme.iconColor} !important;
      }
      #footer span:not(.material-symbols-outlined) {
        color: ${theme.toolbarColor} !important;
      }
      #ifp-menu-dropdown {
        background: ${theme.menuBg} !important;
        border: ${theme.toolbarBorder} !important;
      }
      #ifp-menu-dropdown button {
        color: ${theme.menuColor} !important;
      }
      #ifp-menu-btn {
        background: ${theme.menuBg} !important;
        color: ${theme.menuColor} !important;
        border: ${theme.toolbarBorder} !important;
      }
      #ifp-sidebar div {
        background: ${theme.menuBg} !important;
        border: ${theme.toolbarBorder} !important;
      }
      #ifp-sidebar button {
        color: ${theme.menuColor} !important;
      }
      #color-palette-popup, #toolbox-popup, #pages-list-popup {
        background-color: ${theme.dialogBg} !important;
        color: ${theme.dialogColor} !important;
        border-color: ${theme.toolbarBorder.split(' ').pop()} !important;
      }
      #color-palette-popup button, #toolbox-popup button, #pages-list-popup button {
        color: ${theme.dialogColor} !important;
      }
      #pages-scroller > div {
        background-color: ${theme.thumbnailBg} !important;
        border-color: ${theme.thumbnailBorder.split(' ').pop()} !important;
      }
      #pages-scroller > div > div {
        background-color: ${theme.thumbnailBg} !important;
        color: ${theme.dialogColor} !important;
        border-color: ${theme.thumbnailBorder.split(' ').pop()} !important;
      }
    `;
    document.head.appendChild(style);

    if (typeof window.currentTheme !== 'undefined') {
      window.currentTheme.background = theme.canvasBg;
    }
  },

  saveTheme(themeName) {
    localStorage.setItem('whiteboardTheme', themeName);
  },

  restoreTheme() {
    const saved = localStorage.getItem('whiteboardTheme') || 'light';
    this.applyTheme(saved);
  }
};

// Global delegation helpers
window.initializeMenu = function() { window.MenuController.initializeMenu(); };
window.loadAssignedLesson = function() { window.MenuController.loadAssignedLesson(); };
window.importLocalLesson = function() { window.MenuController.importLocalLesson(); };
window.createBlankCanvas = function() { window.MenuController.createBlankCanvas(); };
window.changeTheme = function() { window.MenuController.changeTheme(); };
window.backToDashboard = function() { window.MenuController.backToDashboard(); };
window.resetCanvasSession = function() { window.MenuController.resetCanvasSession(); };
window.clearCurrentLesson = function() { window.MenuController.clearCurrentLesson(); };
window.showAssignedLessonModal = function() { window.MenuController.showAssignedLessonModal(); };
window.applyTheme = function(theme) { window.MenuController.applyTheme(theme); };
window.saveTheme = function(theme) { window.MenuController.saveTheme(theme); };
window.restoreTheme = function() { window.MenuController.restoreTheme(); };
