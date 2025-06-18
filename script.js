const { jsPDF } = window.jspdf;

const el = {
  canvas: document.getElementById('canvas'),
  clock: document.getElementById('clock'),
  addBtn: document.getElementById('add-btn'),
  themeToggle: document.getElementById('theme-toggle'),
  exportBtn: document.getElementById('export-btn'),
  settingsBtn: document.getElementById('settings-btn'),
  addModal: document.getElementById('add-modal'),
  settingsModal: document.getElementById('settings-modal'),
  accentPicker: document.getElementById('accent-picker-hidden'),
  accentPreview: document.getElementById('accent-preview-fixed'),
  darkLogoUpload: document.getElementById('dark-logo-upload'),
  lightLogoUpload: document.getElementById('light-logo-upload'),
  darkLogoPreview: document.getElementById('dark-logo-preview'),
  lightLogoPreview: document.getElementById('light-logo-preview'),
  logoImage: document.getElementById('dashboard-logo'),
  suggestedSwatches: document.getElementById('suggested-swatches'),
  widgetListItems: document.querySelectorAll('.widget-list li'),
  addCustomWidgetBtn: document.querySelector('.add-custom-widget'),
  widgetSettingsModal: document.getElementById('widget-settings-modal'),
  settingsWidgetId: document.getElementById('settings-widget-id'),
  widgetSettingsContent: document.getElementById('widget-settings-content'),
  saveWidgetSettingsBtn: document.querySelector('.save-widget-settings')
};

let zIndex = 1;
const LOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M144 144l0 48 160 0 0-48c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192l0-48C80 64.5 144.5 0 224 0s144 64.5 144 144l0 48 16 0c35.3 0 64 28.7 64 64l0 192c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 256c0-35.3 28.7-64 64-64l16 0z"/></svg>`;
const UNLOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M352 144c0-44.2 35.8-80 80-80s80 35.8 80 80l0 48c0 17.7 14.3 32 32 32s32-14.3 32-32l0-48C576 64.5 511.5 0 432 0S288 64.5 288 144l0 48L64 192c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-192c0-35.3-28.7-64-64-64l-32 0 0-48z"/></svg>`;
const SETTINGS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/></svg>`;

const customWidgets = {
  'scribble-notepad': {
    content: '<textarea style="width:100%;height:100%;background:none;color:white;border:1px solid #444;border-radius:4px;"></textarea>',
    init: (panel) => {
      const textarea = panel.querySelector('textarea');
      let config = JSON.parse(panel.dataset.config || '{}');
      if (!config.note) config.note = '';
      textarea.value = config.note;
      textarea.oninput = () => {
        config.note = textarea.value;
        panel.dataset.config = JSON.stringify(config);
      };
    },
    settings: (panel) => {
      const config = JSON.parse(panel.dataset.config || '{}');
      return `
        <div class="section">
          <label for="note-content-${panel.id}">Notes:</label>
          <textarea
            id="note-content-${panel.id}"
            style="width:100%;height:100px;margin-bottom:10px;padding:5px;background:var(--bg);color:white;border:1px solid #444;border-radius:4px;"
          >${config.note || ''}</textarea>
        </div>
      `;
    }
  },
'pit-road': {
  content: '<div class="pit-box-key"></div><div class="pit-box-container"></div>',
  init: (panel) => {
    const container = panel.querySelector('.pit-box-container');
    const key = panel.querySelector('.pit-box-key');
    
    // Load and validate config
    let config = {};
    const defaultConfig = {
      count: 44, // Fixed to 44 stalls
      boxes: {},
      mobilityBoxes: [],
      vacantBoxes: [],
      eliminatedBoxes: [],
      timingLinePositions: [],
      reverseOrder: true // Start from 44 down to 1
    };
    try {
      config = JSON.parse(panel.dataset.config || '{}');
    } catch (e) {
      console.error('Failed to parse config:', e);
    }
    config = { ...defaultConfig, ...config };
    config.mobilityBoxes = Array.isArray(config.mobilityBoxes) ? config.mobilityBoxes : [];
    config.vacantBoxes = Array.isArray(config.vacantBoxes) ? config.vacantBoxes : [];
    config.eliminatedBoxes = Array.isArray(config.eliminatedBoxes) ? config.eliminatedBoxes : [];
    config.timingLinePositions = Array.isArray(config.timingLinePositions) ? config.timingLinePositions : [];

    // Clear and set up key
    container.innerHTML = '';
    key.innerHTML = `
      <div><span style="background:repeating-linear-gradient(45deg, red 0, red 10px, white 10px, white 20px);"></span>Eliminated</div>
      <div><span style="background:red;"></span>Mobility</div>
      <div><span style="background:black;"></span>Vacant</div>
    `;

    // Generate 44 boxes (44 to 1)
    const boxCount = 44; // Fixed number of stalls
    const numbers = Array.from({ length: boxCount }, (_, i) => (44 - i).toString());
    const displayNumbers = config.reverseOrder ? numbers : numbers.slice().reverse();

    displayNumbers.forEach(num => {
      const box = document.createElement('div');
      box.className = 'pit-box';
      box.textContent = config.boxes[num] || num; // Custom text or stall number
      if (config.eliminatedBoxes.includes(num)) box.classList.add('eliminated');
      else if (config.mobilityBoxes.includes(num)) box.classList.add('mobility');
      else if (config.vacantBoxes.includes(num)) box.classList.add('vacant');
      container.appendChild(box);
    });

    // Get actual box dimensions after rendering
    const firstBox = container.querySelector('.pit-box');
    if (firstBox) {
      const boxWidth = firstBox.getBoundingClientRect().width;
      const boxHeight = firstBox.getBoundingClientRect().height;

      // Add timing lines (e.g., start/finish line between stalls 22 and 23)
      config.timingLinePositions.forEach(pos => {
        const lineIndex = displayNumbers.indexOf(pos);
        if (lineIndex >= 0 && lineIndex < displayNumbers.length - 1) {
          const line = document.createElement('div');
          line.className = 'timing-line';
          line.style.width = '2.5px';
          line.style.height = `${boxHeight}px`; // Match box height
          line.style.background = 'red';
          line.style.position = 'absolute';
          // Center the 2.5px line in the 2px gap
          const leftPosition = (lineIndex * (boxWidth + 2)) + boxWidth + (2 - 2.5) / 2;
          line.style.left = `${leftPosition}px`;
          line.style.top = '0';
          container.appendChild(line);
        }
      });
    }

    panel.dataset.config = JSON.stringify(config);
  },
  settings: (panel) => {
    let config = {};
    const defaultConfig = {
      count: 44,
      boxes: {},
      mobilityBoxes: [],
      vacantBoxes: [],
      eliminatedBoxes: [],
      timingLinePositions: [],
      reverseOrder: true
    };
    try {
      config = JSON.parse(panel.dataset.config || '{}');
    } catch (e) {
      console.error('Failed to parse config:', e);
    }
    config = { ...defaultConfig, ...config };
    config.mobilityBoxes = Array.isArray(config.mobilityBoxes) ? config.mobilityBoxes : [];
    config.vacantBoxes = Array.isArray(config.vacantBoxes) ? config.vacantBoxes : [];
    config.eliminatedBoxes = Array.isArray(config.eliminatedBoxes) ? config.eliminatedBoxes : [];
    config.timingLinePositions = Array.isArray(config.timingLinePositions) ? config.timingLinePositions : [];

    const numbers = Array.from({ length: 44 }, (_, i) => (44 - i).toString());
    const displayNumbers = config.reverseOrder ? numbers : numbers.slice().reverse();

    return `
      <div class="section">
        <label>Custom Text:</label>
        <div style="display: flex; flex-wrap: wrap; gap: 2px;">
          ${displayNumbers.map(num => `
            <input type="text" value="${config.boxes[num] || ''}" data-num="${num}" style="width: 40px; text-align: center;" onblur="(() => {
              config.boxes[this.dataset.num] = this.value;
              panel.dataset.config = JSON.stringify(config);
              customWidgets['pit-road'].init(panel);
            })()">
          `).join('')}
        </div>
      </div>
      <div class="section">
        <label>Eliminated Boxes:</label>
        <div style="display: flex; flex-wrap: wrap; gap: 2px;">
          ${displayNumbers.map(num => `
            <div class="mimic-box ${config.eliminatedBoxes.includes(num) ? 'eliminated' : ''}" data-num="${num}" onclick="(() => {
              const idx = config.eliminatedBoxes.indexOf('${num}');
              if (idx > -1) config.eliminatedBoxes.splice(idx, 1); else config.eliminatedBoxes.push('${num}');
              panel.dataset.config = JSON.stringify(config);
              customWidgets['pit-road'].init(panel);
              el.widgetSettingsContent.innerHTML = customWidgets['pit-road'].settings(panel);
            })()">${num}</div>
          `).join('')}
        </div>
      </div>
      <div class="section">
        <label>Mobility Boxes:</label>
        <div style="display: flex; flex-wrap: wrap; gap: 2px;">
          ${displayNumbers.map(num => `
            <div class="mimic-box ${config.mobilityBoxes.includes(num) ? 'mobility' : ''}" data-num="${num}" onclick="(() => {
              const idx = config.mobilityBoxes.indexOf('${num}');
              if (idx > -1) config.mobilityBoxes.splice(idx, 1); else config.mobilityBoxes.push('${num}');
              panel.dataset.config = JSON.stringify(config);
              customWidgets['pit-road'].init(panel);
              el.widgetSettingsContent.innerHTML = customWidgets['pit-road'].settings(panel);
            })()">${num}</div>
          `).join('')}
        </div>
      </div>
      <div class="section">
        <label>Vacant Boxes:</label>
        <div style="display: flex; flex-wrap: wrap; gap: 2px;">
          ${displayNumbers.map(num => `
            <div class="mimic-box ${config.vacantBoxes.includes(num) ? 'vacant' : ''}" data-num="${num}" onclick="(() => {
              const idx = config.vacantBoxes.indexOf('${num}');
              if (idx > -1) config.vacantBoxes.splice(idx, 1); else config.vacantBoxes.push('${num}');
              panel.dataset.config = JSON.stringify(config);
              customWidgets['pit-road'].init(panel);
              el.widgetSettingsContent.innerHTML = customWidgets['pit-road'].settings(panel);
            })()">${num}</div>
          `).join('')}
        </div>
      </div>
      <div class="section">
        <label>Timing Lines (Start/Finish):</label>
        <div style="display: flex; flex-wrap: wrap; gap: 2px;">
          ${displayNumbers.slice(0, -1).map(num => `
            <div class="mimic-box ${config.timingLinePositions.includes(displayNumbers[displayNumbers.indexOf(num) + 1]) ? 'highlight' : ''}" data-num="${num}" onclick="(() => {
              const nextNum = displayNumbers[displayNumbers.indexOf('${num}') + 1];
              const idx = config.timingLinePositions.indexOf(nextNum);
              if (idx > -1) config.timingLinePositions.splice(idx, 1); else config.timingLinePositions.push(nextNum);
              panel.dataset.config = JSON.stringify(config);
              customWidgets['pit-road'].init(panel);
              el.widgetSettingsContent.innerHTML = customWidgets['pit-road'].settings(panel);
            })()">${num}</div>
          `).join('')}
        </div>
      </div>
    `;
  }
},
};

function closeAddModal() {
  if (el.addModal) el.addModal.style.display = 'none';
}

function closeSettingsModal() {
  if (el.settingsModal) el.settingsModal.style.display = 'none';
}

function closeWidgetSettingsModal() {
  if (el.widgetSettingsModal) el.widgetSettingsModal.style.display = 'none';
}

function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    if (document.body.classList.contains('light-mode')) {
      icon.setAttribute('viewBox', '0 0 512 512');
      icon.innerHTML = '<path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z"/>';
    } else {
      icon.setAttribute('viewBox', '0 0 384 512');
      icon.innerHTML = '<path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"/>';
    }
  }
}

function updateLogoPreviews() {
  const darkLogo = localStorage.getItem('dashboard-logo');
  const lightLogo = localStorage.getItem('dashboard-logo-light');
  if (el.darkLogoPreview) {
    el.darkLogoPreview.src = darkLogo || '';
    el.darkLogoPreview.style.display = darkLogo ? 'inline-block' : 'none';
    el.darkLogoPreview.nextElementSibling.style.display = darkLogo ? 'inline-block' : 'none';
  }
  if (el.lightLogoPreview) {
    el.lightLogoPreview.src = lightLogo || '';
    el.lightLogoPreview.style.display = lightLogo ? 'inline-block' : 'none';
    el.lightLogoPreview.nextElementSibling.style.display = lightLogo ? 'inline-block' : 'none';
  }
  if (el.logoImage) {
    el.logoImage.src = document.body.classList.contains('light-mode') && lightLogo ? lightLogo : darkLogo || '';
    el.logoImage.style.display = (darkLogo || lightLogo) ? 'inline-block' : 'none';
  }
}

function suggestAccentColor(imageDataUrl) {
  if (!imageDataUrl || !el.suggestedSwatches) return;
  el.suggestedSwatches.innerHTML = '';
  const img = new Image();
  img.src = imageDataUrl;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorCounts = {};
    const skip = 5;
    for (let i = 0; i < imageData.length; i += 4 * skip) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);
      if (brightness < 80 || brightness > 240 || saturation < 30) continue;
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      colorCounts[hex] = (colorCounts[hex] || 0) + 1;
    }
    const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
    let mainColor = '#ff4500';
    if (sortedColors.length > 0) {
      mainColor = sortedColors[0][0];
    }
    const suggestedColors = [mainColor, '#000000', '#ffffff'];
    suggestedColors.forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = color;
      swatch.title = color;
      swatch.onclick = () => {
        if (el.accentPicker) {
          document.documentElement.style.setProperty('--accent-color', color);
          localStorage.setItem('accent-color', color);
          el.accentPreview.style.backgroundColor = color;
          updateButtonColors();
          adjustTextColor();
        }
      };
      el.suggestedSwatches.appendChild(swatch);
    });
  };
}

function darkenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) * (1 - percent / 100);
  const g = ((num >> 8) & 0x00FF) * (1 - percent / 100);
  const b = (num & 0x0000FF) * (1 - percent / 100);
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

function updateButtonColors() {
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
  document.querySelectorAll('.modern-btn, .custom-file span').forEach(el => {
    el.style.background = accentColor || '#ff0000';
    el.style.setProperty('--hover-bg', darkenColor(accentColor || '#ff0000', 20));
  });
}

function adjustTextColor() {
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
  if (!accentColor) return;
  const hex = accentColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isLight = luminance > 0.5;
  document.querySelectorAll('.modern-btn, .custom-file span').forEach(el => {
    el.style.color = isLight ? 'black' : 'white';
  });
}

function persistLogos() {
  const darkLogo = localStorage.getItem('dashboard-logo');
  const lightLogo = localStorage.getItem('dashboard-logo-light');
  if (darkLogo && el.darkLogoPreview && el.logoImage) {
    el.darkLogoPreview.src = darkLogo;
    el.darkLogoPreview.style.display = 'inline-block';
    if (!document.body.classList.contains('light-mode') || !lightLogo) {
      el.logoImage.src = darkLogo;
      el.logoImage.style.display = 'inline-block';
    }
  }
  if (lightLogo && el.lightLogoPreview && el.logoImage && document.body.classList.contains('light-mode')) {
    el.lightLogoPreview.src = lightLogo;
    el.lightLogoPreview.style.display = 'inline-block';
    el.logoImage.src = lightLogo;
    el.logoImage.style.display = 'inline-block';
  }
}

function createPanel({ x, y, w, h, type }) {
  const panel = document.createElement('div');
  panel.id = `widget-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  panel.className = `panel ${type}-widget`;
  panel.style.left = `${Math.round(x / 10) * 10}px`;
  panel.style.top = `${Math.round(y / 10) * 10}px`;
  panel.style.width = `${Math.round(w / 10) * 10}px`;
  panel.style.height = `${Math.round(h / 10) * 10}px`;
  panel.style.zIndex = zIndex++;

  const defaultConfig = {
    count: type === 'pit-road' ? 43 : undefined,
    boxes: {},
    mobilityBoxes: [],
    vacantBoxes: [],
    eliminatedBoxes: [],
    timingLinePositions: [],
    reverseOrder: false,
    note: type === 'scribble-notepad' ? '' : undefined
  };
  panel.dataset.config = JSON.stringify(defaultConfig);

  const headerContent = `
    <span>${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}</span>
    <div>
      <button class="settings-btn">${SETTINGS_SVG}</button>
      <button class="lock-btn">${UNLOCK_SVG.replace('fill="currentColor"', 'fill="#00ff00"')}</button>
      <button class="close-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z" fill="currentColor"/></svg></button>
    </div>
  `;
  const header = document.createElement('div');
  header.className = 'panel-header';
  header.innerHTML = headerContent;

  let bodyContent;
  if (customWidgets[type]) {
    bodyContent = document.createElement('div');
    bodyContent.className = 'panel-body';
    bodyContent.innerHTML = customWidgets[type].content || 'Custom widget content to be defined.';
  } else {
    bodyContent = document.createElement('div');
    bodyContent.className = 'panel-body';
    bodyContent.innerText = 'Custom widget not defined.';
  }

  panel.appendChild(header);
  panel.appendChild(bodyContent);
  if (el.canvas) el.canvas.appendChild(panel);

  $(panel).resizable({
    stop: function() {
      customWidgets[type].init(panel);
    }
  });

  $(panel).draggable({
    handle: '.panel-header',
    containment: 'parent',
    grid: [10, 10],
    stop: function(event, ui) {
      const allPanels = el.canvas.getElementsByClassName('panel');
      const thisPanel = this;
      let attempts = 0;
      const maxAttempts = 10;
      const offsets = [
        { x: 0, y: 10 },
        { x: 10, y: 0 },
        { x: 0, y: -10 },
        { x: -10, y: 0 }
      ];

      function hasOverlap() {
        const thisRect = thisPanel.getBoundingClientRect();
        for (let otherPanel of allPanels) {
          if (otherPanel !== thisPanel) {
            const otherRect = otherPanel.getBoundingClientRect();
            if (!(thisRect.right < otherRect.left || thisRect.left > otherRect.right || thisRect.bottom < otherRect.top || thisRect.top > otherRect.bottom)) {
              return true;
            }
          }
        }
        return false;
      }

      while (hasOverlap() && attempts < maxAttempts) {
        const offset = offsets[attempts % offsets.length];
        const currentLeft = parseInt(thisPanel.style.left) || 0;
        const currentTop = parseInt(thisPanel.style.top) || 0;
        thisPanel.style.left = `${Math.round((currentLeft + offset.x) / 10) * 10}px`;
        thisPanel.style.top = `${Math.round((currentTop + offset.y) / 10) * 10}px`;
        attempts++;
      }

      if (attempts >= maxAttempts) {
        console.warn('Could not resolve overlap for panel:', thisPanel.id);
        thisPanel.style.left = `${Math.round(ui.originalPosition.left / 10) * 10}px`;
        thisPanel.style.top = `${Math.round(ui.originalPosition.top / 10) * 10}px`;
      }
    }
  }).resizable({
    containment: 'parent',
    grid: 10,
    stop: function(event, ui) {
      $(this).css({
        width: `${Math.round(ui.size.width / 10) * 10}px`,
        height: `${Math.round(ui.size.height / 10) * 10}px`
      });
      const panel = this;
      if (panel.classList.contains('pit-road-widget')) {
        customWidgets['pit-road'].init(panel); // Reinitialize to update timing lines
      }
    }
  });

  header.querySelector('.close-btn').onclick = () => panel.remove();
  const lockBtn = header.querySelector('.lock-btn');
  lockBtn.onclick = function() {
    const isLocked = panel.classList.toggle('locked');
    if (isLocked) {
      lockBtn.innerHTML = LOCK_SVG.replace('fill="currentColor"', 'fill="#ff0000"');
    } else {
      lockBtn.innerHTML = UNLOCK_SVG.replace('fill="currentColor"', 'fill="#00ff00"');
    }
    $(panel).draggable(isLocked ? 'disable' : 'enable');
    $(panel).resizable(isLocked ? 'disable' : 'enable');
  };

  const settingsBtn = header.querySelector('.settings-btn');
  settingsBtn.onclick = () => {
    const widgetType = panel.className.split(' ')[1].replace('-widget', '');
    el.widgetSettingsModal.style.display = 'flex';
    el.settingsWidgetId.value = panel.id;
    setTimeout(() => {
      el.widgetSettingsContent.innerHTML = customWidgets[widgetType].settings(panel);
    }, 0);
  };

  if (customWidgets[type] && customWidgets[type].init) {
    customWidgets[type].init(panel);
  }
}

el.addBtn.onclick = () => {
  console.log('Add button clicked');
  if (el.addModal) el.addModal.style.display = 'flex';
};

el.settingsBtn.onclick = () => {
  console.log('Settings button clicked');
  if (el.settingsModal) el.settingsModal.style.display = 'flex';
};

el.themeToggle.onclick = () => {
  console.log('Theme toggle clicked');
  document.body.classList.toggle('light-mode');
  updateThemeIcon();
  updateLogoPreviews();
  suggestAccentColor(localStorage.getItem(document.body.classList.contains('light-mode') && localStorage.getItem('dashboard-logo-light') ? 'dashboard-logo-light' : 'dashboard-logo'));
  document.querySelectorAll('.topbar-icon, .panel-header .lock-btn, .panel-header .close-btn, .panel-header .settings-btn').forEach(btn => {
    btn.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
    const svg = btn.querySelector('svg');
    if (svg) {
      svg.style.fill = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
    }
    if (btn.classList.contains('lock-btn') && !btn.parentElement.parentElement.classList.contains('locked')) {
      btn.innerHTML = UNLOCK_SVG.replace('fill="currentColor"', `fill="#00ff00"`);
    }
  });
};

el.exportBtn.onclick = async () => {
  console.log('Export button clicked');
  if (el.canvas) {
    try {
      const canvas = await html2canvas(el.canvas);
      const pdf = new jsPDF('landscape', 'pt', [canvas.width, canvas.height]);
      pdf.addImage(canvas, 'PNG', 0, 0);
      pdf.save('dashboard.pdf');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Check console for details.');
    }
  }
};

if (el.accentPreview && el.accentPicker) {
  el.accentPreview.onclick = () => {
    if (el.accentPicker) el.accentPicker.click();
  };
  el.accentPicker.oninput = () => {
    const color = el.accentPicker.value;
    if (document.documentElement && el.accentPreview) {
      document.documentElement.style.setProperty('--accent-color', color);
      localStorage.setItem('accent-color', color);
      el.accentPreview.style.backgroundColor = color;
      updateButtonColors();
      adjustTextColor();
    }
  };
}

if (el.darkLogoUpload) {
  el.darkLogoUpload.onchange = e => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = event => {
      const logoData = event.target.result;
      localStorage.setItem('dashboard-logo', logoData);
      updateLogoPreviews();
      suggestAccentColor(logoData);
    };
    reader.readAsDataURL(file);
  };
}

if (el.lightLogoUpload) {
  el.lightLogoUpload.onchange = e => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = event => {
      const logoData = event.target.result;
      localStorage.setItem('dashboard-logo-light', logoData);
      updateLogoPreviews();
      suggestAccentColor(logoData);
    };
    reader.readAsDataURL(file);
  };
}

if (el.darkLogoPreview && el.lightLogoPreview) {
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.onclick = function() {
      const target = this.getAttribute('data-target');
      if (target === 'dark') {
        localStorage.removeItem('dashboard-logo');
        if (el.darkLogoPreview) {
          el.darkLogoPreview.src = '';
          el.darkLogoPreview.style.display = 'none';
          this.style.display = 'none';
        }
        if (!localStorage.getItem('dashboard-logo-light') && el.logoImage) {
          el.logoImage.src = '';
          el.logoImage.style.display = 'none';
        }
      } else if (target === 'light') {
        localStorage.removeItem('dashboard-logo-light');
        if (el.lightLogoPreview) {
          el.lightLogoPreview.src = '';
          el.lightLogoPreview.style.display = 'none';
          this.style.display = 'none';
        }
        if (document.body.classList.contains('light-mode') && !localStorage.getItem('dashboard-logo') && el.logoImage) {
          el.logoImage.src = '';
          el.logoImage.style.display = 'none';
        }
      }
      updateLogoPreviews();
      if (el.suggestedSwatches) el.suggestedSwatches.innerHTML = '';
    };
  });
}

if (el.widgetListItems) {
  el.widgetListItems.forEach(item => {
    item.addEventListener('click', () => {
      const type = item.getAttribute('data-type');
      if (customWidgets[type]) {
        createPanel({ x: 50, y: 50, w: 300, h: 200, type });
        closeAddModal();
      }
    });
  });
}

el.saveWidgetSettingsBtn.onclick = () => {
  const panelId = el.settingsWidgetId.value;
  const panel = document.getElementById(panelId);
  if (!panel) {
    console.error('Panel not found for ID:', panelId);
    return;
  }
  const widgetType = panel.className.split(' ')[1].replace('-widget', '');
  if (widgetType === 'pit-road') {
    let cfg = JSON.parse(panel.dataset.config || '{}');
    const countEl = document.getElementById(`pit-box-count-${panelId}`);
    const revEl = document.getElementById(`reverse-order-${panelId}`);
    if (countEl && revEl) {
      cfg.count = Math.max(1, Math.min(100, parseInt(countEl.value) || 43));
      cfg.reverseOrder = revEl.checked;
      cfg.boxes = cfg.boxes || {};
      cfg.mobilityBoxes = cfg.mobilityBoxes || [];
      cfg.vacantBoxes = cfg.vacantBoxes || [];
      cfg.eliminatedBoxes = cfg.eliminatedBoxes || [];
      cfg.timingLinePositions = cfg.timingLinePositions || [];
      panel.dataset.config = JSON.stringify(cfg);
      customWidgets['pit-road'].init(panel);
    } else {
      console.warn('Count or Reverse Order element not found for panel:', panelId);
      setTimeout(() => {
        el.widgetSettingsContent.innerHTML = customWidgets['pit-road'].settings(panel);
      }, 0);
    }
  } else if (widgetType === 'scribble-notepad') {
    let cfg = JSON.parse(panel.dataset.config || '{}');
    const noteEl = document.getElementById(`note-content-${panelId}`);
    if (noteEl) {
      cfg.note = noteEl.value;
      panel.dataset.config = JSON.stringify(cfg);
      customWidgets['scribble-notepad'].init(panel);
    }
  }
  closeWidgetSettingsModal();
};

if (document.querySelector('#dark-logo-upload') && document.querySelector('#dark-logo-upload').nextElementSibling) {
  document.querySelector('#dark-logo-upload').nextElementSibling.addEventListener('click', () => {
    if (document.querySelector('#dark-logo-upload')) document.querySelector('#dark-logo-upload').click();
  });
}

if (document.querySelector('#light-logo-upload') && document.querySelector('#light-logo-upload').nextElementSibling) {
  document.querySelector('#light-logo-upload').nextElementSibling.addEventListener('click', () => {
    if (document.querySelector('#light-logo-upload')) document.querySelector('#light-logo-upload').click();
  });
}

window.updateConfig = (element, key, panelId) => {
  console.log('Updating', key, 'for', panelId, 'with value', element.value);
  const panel = document.getElementById(panelId);
  if (panel) {
    let config = JSON.parse(panel.dataset.config || '{}');
    if (key === 'boxes') {
      config.boxes = config.boxes || {};
      config.boxes[element.dataset.num] = element.value || '';
      console.log('Updated boxes:', config.boxes);
    }
    panel.dataset.config = JSON.stringify(config);
    customWidgets['pit-road'].init(panel);
  }
};

window.toggleBox = (el, key, panelId) => {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  let cfg = JSON.parse(panel.dataset.config || '{}');
  cfg[key] = cfg[key] || [];
  const num = el.dataset.num;
  const idx = cfg[key].indexOf(num);
  if (idx > -1) {
    cfg[key].splice(idx, 1);
    el.className = `mimic-box`;
  } else {
    cfg[key].push(num);
    el.className = `mimic-box ${key}`;
  }
  panel.dataset.config = JSON.stringify(cfg);
  customWidgets['pit-road'].init(panel);
  el.widgetSettingsContent.innerHTML = customWidgets['pit-road'].settings(panel);
};

window.toggleTimingLine = (el, panelId) => {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  let cfg = JSON.parse(panel.dataset.config || '{}');
  const num = el.dataset.num;
  const displayNumbers = Array.from({ length: cfg.count || 43 }, (_, i) => (i + 1).toString());
  const index = displayNumbers.indexOf(num);
  if (index >= 0 && index < displayNumbers.length - 1) {
    const pos = displayNumbers[index + 1];
    cfg.timingLinePositions = cfg.timingLinePositions || [];
    const idx = cfg.timingLinePositions.indexOf(pos);
    if (idx > -1) {
      cfg.timingLinePositions.splice(idx, 1);
      el.classList.remove('highlight');
    } else {
      cfg.timingLinePositions.push(pos);
      el.classList.add('highlight');
    }
    panel.dataset.config = JSON.stringify(cfg);
    customWidgets['pit-road'].init(panel);
    el.widgetSettingsContent.innerHTML = customWidgets['pit-road'].settings(panel);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');

  // Verify el object
  if (!el.addBtn) console.error('Add button (#add-btn) not found');
  if (!el.themeToggle) console.error('Theme toggle button (#theme-toggle) not found');
  if (!el.settingsBtn) console.error('Settings button (#settings-btn) not found');
  if (!el.exportBtn) console.error('Export button (#export-btn) not found');
  if (!el.addModal) console.error('Add modal (#add-modal) not found');
  if (!el.settingsModal) console.error('Settings modal (#settings-modal) not found');
  if (!el.clock) console.error('Clock element (#clock) not found');
  if (!el.widgetSettingsModal) console.error('Widget settings modal (#widget-settings-modal) not found');

  // Button event listeners
  if (el.addBtn) {
    el.addBtn.onclick = () => {
      console.log('Add button clicked');
      if (el.addModal) {
        el.addModal.style.display = 'flex';
      } else {
        console.error('Add modal not found');
        alert('Add modal not found. Check console for errors.');
      }
    };
  }

  if (el.themeToggle) {
    el.themeToggle.onclick = () => {
      console.log('Theme toggle clicked');
      document.body.classList.toggle('light-mode');
      updateThemeIcon();
      updateLogoPreviews();
      suggestAccentColor(localStorage.getItem(document.body.classList.contains('light-mode') && localStorage.getItem('dashboard-logo-light') ? 'dashboard-logo-light' : 'dashboard-logo'));
      document.querySelectorAll('.topbar-icon, .panel-header .lock-btn, .panel-header .close-btn, .panel-header .settings-btn').forEach(btn => {
        btn.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
        const svg = btn.querySelector('svg');
        if (svg) {
          svg.style.fill = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
        }
        if (btn.classList.contains('lock-btn') && !btn.parentElement.parentElement.classList.contains('locked')) {
          btn.innerHTML = UNLOCK_SVG.replace('fill="currentColor"', `fill="#00ff00"`);
        }
      });
    };
  }

  if (el.settingsBtn) {
    el.settingsBtn.onclick = () => {
      console.log('Settings button clicked');
      if (el.settingsModal) {
        el.settingsModal.style.display = 'flex';
      } else {
        console.error('Settings modal not found');
        alert('Settings modal not found. Check console for errors.');
      }
    };
  }

  if (el.exportBtn) {
    el.exportBtn.onclick = async () => {
      console.log('Export button clicked');
      if (el.canvas) {
        try {
          const canvas = await html2canvas(el.canvas);
          const pdf = new jsPDF('landscape', 'pt', [canvas.width, canvas.height]);
          pdf.addImage(canvas, 'PNG', 0, 0);
          pdf.save('dashboard.pdf');
        } catch (error) {
          console.error('PDF export failed:', error);
          alert('PDF export failed. Check console for details.');
        }
      } else {
        console.error('Canvas not found');
        alert('Canvas not found. Check console for errors.');
      }
    };
  }

  // Add clock functionality
  function updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const timezone = 'CST';
    if (el.clock) {
      el.clock.textContent = `${hours}:${minutes}:${seconds} ${ampm} ${timezone}`;
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Existing initialization code
  const storedAccent = localStorage.getItem('accent-color');
  if (storedAccent && el.accentPicker) {
    el.accentPicker.value = storedAccent;
    document.documentElement.style.setProperty('--accent-color', storedAccent);
    if (el.accentPreview) el.accentPreview.style.backgroundColor = storedAccent;
    updateButtonColors();
    adjustTextColor();
  }
  persistLogos();
  updateLogoPreviews();
  suggestAccentColor(
    localStorage.getItem(
      document.body.classList.contains('light-mode') && localStorage.getItem('dashboard-logo-light')
        ? 'dashboard-logo-light'
        : 'dashboard-logo'
    )
  );
});