export function normalizeCategory(value: string | null | undefined): string {
    return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  