import { Component, inject } from '@angular/core';
import {Router,RouterLink,RouterLinkActive,RouterOutlet} from '@angular/router';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ToastComponent
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {

  private authService = inject(AuthService); 
  private router = inject(Router);
   private confirmDialog = inject(ConfirmDialogService); 
   async logout(): Promise<void> { 
    const confirmed = await this.confirmDialog.confirm({
       title: 'Admin Logout', 
       message: 'Are you sure you want to log out of the admin panel?',
        confirmText: 'Log Out', 
        cancelText: 'Cancel'
       }); 
       if (!confirmed) { 
        return; 
      } 
      this.authService.logout();
       await this.router.navigate(['/login']); }
}