import {
    Component,
    EventEmitter,
    HostListener,
    Input,
    OnChanges,
    Output,
    SimpleChanges
  } from '@angular/core';
  
  // ===========================================================
  // Helpers (reusable anywhere you pick an image file)
  // ===========================================================
  
  export interface CropRatio {
    label: string;
    value: number; // width / height
  }
  
  /** Returns an error message, or null if the file is OK. */
  export function validateImageFile(file: File, maxSizeMb = 5): string | null {
  
    if (!file.type.startsWith('image/')) {
      return `"${file.name}" is not an image file.`;
    }
  
    if (file.size > maxSizeMb * 1024 * 1024) {
      return `"${file.name}" is larger than ${maxSizeMb} MB.`;
    }
  
    return null;
  }
  
  /** Reads a file and returns it as a base64 data URL. */
  export function fileToDataUrl(file: File): Promise<string> {
  
    return new Promise((resolve, reject) => {
  
      const reader = new FileReader();
  
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Unable to read file'));
  
      reader.readAsDataURL(file);
    });
  }

  @Component({
    selector: 'app-image-cropper',
    standalone: true,
    template: `
      <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" (click)="cancel()">
  
        <div class="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl"
          (click)="$event.stopPropagation()">
  
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
  
            <h2 class="font-semibold text-[#193629]">{{ title }}</h2>
  
            <button type="button" (click)="cancel()"
              class="flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
              ×
            </button>
  
          </div>
  
  
          <div class="p-5">
  
            @if (loadError) {
  
            <p class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              This image could not be loaded for editing.
            </p>
  
            } @else {
  
            <!-- Crop stage: shows the WHOLE image, dimmed outside the frame -->
            <div class="flex justify-center">
  
              <div class="relative select-none overflow-hidden rounded-lg bg-black"
                [style.width.px]="stageW" [style.height.px]="stageH" style="touch-action: none"
                [class.cursor-grab]="loaded" [class.active:cursor-grabbing]="loaded"
                (pointerdown)="startDrag($event)" (pointermove)="drag($event)" (pointerup)="endDrag($event)"
                (pointercancel)="endDrag($event)" (wheel)="onWheel($event)">
  
                @if (loaded) {
  
                <!-- Full image, never clipped to the crop frame -->
                <img [src]="currentSrc" alt="Crop preview" draggable="false"
                  class="pointer-events-none absolute left-1/2 top-1/2 max-w-none origin-center opacity-90"
                  [style.width.px]="natW" [style.height.px]="natH" [style.transform]="imageTransform" />
  
                <!-- Spotlight mask: a border-only box whose box-shadow dims
                     everything OUTSIDE it, leaving only the crop frame bright.
                     This is the core WhatsApp-style visual. -->
                <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white"
                  [class.rounded-full]="round" [class.rounded-md]="!round"
                  [style.width.px]="frameW" [style.height.px]="frameH"
                  style="box-shadow: 0 0 0 9999px rgba(0,0,0,0.6);">
  
                  <!-- Rule-of-thirds guide lines, inside the frame only -->
                  <div class="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                    @for (cell of guides; track cell) {
                    <div class="border border-white/25"></div>
                    }
                  </div>
  
                </div>
  
                } @else {
  
                <div class="flex h-full w-full items-center justify-center text-xs text-gray-400">
                  Loading...
                </div>
  
                }
  
              </div>
  
            </div>
  
  
            <!-- Ratio choices -->
            @if (ratios.length > 0) {
  
            <div class="mt-4 flex flex-wrap justify-center gap-2">
  
              @for (ratio of ratios; track ratio.label) {
  
              <button type="button" (click)="setRatio(ratio.value)"
                class="rounded-lg border px-3 py-1.5 text-xs font-medium transition"
                [class]="ratio.value === activeRatio
                  ? 'border-[#193629] bg-[#193629] text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-[#193629] hover:text-[#193629]'">
                {{ ratio.label }}
              </button>
  
              }
  
            </div>
  
            }
            <!-- Tools -->
            <div class="mt-4 flex flex-wrap justify-center gap-2">
  
              <button type="button" (click)="rotate(-1)" [disabled]="!loaded"
                class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-[#193629] hover:text-[#193629] disabled:opacity-40">
                ⟲ Rotate left
              </button>
  
              <button type="button" (click)="rotate(1)" [disabled]="!loaded"
                class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-[#193629] hover:text-[#193629] disabled:opacity-40">
                ⟳ Rotate right
              </button>
  
              <button type="button" (click)="resetView()" [disabled]="!loaded"
                class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-[#193629] hover:text-[#193629] disabled:opacity-40">
                Reset
              </button>
  
            </div>
  
            <p class="mt-3 text-center text-xs text-gray-400">
              Drag to reposition · use the  mouse wheel to zoom
            </p>
  
            }
  
          </div>
  
  
          <!-- Footer -->
          <div class="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
  
            <button type="button" (click)="cancel()"
              class="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
  
            <button type="button" (click)="apply()" [disabled]="!loaded || loadError"
              class="rounded-lg bg-[#193629] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#10261d] disabled:cursor-not-allowed disabled:opacity-50">
              Apply
            </button>
  
          </div>
  
        </div>
  
      </div>
    `
  })
  export class ImageCropperComponent implements OnChanges {
  
    @Input() src = '';
    @Input() title = 'Crop image';
    @Input() aspectRatio = 1;
    @Input() ratios: CropRatio[] = [];
    @Input() round = false;
    @Input() outputSize = 800;
    @Input() quality = 0.85;
    @Input() frameSize = 280;
  
    @Output() cropped = new EventEmitter<string>();
    @Output() cancelled = new EventEmitter<void>();
  
    readonly maxZoom = 4;
    readonly guides = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  
    currentSrc = '';
    loaded = false;
    loadError = false;
  
    natW = 0;
    natH = 0;
  
    zoom = 1;
    offsetX = 0;
    offsetY = 0;
  
    activeRatio = 1;
  
    private image?: HTMLImageElement;
    private dragging = false;
    private lastX = 0;
    private lastY = 0;
  
    ngOnChanges(changes: SimpleChanges): void {
  
      if (changes['aspectRatio']) {
        this.activeRatio = this.aspectRatio;
      }
  
      if (changes['src']) {
        this.load(this.src);
      }
    }
  
    @HostListener('document:keydown.escape')
    onEscape(): void {
      this.cancel();
    }
  
    // ---------- Geometry ----------
  
    get frameW(): number {
      return this.activeRatio >= 1 ? this.frameSize : this.frameSize * this.activeRatio;
    }
  
    get frameH(): number {
      return this.activeRatio >= 1 ? this.frameSize / this.activeRatio : this.frameSize;
    }
  
    /** The visible crop "stage" is deliberately bigger than the crop
     *  frame itself — that extra space is where the dimmed, excluded
     *  part of the photo shows through, which is the whole point of the
     *  WhatsApp-style spotlight effect. 1.35x gave a good amount of
     *  visible context without making the modal too tall on mobile. */
    get stageW(): number {
      return this.frameW * 1.35;
    }
  
    get stageH(): number {
      return this.frameH * 1.35;
    }
  
    // Scale at which the image exactly covers the CROP FRAME (not the
    // stage) — this is what's actually being captured, so "zoom = 1"
    // should mean "the frame is exactly filled", same as before.
    private get baseScale(): number {
      return this.loaded
        ? Math.max(this.frameW / this.natW, this.frameH / this.natH)
        : 1;
    }
  
    private get scale(): number {
      return this.baseScale * this.zoom;
    }
  
    get imageTransform(): string {
      return `translate(-50%, -50%) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    }
  
    // Keep the image covering the FRAME (no empty edges inside the crop
    // area) — the stage is allowed to show image edges running out,
    // since that part is just dimmed context, not part of the crop.
    private clampOffsets(): void {
  
      const maxX = Math.max(0, (this.natW * this.scale - this.frameW) / 2);
      const maxY = Math.max(0, (this.natH * this.scale - this.frameH) / 2);
  
      this.offsetX = Math.min(maxX, Math.max(-maxX, this.offsetX));
      this.offsetY = Math.min(maxY, Math.max(-maxY, this.offsetY));
    }
  
    // ---------- Loading ----------
  
    private load(src: string): void {
  
      this.currentSrc = src;
      this.loaded = false;
      this.loadError = false;
  
      if (!src) {
        this.loadError = true;
        return;
      }
  
      const img = new Image();
  
      // Lets canvas export work for remote images that allow CORS.
      img.crossOrigin = 'anonymous';
  
      img.onload = () => {
        this.image = img;
        this.natW = img.naturalWidth;
        this.natH = img.naturalHeight;
        this.resetView();
        this.loaded = true;
      };
  
      img.onerror = () => {
        this.loadError = true;
      };
  
      img.src = src;
    }
  
    // ---------- Controls ----------
  
    resetView(): void {
      this.zoom = 1;
      this.offsetX = 0;
      this.offsetY = 0;
    }
  
    setRatio(value: number): void {
      this.activeRatio = value;
      this.resetView();
    }
  
    onZoom(value: number): void {
      this.zoom = Math.min(this.maxZoom, Math.max(1, value));
      this.clampOffsets();
    }
  
    onWheel(event: WheelEvent): void {
      event.preventDefault();
      this.onZoom(this.zoom - event.deltaY * 0.002);
    }
  
    startDrag(event: PointerEvent): void {
      this.dragging = true;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }
  
    drag(event: PointerEvent): void {
  
      if (!this.dragging) {
        return;
      }
  
      this.offsetX += event.clientX - this.lastX;
      this.offsetY += event.clientY - this.lastY;
  
      this.lastX = event.clientX;
      this.lastY = event.clientY;
  
      this.clampOffsets();
    }
  
    endDrag(event: PointerEvent): void {
      this.dragging = false;
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    }
  
    // Rotates the picture itself by 90° and reloads it
    rotate(direction: 1 | -1): void {
  
      if (!this.image) {
        return;
      }
  
      const canvas = document.createElement('canvas');
      canvas.width = this.natH;
      canvas.height = this.natW;
  
      const ctx = canvas.getContext('2d');
  
      if (!ctx) {
        return;
      }
  
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((direction * Math.PI) / 2);
      ctx.drawImage(this.image, -this.natW / 2, -this.natH / 2);
  
      this.load(canvas.toDataURL('image/jpeg', 0.92));
    }
  
    cancel(): void {
      this.cancelled.emit();
    }
  
    // Crops exactly what is visible inside the frame
    apply(): void {
  
      if (!this.image || !this.loaded) {
        return;
      }
  
      const scale = this.scale;
  
      // Visible area in the original image's pixels
      const sw = this.frameW / scale;
      const sh = this.frameH / scale;
      const sx = this.natW / 2 - this.offsetX / scale - sw / 2;
      const sy = this.natH / 2 - this.offsetY / scale - sh / 2;
  
      const outW = this.activeRatio >= 1
        ? this.outputSize
        : Math.round(this.outputSize * this.activeRatio);
  
      const outH = this.activeRatio >= 1
        ? Math.round(this.outputSize / this.activeRatio)
        : this.outputSize;
  
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
  
      const ctx = canvas.getContext('2d');
  
      if (!ctx) {
        return;
      }
  
      // White background so transparent images don't turn black as JPEG
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outW, outH);
      ctx.drawImage(this.image, sx, sy, sw, sh, 0, 0, outW, outH);
  
      try {
        this.cropped.emit(canvas.toDataURL('image/jpeg', this.quality));
      } catch {
        // Happens if a remote image does not allow canvas export (CORS)
        this.loadError = true;
      }
    }
  }