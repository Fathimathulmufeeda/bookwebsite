import { Injectable, signal } from '@angular/core';

export interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
  resolve?: (value: boolean) => void;
}

const CLOSED_STATE: ConfirmState = {
  open: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  danger: false
};

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {

  readonly state = signal<ConfirmState>(CLOSED_STATE);

  confirm(options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }): Promise<boolean> {

    return new Promise<boolean>(resolve => {

      this.state.set({
        open: true,
        title: options.title ?? 'Are you sure?',
        message: options.message,
        confirmText: options.confirmText ?? 'Confirm',
        cancelText: options.cancelText ?? 'Cancel',
        danger: options.danger ?? false,
        resolve
      });

    });
  }

  respond(result: boolean): void {

    const current = this.state();

    current.resolve?.(result);

    this.state.set(CLOSED_STATE);
  }
}
