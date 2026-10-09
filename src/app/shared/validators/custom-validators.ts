import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const NAME_PATTERN = /^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$/;

export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/])[A-Za-z\d@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/]{8,}$/;

export const PHONE_PATTERN = /^[6-9][0-9]{9}$/;

export const PINCODE_PATTERN = /^[0-9]{6}$/;

/**
 * Stricter than Angular's built-in Validators.email, which accepts
 * addresses like "--@gmail.com" or "a..b@x.com".
 *
 * Rules:
 *  - the part before @ must start and end with a letter or number
 *    (dots, underscores, hyphens and + are allowed only BETWEEN them,
 *    and never twice in a row)
 *  - the domain must have real labels (letters, numbers, inner hyphens)
 *  - the ending (like .com) must be at least 2 letters
 *
 * It returns the same error key as Validators.email ({ email: true }),
 * so templates that check hasError('email') keep working unchanged.
 */
const EMAIL_REGEX =
  /^[a-z0-9]+(?:[._+-][a-z0-9]+)*@[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*\.[a-z]{2,}$/i;

export const strictEmailValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {

  const value = String(control.value ?? '').trim();

  // An empty value is handled by Validators.required
  if (!value) {
    return null;
  }

  const localPart = value.split('@')[0];

  if (value.length > 254 || localPart.length > 64) {
    return { email: true };
  }

  return EMAIL_REGEX.test(value) ? null : { email: true };
};

export function passwordsMatchValidator(passwordKey: string, confirmKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {

    const password = group.get(passwordKey)?.value;
    const confirm = group.get(confirmKey)?.value;

    if (!password || !confirm) {
      return null;
    }

    return password === confirm ? null : { passwordMismatch: true };
  };
}

/**
 * Returns a human readable list of which password rules are still failing,
 * useful for showing a live checklist under the password field.
 */
export function passwordRuleStatus(value: string | null | undefined) {

  const v = value ?? '';

  return {
    minLength: v.length >= 8,
    lowercase: /[a-z]/.test(v),
    uppercase: /[A-Z]/.test(v),
    digit: /\d/.test(v),
    special: /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/]/.test(v)
  };
}
export const PRODUCT_TEXT_PATTERN = /^(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9 '&.,:;()\-]{1,99}$/;
export const IMAGE_URL_PATTERN =/^(https?:\/\/).+\.(jpg|jpeg|png|webp)(\?.*)?$/i;
export function priceLessThanMrpValidator(
  priceKey: string,
  mrpKey: string
): ValidatorFn {

  return (group: AbstractControl): ValidationErrors | null => {

    const price = group.get(priceKey)?.value;
    const mrp = group.get(mrpKey)?.value;

    if (price == null || mrp == null || price === '' || mrp === '') {
      return null;
    }

    return Number(price) <= Number(mrp)
      ? null
      : { priceGreaterThanMrp: true };
  };
}
export function atLeastOneImageValidator(
  control: AbstractControl
): ValidationErrors | null {

  const images = control.value;

  if (!Array.isArray(images) || images.length === 0) {
    return { imageRequired: true };
  }

  return null;
}