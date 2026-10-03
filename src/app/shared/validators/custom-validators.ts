import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Name must be 2-50 chars, letters/spaces/apostrophes/hyphens only,
 * and cannot be only whitespace.
 */
export const NAME_PATTERN = /^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$/;

/**
 * Strong password: min 8 chars, at least one lowercase, one uppercase,
 * one digit, and one special character.
 */
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/])[A-Za-z\d@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/]{8,}$/;

export const PHONE_PATTERN = /^[6-9][0-9]{9}$/;

export const PINCODE_PATTERN = /^[0-9]{6}$/;

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