import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html'
})
export class ConfirmDialogComponent {

  dialogService = inject(ConfirmDialogService);

  confirm(): void {
    this.dialogService.respond(true);
  }

  cancel(): void {
    this.dialogService.respond(false);
  }
}
