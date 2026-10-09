import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormControl,FormGroup,ReactiveFormsModule,Validators} from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/Models/Product.model';
import { priceLessThanMrpValidator, PRODUCT_TEXT_PATTERN } from '../../../shared/validators/custom-validators';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PaginationComponent, paginate } from '../../../shared/components/pagination/pagination.component';
import {ImageCropperComponent,CropRatio,fileToDataUrl,validateImageFile} from '../../../shared/components/image-cropper/image-cropper';
import { ActivatedRoute, Router } from '@angular/router';


type ProductWithOriginals = Product & { originalImages?: string[] };

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaginationComponent,
    ImageCropperComponent
  ],
  templateUrl: './product.component.html'
})
export class AdminProductsComponent implements OnInit {

  private productService = inject(ProductService);
  private confirmDialog = inject(ConfirmDialogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  products: Product[] = [];

  
  page = 1;
  pageSize = 10;

  loading = false;
  submitting = false;
  error = '';

  showForm = false;
  editingProduct: Product | null = null;

  // View details modal
  selectedProduct: Product | null = null;
  selectedImageIndex = 0;

  // Image upload + crop
  imageError = '';
  cropSource: string | null = null;

  readonly coverRatios: CropRatio[] = [
    { label: 'Cover 2:3', value: 2 / 3 },
    { label: 'Square', value: 1 },
    { label: 'Wide 4:3', value: 4 / 3 }
  ];

  private readonly MAX_IMAGES = 6;
  private readonly MAX_FILE_SIZE_MB = 5;
  private cropQueue: File[] = [];
  private editingImageIndex: number | null = null;

  // The full, uncropped version of each image (same order as the images).
  // '' means "no separate original" (the image itself is the original).
  private originals: string[] = [];
  private pendingOriginal = '';
  private readonly MAX_ORIGINAL_DIMENSION = 1200;

  productForm = new FormGroup(
    {
      title: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        Validators.pattern(PRODUCT_TEXT_PATTERN)
      ]),

      author: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        Validators.pattern(PRODUCT_TEXT_PATTERN)
      ]),

      price: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(1)
      ]),

      mrp: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(1)
      ]),

      category: new FormControl('', [
        Validators.required
      ]),

      genre: new FormControl('', [
        Validators.required
      ]),

      rating: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(0),
        Validators.max(5)
      ]),

      reviewCount: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(0)
      ]),

      publisher: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        Validators.pattern(PRODUCT_TEXT_PATTERN)
      ]),

      language: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(PRODUCT_TEXT_PATTERN)
      ]),

      pages: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(1)
      ]),

      description: new FormControl('', [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(2000)
      ]),

      stock: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(0)
      ]),

      images: new FormControl<string[]>([], [
        Validators.required
      ])
    },
    {
      validators: priceLessThanMrpValidator('price', 'mrp')
    }
  );

  // Only the products for the current page
  get pagedProducts(): Product[] {
    return paginate(this.products, this.page, this.pageSize).items;
  }

  // Open the details modal
  viewProduct(product: Product): void {
    this.selectedProduct = product;
    this.selectedImageIndex = 0;
  }

  // Close the details modal
  closeView(): void {
    this.selectedProduct = null;
    this.selectedImageIndex = 0;
  }

  // Discount percentage between MRP and selling price
  getDiscount(product: Product): number {
    if (!product.mrp || product.mrp <= product.price) {
      return 0;
    }

    return Math.round(((product.mrp - product.price) / product.mrp) * 100);
  }

  editProduct(product: Product): void {
    this.editingProduct = product;
    this.showForm = true;
  
    this.productForm.patchValue({
      title: product.title,
      author: product.author,
      price: product.price,
      mrp: product.mrp,
      category: product.category,
      genre: product.genre.join(', '),
      rating: product.rating,
      reviewCount: product.reviewCount,
      publisher: product.publisher,
      language: product.language,
      pages: product.pages,
      description: product.description,
      stock: product.stock,
      images: [...product.images]
    });

    // Load the saved full-size originals
    const savedOriginals = (product as ProductWithOriginals).originalImages ?? [];
    this.originals = product.images.map((_, i) => savedOriginals[i] ?? '');
  
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        mode: 'edit',
        id: product.id
      }
    });
  }

  ngOnInit(): void {
    this.loadProducts(true);
  
    this.route.queryParams.subscribe(params => {
      const mode = params['mode'];
      const id = Number(params['id']);
  
      if (mode === 'add') {
        this.showForm = true;
        this.editingProduct = null;
        return;
      }
  
      if (mode === 'edit' && id) {
        const product = this.products.find(p => p.id === id);
  
        if (product) {
          this.editProduct(product);
        }
      }
    });
  }

  loadProducts(openFromUrl = false): void {
    this.loading = true;
    this.error = '';
  
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );

        // If items were deleted and the current page no longer exists,
        // move back to the last available page.
        const totalPages = Math.max(1, Math.ceil(this.products.length / this.pageSize));

        if (this.page > totalPages) {
          this.page = totalPages;
        }

        const deleteId = openFromUrl
          ? Number(this.route.snapshot.queryParams['delete'])
          : 0;
        
        if (deleteId) {
          const product = this.products.find(
            p => p.id === deleteId
          );
        
          if (product) {
            this.deleteProduct(product);
          }
        }
  
        this.loading = false;
  
        const mode = openFromUrl ? this.route.snapshot.queryParams['mode'] : null;
        const id = openFromUrl ? Number(this.route.snapshot.queryParams['id']) : 0;
  //page refresh Reopen the edit form.
        if (mode === 'edit' && id) {
          const product = this.products.find(p => p.id === id);
  
          if (product) {
            this.editProduct(product);
          }
        }
      },
      error: () => {
        this.error = 'Unable to load products.';
        this.loading = false;
      }
    });
  }

  //product+++

  openAddForm(): void {
  this.editingProduct = null;
  this.originals = [];
  this.productForm.reset({
    title: '',
    author: '',
    price: null,
    mrp: null,
    category: '',
    genre: '',
    rating: null,
    reviewCount: null,
    publisher: '',
    language: '',
    pages: null,
    description: '',
    stock: null,
    images: []
  });

  this.showForm = true;

  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: {
      mode: 'add'
    }
  });
}

  closeForm(): void {

    this.showForm = false;
    this.editingProduct = null;
    this.productForm.reset();
    this.error = '';
    this.imageError = '';
    this.originals = [];
    this.onCropCancelled();

    // Remove ?mode=...&id=... from the URL so the edit form does not open again
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: null, id: null },
      queryParamsHandling: 'merge'
    });

  }
  // Called when the admin selects image file(s) from the computer.
  // Each valid file is opened in the cropper, one after another.
  async onFilesSelected(event: Event): Promise<void> {

    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    // Reset so the same file can be selected again later
    input.value = '';

    if (files.length === 0) {
      return;
    }

    this.imageError = '';

    const currentCount = (this.productForm.controls.images.value ?? []).length;
    const accepted: File[] = [];

    for (const file of files) {

      const problem = validateImageFile(file, this.MAX_FILE_SIZE_MB);

      if (problem) {
        this.imageError = problem;
        continue;
      }

      if (currentCount + accepted.length >= this.MAX_IMAGES) {
        this.imageError = `You can add up to ${this.MAX_IMAGES} images.`;
        break;
      }

      accepted.push(file);
    }

    this.cropQueue = accepted;
    this.editingImageIndex = null;

    await this.openNextCrop();
  }
//crop image queue
  private async openNextCrop(): Promise<void> {

    const file = this.cropQueue.shift();

    if (!file) {
      this.cropSource = null;
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);

      // Keep the whole picture (only shrunk if huge) as the "original"
      this.pendingOriginal = await this.downscale(dataUrl, this.MAX_ORIGINAL_DIMENSION);
      this.cropSource = this.pendingOriginal;
    } catch {
      this.imageError = `Unable to read "${file.name}".`;
      await this.openNextCrop();
    }
  }

  // Re-open an already added image in the cropper.
  // It opens the FULL original picture, so the admin can crop it again from scratch.
  async editImage(index: number): Promise<void> {

    const image = (this.productForm.controls.images.value ?? [])[index];

    if (!image) {
      return;
    }

    this.imageError = '';
    this.cropQueue = [];
    this.editingImageIndex = index;

    // Prefer the saved full original; fall back to the current image
    const source = this.originals[index] || image;

    // Uploaded image (base64) -> open directly
    if (source.startsWith('data:')) {
      this.pendingOriginal = source;
      this.cropSource = source;
      return;
    }

    // Existing image link: download it and convert it to base64 so the
    // browser allows cropping it (needs same-site files or a server with CORS).
    try {

      const response = await fetch(source);

      if (!response.ok) {
        throw new Error('download failed');
      }

      const blob = await response.blob();

      const dataUrl = await fileToDataUrl(
        new File([blob], 'product-image', { type: blob.type || 'image/jpeg' })
      );

      this.pendingOriginal = await this.downscale(dataUrl, this.MAX_ORIGINAL_DIMENSION);
      this.cropSource = this.pendingOriginal;

    } catch {

      // Last attempt: let the cropper try to load the link directly.
      // If the image host blocks it, the cropper shows a "could not be loaded" message.
      this.pendingOriginal = source;
      this.cropSource = source;
    }
  }

  // Cropper finished: add the new image, or replace the edited one
  async onCropApplied(dataUrl: string): Promise<void> {

    const images = [...(this.productForm.controls.images.value ?? [])];

    if (this.editingImageIndex !== null) {
      //Replace that image with the newly cropped version
      images[this.editingImageIndex] = dataUrl;
      this.originals[this.editingImageIndex] = this.pendingOriginal;
      this.editingImageIndex = null;
    } else if (!images.includes(dataUrl) && images.length < this.MAX_IMAGES) {
      images.push(dataUrl);
      this.originals.push(this.pendingOriginal);
    }

    this.productForm.controls.images.setValue(images);
    this.productForm.controls.images.markAsTouched();

    this.cropSource = null;

    await this.openNextCrop();
  }

  onCropCancelled(): void {
    this.cropSource = null;
    this.cropQueue = [];
    this.editingImageIndex = null;
  }

  // Shrinks very large photos (keeping the WHOLE picture) so the stored
  // original stays a reasonable size.
  private downscale(dataUrl: string, maxDimension: number): Promise<string> {

    return new Promise((resolve) => {

      const img = new Image();

      img.onload = () => {

        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));

        if (scale === 1) {
          resolve(dataUrl);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = () => resolve(dataUrl);

      img.src = dataUrl;
    });
  }

  removeImage(index: number): void {

    const images = this.productForm.controls.images.value ?? [];
  
    images.splice(index, 1);
    this.originals.splice(index, 1);
  
    this.productForm.controls.images.setValue([...images]);
  
    this.productForm.controls.images.markAsTouched();
  }

  saveProduct(): void {

    if (this.productForm.invalid) {

      this.productForm.markAllAsTouched();
      this.toast.warning('Please fix the highlighted fields before saving.');

      return;
    }

    this.submitting = true;
    this.error = '';

    const value = this.productForm.getRawValue();

    const productData = {
      title: value.title!,
      author: value.author!,
      price: value.price!,
      mrp: value.mrp!,
      category: value.category!,
      genre: value.genre!
        .split(',')
        .map(genre => genre.trim())
        .filter(Boolean),
      rating: value.rating!,
      reviewCount: value.reviewCount!,
      publisher: value.publisher!,
      language: value.language!,
      pages: value.pages!,
      description: value.description!,
      stock: value.stock!,
      images: value.images!,
      originalImages: (value.images ?? []).map((_, i) => this.originals[i] ?? ''),
      createdAt: this.editingProduct?.createdAt ?? new Date().toISOString()
    };

    if (this.editingProduct) {

      this.productService
        .updateProduct(this.editingProduct.id, productData)
        .subscribe({

          next: () => {

            this.submitting = false;
            this.toast.success(`"${productData.title}" updated successfully.`);
            this.closeForm();
            this.loadProducts();

          },

          error: () => {

            this.submitting = false;
            this.error = 'Unable to update product.';
            this.toast.error('Unable to update product. Please try again.');

          }

        });

    } else {

      this.productService
        .addProduct(productData)
        .subscribe({

          next: () => {

            this.submitting = false;
            this.closeForm();

            this.toast.success(`"${productData.title}" added successfully.`);

            // New products appear first (newest first), so go to page 1.
            this.page = 1;
            this.loadProducts();

          },

          error: () => {

            this.submitting = false;
            this.error = 'Unable to add product.';
            this.toast.error('Unable to add product. Please try again.');

          }

        });
    }
  }
  clearDeleteQueryParam(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        delete: null
      },
      queryParamsHandling: 'merge'
    });
  }
  async deleteProduct(product: Product): Promise<void> {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        delete: product.id
      }
    });
  
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true
    });
  
    if (!confirmed) {
      this.clearDeleteQueryParam();
      return;
    }
  
    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.toast.success(`"${product.title}" deleted successfully.`);
        this.clearDeleteQueryParam();
        this.loadProducts();
      },
      error: () => {
        this.error = 'Unable to delete product.';
        this.toast.error('Unable to delete product. Please try again.');
        this.clearDeleteQueryParam();
      }
    });
  }
}