/**
 * SphereTourViewer - Motor esférico panorámico 360° para propiedades
 * Utiliza Marzipano (WebGL) como motor principal con fallback en Canvas 2D.
 */
export class SphereTourViewer {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = options;
    this.useMarzipano = typeof window.Marzipano !== 'undefined';

    if (this.useMarzipano) {
      // Motor Marzipano WebGL de alta fidelidad
      this.viewer = new window.Marzipano.Viewer(this.container, {
        controls: {
          mouseViewMode: 'drag',
          scrollZoom: true
        },
        stage: {
          progressive: true
        }
      });
    } else {
      // Fallback en Canvas 2D optimizado
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

  loadPanorama(imageUrl) {
    if (this.useMarzipano) {
      return new Promise((resolve) => {
        const source = window.Marzipano.ImageUrlSource.fromString(imageUrl);
        const geometry = new window.Marzipano.EquirectGeometry([{ width: 4000 }]);
        const limiter = window.Marzipano.RectilinearView.limit.traditional(1024, 100 * Math.PI / 180);
        const view = new window.Marzipano.RectilinearView({ yaw: 0, pitch: 0, fov: Math.PI / 3 }, limiter);

        this.scene = this.viewer.createScene({
          source: source,
          geometry: geometry,
          view: view,
          pinFirstLevel: true
        });

        this.scene.switchTo({
          transitionDuration: 800
        });

        resolve();
      });
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
