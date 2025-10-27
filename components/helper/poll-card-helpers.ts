/**
 * Calculate percentage of votes for an option
 */
export const getPercentage = (voteCount: number, totalVotes: number): number => {
  if (totalVotes === 0) return 0;
  return Math.round((voteCount / totalVotes) * 100);
};

/**
 * Calculate total votes from poll options
 */
export const getTotalVotes = (options: { votes: number }[]): number => {
  return options?.reduce((sum, opt) => sum + opt.votes, 0) || 0;
};

/**
 * Format date string to relative time
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

/**
 * Format vote count with singular/plural handling
 */
export const formatVoteCount = (votes: number): string => {
  return `${votes} ${votes === 1 ? 'vote' : 'votes'}`;
};

/**
 * Check if poll options have changed by comparing UUID and votes
 */
export const hasOptionsChanged = (
  currentOptions: { uuid: string; votes: number }[] | undefined,
  previousOptions: { uuid: string; votes: number }[] | undefined
): boolean => {
  if (!currentOptions || !previousOptions) return false;
  
  const currentString = JSON.stringify(currentOptions.map(o => ({ uuid: o.uuid, votes: o.votes })));
  const previousString = JSON.stringify(previousOptions.map(o => ({ uuid: o.uuid, votes: o.votes })));
  
  return currentString !== previousString;
};

