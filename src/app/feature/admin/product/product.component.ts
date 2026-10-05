import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/Models/Product.model';
import { priceLessThanMrpValidator, PRODUCT_TEXT_PATTERN } from '../../../shared/validators/custom-validators';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { PaginationComponent, paginate } from '../../../shared/components/pagination/pagination.component';
import { ActivatedRoute, Router } from '@angular/router';



@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaginationComponent
  ],
  templateUrl: './product.component.html'
})
export class AdminProductsComponent implements OnInit {

  private productService = inject(ProductService);
  private confirmDialog = inject(ConfirmDialogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  products: Product[] = [];

  // Pagination
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

  // Image upload
  imageError = '';
  private readonly MAX_IMAGES = 6;
  private readonly MAX_FILE_SIZE_MB = 5;
  private readonly MAX_IMAGE_DIMENSION = 800;

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
  
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        mode: 'edit',
        id: product.id
      }
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  
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

  loadProducts(): void {
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

        const deleteId = Number(
          this.route.snapshot.queryParams['delete']
        );
        
        if (deleteId) {
          const product = this.products.find(
            p => p.id === deleteId
          );
        
          if (product) {
            this.deleteProduct(product);
          }
        }
  
        this.loading = false;
  
        const mode = this.route.snapshot.queryParams['mode'];
        const id = Number(this.route.snapshot.queryParams['id']);
  
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

  openAddForm(): void {
  this.editingProduct = null;
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

  }
  // Called when the admin selects image file(s) from the computer
  async onFilesSelected(event: Event): Promise<void> {

    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) {
      return;
    }

    this.imageError = '';

    const images = [...(this.productForm.controls.images.value ?? [])];

    for (const file of files) {

      if (images.length >= this.MAX_IMAGES) {
        this.imageError = `You can add up to ${this.MAX_IMAGES} images.`;
        break;
      }

      if (!file.type.startsWith('image/')) {
        this.imageError = `"${file.name}" is not an image file.`;
        continue;
      }

      if (file.size > this.MAX_FILE_SIZE_MB * 1024 * 1024) {
        this.imageError = `"${file.name}" is larger than ${this.MAX_FILE_SIZE_MB} MB.`;
        continue;
      }

      try {
        const dataUrl = await this.readAndResizeImage(file);

        if (!images.includes(dataUrl)) {
          images.push(dataUrl);
        }
      } catch {
        this.imageError = `Unable to read "${file.name}".`;
      }
    }

    this.productForm.controls.images.setValue(images);
    this.productForm.controls.images.markAsTouched();

    // Reset so the same file can be selected again later
    input.value = '';
  }

  // Reads the file, shrinks large images and returns a compact base64 string
  private readAndResizeImage(file: File): Promise<string> {

    return new Promise((resolve, reject) => {

      const reader = new FileReader();

      reader.onerror = () => reject(new Error('read failed'));

      reader.onload = () => {

        const img = new Image();

        img.onerror = () => reject(new Error('invalid image'));

        img.onload = () => {

          const scale = Math.min(
            1,
            this.MAX_IMAGE_DIMENSION / Math.max(img.width, img.height)
          );

          const width = Math.round(img.width * scale);
          const height = Math.round(img.height * scale);

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('canvas unavailable'));
            return;
          }

          // White background so transparent PNGs don't turn black as JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };

        img.src = reader.result as string;
      };

      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {

    const images = this.productForm.controls.images.value ?? [];
  
    images.splice(index, 1);
  
    this.productForm.controls.images.setValue([...images]);
  
    this.productForm.controls.images.markAsTouched();
  }

  saveProduct(): void {

    if (this.productForm.invalid) {

      this.productForm.markAllAsTouched();

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
      createdAt: this.editingProduct?.createdAt ?? new Date().toISOString()
    };

    if (this.editingProduct) {

      this.productService
        .updateProduct(this.editingProduct.id, productData)
        .subscribe({

          next: () => {

            this.submitting = false;
            this.closeForm();
            this.loadProducts();

          },

          error: () => {

            this.submitting = false;
            this.error = 'Unable to update product.';

          }

        });

    } else {

      this.productService
        .addProduct(productData)
        .subscribe({

          next: () => {

            this.submitting = false;
            this.closeForm();

            // New products appear first (newest first), so go to page 1.
            this.page = 1;
            this.loadProducts();

          },

          error: () => {

            this.submitting = false;
            this.error = 'Unable to add product.';

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
        this.clearDeleteQueryParam();
        this.loadProducts();
      },
      error: () => {
        this.error = 'Unable to delete product.';
        this.clearDeleteQueryParam();
      }
    });
  }
}