'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-store';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MIN_PASSWORD_LENGTH } from '@/application-shared/constants/validator-constants';
import { TOAST_MESSAGES } from '@/application-shared/constants/toaster-constants';
import { AUTH_MODE, AUTH_MODE_DEFAULT, type AuthMode } from './constants/auth-mode-constants';
import {
  validateEmail,
  calculatePasswordRequirements,
  isPasswordValid as isValidPassword,
  validatePassword,
  getInitialPasswordRequirements,
  type PasswordRequirements,
} from './helper/auth-modal-helpers';
import { AuthModalProps } from './interfaces/auth-modal-interface';

export function AuthModal({ open, onOpenChange, defaultMode = AUTH_MODE_DEFAULT }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const { login, register } = useAuth();

  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>(getInitialPasswordRequirements());

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    
    if (mode === AUTH_MODE.REGISTER) {
      setPasswordRequirements(calculatePasswordRequirements(newPassword));
    }
  };

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    if (emailTouched && !validateEmail(newEmail)) {
      setEmailError(true);
    } else {
      setEmailError(false);
    }
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    if (email && !validateEmail(email)) {
      setEmailError(true);
    } else {
      setEmailError(false);
    }
  };

  const isPasswordValid = mode === AUTH_MODE.LOGIN || isValidPassword(passwordRequirements);
  const isEmailValid = !emailTouched || validateEmail(email);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEmailValid) {
      setEmailTouched(true);
      setEmailError(true);
      toast.error(TOAST_MESSAGES.AUTH.INVALID_EMAIL);
      return;
    }

    if (mode === AUTH_MODE.REGISTER && !isPasswordValid) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        toast.error(passwordValidation.message);
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === AUTH_MODE.LOGIN) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      onOpenChange(false);
      setEmail('');
      setPassword('');
      setName('');
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === AUTH_MODE.LOGIN ? AUTH_MODE.REGISTER : AUTH_MODE.LOGIN);
    setEmail('');
    setPassword('');
    setName('');
    setEmailError(false);
    setEmailTouched(false);
    setPasswordRequirements(getInitialPasswordRequirements());
  };

  const isSubmitDisabled = loading || (mode === AUTH_MODE.REGISTER && (!isEmailValid || !isPasswordValid));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {mode === AUTH_MODE.LOGIN ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
          <DialogDescription>
            {mode === AUTH_MODE.LOGIN
              ? 'Login to vote, like, and create polls'
              : 'Sign up to get started with polls'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === AUTH_MODE.REGISTER && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                minLength={1}
                maxLength={50}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={handleEmailBlur}
              required
              disabled={loading}
              className={emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            />
            {emailError && emailTouched && (
              <p className="text-xs text-red-500">Please enter a valid email address</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
              disabled={loading}
              minLength={mode === AUTH_MODE.REGISTER ? MIN_PASSWORD_LENGTH : 1}
            />
            {mode === AUTH_MODE.REGISTER && (
              <div className="text-xs space-y-1">
                <p className="font-semibold text-slate-700 mb-1">Password must contain:</p>
                <ul className="space-y-0.5">
                  <li className={`flex items-center gap-2 ${passwordRequirements.length ? 'text-green-600' : 'text-slate-500'}`}>
                    <span>{passwordRequirements.length ? '✓' : '○'}</span>
                    <span>At least 8 characters</span>
                  </li>
                  <li className={`flex items-center gap-2 ${passwordRequirements.uppercase ? 'text-green-600' : 'text-slate-500'}`}>
                    <span>{passwordRequirements.uppercase ? '✓' : '○'}</span>
                    <span>One uppercase letter (A-Z)</span>
                  </li>
                  <li className={`flex items-center gap-2 ${passwordRequirements.lowercase ? 'text-green-600' : 'text-slate-500'}`}>
                    <span>{passwordRequirements.lowercase ? '✓' : '○'}</span>
                    <span>One lowercase letter (a-z)</span>
                  </li>
                  <li className={`flex items-center gap-2 ${passwordRequirements.number ? 'text-green-600' : 'text-slate-500'}`}>
                    <span>{passwordRequirements.number ? '✓' : '○'}</span>
                    <span>One number (0-9)</span>
                  </li>
                  <li className={`flex items-center gap-2 ${passwordRequirements.special ? 'text-green-600' : 'text-slate-500'}`}>
                    <span>{passwordRequirements.special ? '✓' : '○'}</span>
                    <span>One special character (!@#$%...)</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === AUTH_MODE.LOGIN ? 'Logging in...' : 'Creating account...'}
              </>
            ) : (
              mode === AUTH_MODE.LOGIN ? 'Log In' : 'Sign Up'
            )}
          </Button>

          <div className="text-center text-sm text-slate-600">
            {mode === AUTH_MODE.LOGIN ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                  disabled={loading}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                  disabled={loading}
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

