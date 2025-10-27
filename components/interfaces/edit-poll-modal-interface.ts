import { Poll } from '@/application-shared/interfaces/polls-interface';

export interface EditPollModalProps {
  poll: Poll;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPollUpdated: (poll: Poll) => void;
}

