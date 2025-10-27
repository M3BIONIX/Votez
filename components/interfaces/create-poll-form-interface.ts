import { Poll } from '@/application-shared/interfaces/polls-interface';

export interface CreatePollFormProps {
  onPollCreated: (poll: Poll) => void;
}

