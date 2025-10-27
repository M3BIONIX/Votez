import { AuthMode } from '../constants/auth-mode-constants';

export interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: AuthMode;
}

