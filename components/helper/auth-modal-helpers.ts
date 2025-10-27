import { EMAIL_REGEX, PASSWORD_REGEX } from '@/application-shared/constants/regex-constants';
import { MIN_PASSWORD_LENGTH, PASSWORD_MESSAGES } from '@/application-shared/constants/validator-constants';

export interface PasswordRequirements {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

/**
 * Calculate password requirements based on password input
 */
export const calculatePasswordRequirements = (newPassword: string): PasswordRequirements => {
  return {
    length: newPassword.length >= MIN_PASSWORD_LENGTH,
    uppercase: PASSWORD_REGEX.UPPERCASE.test(newPassword),
    lowercase: PASSWORD_REGEX.LOWERCASE.test(newPassword),
    number: PASSWORD_REGEX.NUMBER.test(newPassword),
    special: PASSWORD_REGEX.SPECIAL.test(newPassword),
  };
};

/**
 * Check if all password requirements are met
 */
export const isPasswordValid = (requirements: PasswordRequirements): boolean => {
  return (
    requirements.length &&
    requirements.uppercase &&
    requirements.lowercase &&
    requirements.number &&
    requirements.special
  );
};

/**
 * Validate password and return validation result with message
 */
export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, message: PASSWORD_MESSAGES.LENGTH };
  }
  if (!PASSWORD_REGEX.UPPERCASE.test(password)) {
    return { valid: false, message: PASSWORD_MESSAGES.UPPERCASE };
  }
  if (!PASSWORD_REGEX.LOWERCASE.test(password)) {
    return { valid: false, message: PASSWORD_MESSAGES.LOWERCASE };
  }
  if (!PASSWORD_REGEX.NUMBER.test(password)) {
    return { valid: false, message: PASSWORD_MESSAGES.NUMBER };
  }
  if (!PASSWORD_REGEX.SPECIAL.test(password)) {
    return { valid: false, message: PASSWORD_MESSAGES.SPECIAL };
  }
  return { valid: true, message: '' };
};

/**
 * Reset password requirements to initial state
 */
export const getInitialPasswordRequirements = (): PasswordRequirements => ({
  length: false,
  uppercase: false,
  lowercase: false,
  number: false,
  special: false,
});

