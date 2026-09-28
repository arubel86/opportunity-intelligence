/**
 * CarSpinViewer - Motor ultraligero de giro 360° para autos en Canvas
 * Soporta inercia, arrastre táctil / mouse, zoom y auto-rotación.
 */
export class CarSpinViewer {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.images = [];
    this.currentIndex = 0;
    this.totalImages = 0;
    this.isDragging = false;
    this.startX = 0;
    this.sensitivity = options.sensitivity || 8; // Pixeles de arrastre por cada cambio de frame
    this.autoRotate = options.autoRotate !== undefined ? options.autoRotate : false;
    this.autoRotateSpeed = options.autoRotateSpeed || 100; // ms por frame
    this.autoRotateTimer = null;
    this.scale = 1;

    this.initEvents();
  }

  loadImages(imageUrls) {
    return new Promise((resolve, reject) => {
      if (!imageUrls || imageUrls.length === 0) {
        return reject(new Error('No hay imágenes para cargar'));
      }
      this.images = [];
      this.totalImages = imageUrls.length;
      let loadedCount = 0;

      imageUrls.forEach((url, idx) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          loadedCount++;
          if (loadedCount === this.totalImages) {
            this.currentIndex = 0;
            this.draw();
            if (this.autoRotate) this.startAutoRotate();
            resolve();
          }
        };
        img.onerror = () => {
          console.warn(`Error al cargar frame ${idx}: ${url}`);
          loadedCount++;
          if (loadedCount === this.totalImages) {
            this.draw();
            resolve();
          }
        };
        img.src = url;
        this.images.push(img);
      });
    });
  }

  draw() {
    if (!this.images[this.currentIndex] || !this.images[this.currentIndex].complete) return;
    const img = this.images[this.currentIndex];

    // Ajustar tamaño del canvas con soporte Retina / High-DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    if (this.canvas.width !== rect.width * dpr || this.canvas.height !== rect.height * dpr) {
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calcular proporción 'contain'
    const hRatio = this.canvas.width / img.width;
    const vRatio = this.canvas.height / img.height;
    const ratio = Math.min(hRatio, vRatio) * this.scale;

    const centerShiftX = (this.canvas.width - img.width * ratio) / 2;
    const centerShiftY = (this.canvas.height - img.height * ratio) / 2;

    this.ctx.drawImage(
      img,
      0, 0, img.width, img.height,
      centerShiftX, centerShiftY, img.width * ratio, img.height * ratio
    );
  }

  nextFrame() {
    this.currentIndex = (this.currentIndex + 1) % this.totalImages;
    this.draw();
  }

  prevFrame() {
    this.currentIndex = (this.currentIndex - 1 + this.totalImages) % this.totalImages;
    this.draw();
  }

  startAutoRotate() {
    this.stopAutoRotate();
    this.autoRotateTimer = setInterval(() => {
      this.nextFrame();
    }, this.autoRotateSpeed);
  }

  stopAutoRotate() {
    if (this.autoRotateTimer) {
      clearInterval(this.autoRotateTimer);
      this.autoRotateTimer = null;
    }
  }

  initEvents() {
    const onStart = (clientX) => {
      this.isDragging = true;
      this.startX = clientX;
      this.stopAutoRotate();
    };

    const onMove = (clientX) => {
      if (!this.isDragging || this.totalImages === 0) return;
      const deltaX = clientX - this.startX;

      if (Math.abs(deltaX) >= this.sensitivity) {
        const steps = Math.floor(deltaX / this.sensitivity);
        if (steps > 0) {
          for (let i = 0; i < steps; i++) this.prevFrame();
        } else {
          for (let i = 0; i < Math.abs(steps); i++) this.nextFrame();
        }
        this.startX = clientX;
      }
    };

    const onEnd = () => {
      this.isDragging = false;
    };

    // Mouse Events
    this.canvas.addEventListener('mousedown', (e) => onStart(e.clientX));
    window.addEventListener('mousemove', (e) => onMove(e.clientX));
    window.addEventListener('mouseup', onEnd);

    // Touch Events
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) onStart(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) onMove(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchend', onEnd);

    // Redibujar en resize
    window.addEventListener('resize', () => this.draw());
  }
}
