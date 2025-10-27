'use client';

import { PollCard } from './poll-card';
import {PollListProps} from "@/application-shared/interfaces/polls-interface";

export function PollList({ polls }: Omit<PollListProps, 'onPollUpdated'>) {
  return (
    <div className="space-y-6">
      {polls.map((poll) => (
        <PollCard key={poll.uuid} poll={poll} />
      ))}
    </div>
  );
}
