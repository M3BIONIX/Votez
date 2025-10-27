export type AuthMode = 'login' | 'register';

export const AUTH_MODE = {
  LOGIN: 'login' as const,
  REGISTER: 'register' as const,
} as const;

export const AUTH_MODE_DEFAULT = AUTH_MODE.LOGIN;

