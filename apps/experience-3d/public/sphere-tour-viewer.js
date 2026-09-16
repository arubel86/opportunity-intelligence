/**
 * SphereTourViewer - Motor esférico panorámico 360° para propiedades
 * Utiliza Marzipano (WebGL) con Auto-rotación, Hotspots interactivos,
 * Giroscopio y Teletransporte multi-escena.
 */
export class SphereTourViewer {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = options;
    this.useMarzipano = typeof window.Marzipano !== 'undefined';
    
    this.scenes = new Map();
    this.currentScene = null;
    this.currentView = null;
    this.isAutoRotating = false;
    this.autoRotateTimer = null;
    this.gyroActive = false;
    this.initialAlpha = null;

    if (this.useMarzipano) {
      this.viewer = new window.Marzipano.Viewer(this.container, {
        controls: {
          mouseViewMode: 'drag',
          scrollZoom: true
        },
        stage: {
          progressive: true
        }
      });

      this.initAutoRotateBehavior();
    } else {
      // Fallback Canvas 2D
      this.canvas = document.createElement('canvas');
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.display = 'block';
      this.canvas.style.cursor = 'grab';
      this.container.appendChild(this.canvas);

      this.ctx = this.canvas.getContext('2d');
      this.currentImage = null;
      this.yaw = 0;
      this.pitch = 0;
      this.fov = 75;
      this.isDragging = false;
      this.lastX = 0;
      this.lastY = 0;

      this.initEvents();
    }
  }

  // ── Multi-Escena y Carga ──

  loadScenes(scenesData) {
    if (!scenesData || scenesData.length === 0) return;

    if (this.useMarzipano) {
      scenesData.forEach(sceneData => {
        const source = window.Marzipano.ImageUrlSource.fromString(sceneData.image);
        const geometry = new window.Marzipano.EquirectGeometry([{ width: 4000 }]);
        const limiter = window.Marzipano.RectilinearView.limit.traditional(1024, 100 * Math.PI / 180);
        const view = new window.Marzipano.RectilinearView({ yaw: 0, pitch: 0, fov: Math.PI / 3 }, limiter);

        const scene = this.viewer.createScene({
          source: source,
          geometry: geometry,
          view: view,
          pinFirstLevel: true
        });

        // Registrar hotspots de esta escena
        if (sceneData.hotspots && sceneData.hotspots.length > 0) {
          const hotspotContainer = scene.hotspotContainer();
          sceneData.hotspots.forEach(hp => {
            const el = this.createHotspotElement(hp);
            hotspotContainer.createHotspot(el, { yaw: hp.yaw, pitch: hp.pitch });
          });
        }

        this.scenes.set(sceneData.id, {
          data: sceneData,
          scene: scene,
          view: view
        });
      });

      // Activar la primera escena
      this.switchScene(scenesData[0].id);
    } else {
      // Fallback: cargar primera escena en canvas
      this.loadPanorama(scenesData[0].image);
    }
  }

  switchScene(sceneId) {
    if (!this.useMarzipano || !this.scenes.has(sceneId)) return;

    const item = this.scenes.get(sceneId);
    this.currentScene = item.scene;
    this.currentView = item.view;

    item.scene.switchTo({
      transitionDuration: 800
    });

    // Iniciar auto-rotación en la nueva escena
    this.scheduleAutoRotate();
  }

  loadPanorama(imageUrl) {
    if (this.useMarzipano) {
      this.loadScenes([{
        id: 'default',
        name: 'Principal',
        image: imageUrl,
        hotspots: []
      }]);
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.currentImage = img;
        this.draw();
        resolve();
      };
      img.onerror = (err) => reject(err);
      img.src = imageUrl;
    });
  }

  // ── Hotspots Interactivos ──

  createHotspotElement(hp) {
    const wrapper = document.createElement('div');
    wrapper.className = 'hotspot-wrapper';

    wrapper.innerHTML = `
      <div class="hotspot-beacon">
        <div class="beacon-pulse"></div>
        <div class="beacon-core"></div>
      </div>
      <div class="hotspot-card">
        <div class="hotspot-card-title">${hp.title}</div>
        <div class="hotspot-card-text">${hp.text}</div>
      </div>
    `;

    // Interacción táctil / click
    wrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      wrapper.classList.toggle('active');
    });

    return wrapper;
  }

  // ── Auto-Rotación Cinematográfica ──

  initAutoRotateBehavior() {
    if (!this.useMarzipano) return;

    // Detectar cuando el usuario interactúa para pausar auto-rotación
    const pauseHandler = () => {
      this.stopAutoRotate();
      this.scheduleAutoRotate();
    };

    this.container.addEventListener('mousedown', pauseHandler);
    this.container.addEventListener('touchstart', pauseHandler, { passive: true });
    this.container.addEventListener('wheel', pauseHandler, { passive: true });

    this.scheduleAutoRotate();
  }

  scheduleAutoRotate() {
    if (this.autoRotateTimer) clearTimeout(this.autoRotateTimer);
    this.autoRotateTimer = setTimeout(() => {
      this.startAutoRotate();
    }, 3500); // 3.5 segundos de inactividad
  }

  startAutoRotate() {
    if (!this.useMarzipano || this.isAutoRotating || this.gyroActive) return;
    if (typeof window.Marzipano.autorotate === 'function') {
      this.autorotateAction = window.Marzipano.autorotate({
        yawSpeed: 0.04,
        targetPitch: 0,
        targetFov: Math.PI / 3
      });
      this.viewer.startMovement(this.autorotateAction);
      this.isAutoRotating = true;
    }
  }

  stopAutoRotate() {
    if (!this.useMarzipano || !this.isAutoRotating) return;
    this.viewer.stopMovement();
    this.isAutoRotating = false;
  }

  // ── Giroscopio Móvil 1:1 ──

  async toggleGyro() {
    if (this.gyroActive) {
      this.disableGyro();
      return false;
    } else {
      const success = await this.enableGyro();
      return success;
    }
  }

  async enableGyro() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') return false;
      } catch (err) {
        console.warn('Permiso giroscopio denegado:', err);
        return false;
      }
    }

    this.stopAutoRotate();
    this.initialAlpha = null;

    this.gyroHandler = (e) => {
      if (!this.currentView) return;
      if (this.initialAlpha === null && e.alpha !== null) {
        this.initialAlpha = e.alpha;
      }

      // Mapear orientación física del dispositivo a yaw y pitch
      if (e.alpha !== null && e.beta !== null) {
        const currentYaw = this.currentView.yaw();
        const targetYaw = ((e.alpha - (this.initialAlpha || 0)) * Math.PI / 180) * -1;
        const targetPitch = Math.max(-0.6, Math.min(0.6, (e.beta - 45) * Math.PI / 180));

        // Suavizado suave
        this.currentView.setYaw(targetYaw);
        this.currentView.setPitch(targetPitch);
      }
    };

    window.addEventListener('deviceorientation', this.gyroHandler);
    this.gyroActive = true;
    return true;
  }

  disableGyro() {
    if (this.gyroHandler) {
      window.removeEventListener('deviceorientation', this.gyroHandler);
      this.gyroHandler = null;
    }
    this.gyroActive = false;
    this.scheduleAutoRotate();
  }

  // ── Métodos Fallback Canvas ──

  draw() {
    if (!this.currentImage || this.useMarzipano) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    if (this.canvas.width !== rect.width * dpr || this.canvas.height !== rect.height * dpr) {
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
    }
    const w = this.canvas.width;
    const h = this.canvas.height;
    const imgW = this.currentImage.width;
    const imgH = this.currentImage.height;

    this.ctx.clearRect(0, 0, w, h);
    const sourceX = ((this.yaw % 360) + 360) % 360 / 360 * imgW;
    const viewWidth = (this.fov / 360) * imgW;
    const sourceY = Math.max(0, Math.min(imgH * 0.7, (imgH / 2) + (this.pitch * 5) - (imgH * 0.25)));
    const viewHeight = imgH * 0.5;

    this.ctx.drawImage(
      this.currentImage,
      sourceX, sourceY, Math.min(viewWidth, imgW - sourceX), viewHeight,
      0, 0, w * ((imgW - sourceX) / viewWidth), h
    );

    if (sourceX + viewWidth > imgW) {
      const remainingWidth = (sourceX + viewWidth) - imgW;
      const destX = w * ((imgW - sourceX) / viewWidth);
      this.ctx.drawImage(
        this.currentImage,
        0, sourceY, remainingWidth, viewHeight,
        destX, 0, w * (remainingWidth / viewWidth), h
      );
    }
  }

  initEvents() {
    if (this.useMarzipano) return;
    const onStart = (clientX, clientY) => {
      this.isDragging = true;
      this.lastX = clientX;
      this.lastY = clientY;
      this.canvas.style.cursor = 'grabbing';
    };
    const onMove = (clientX, clientY) => {
      if (!this.isDragging) return;
      const deltaX = clientX - this.lastX;
      const deltaY = clientY - this.lastY;
      this.yaw -= deltaX * 0.2;
      this.pitch += deltaY * 0.2;
      this.pitch = Math.max(-45, Math.min(45, this.pitch));
      this.lastX = clientX;
      this.lastY = clientY;
      this.draw();
    };
    const onEnd = () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'grab';
    };

    this.canvas.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onEnd);
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) onStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('resize', () => this.draw());
  }
}
