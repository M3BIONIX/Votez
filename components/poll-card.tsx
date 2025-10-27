'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, CheckCircle2, Users, Pencil, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PollCardProps } from "@/application-shared/interfaces/polls-interface";
import { useAuth } from '@/lib/auth-store';
import { usePollsStore } from '@/lib/stores/polls-store';
import { EditPollModal } from './edit-poll-modal';
import { AuthModal } from './auth-modal';
import { getPercentage, getTotalVotes, formatDate, formatVoteCount } from './helper/poll-card-helpers';
import { TOAST_MESSAGES } from '@/application-shared/constants/toaster-constants';

export function PollCard({ poll }: Omit<PollCardProps, 'onPollUpdated'>) {
  const { isAuthenticated, user } = useAuth();
  const { votePoll, likePoll } = usePollsStore();
  const [hasVoted, setHasVoted] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [votedOptionUuid, setVotedOptionUuid] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [optionsChanged, setOptionsChanged] = useState<'added' | 'deleted' | null>(null);

  // Find the voted option for this poll
  const votedPollInfo = useMemo(() => {
    if (!user || !user.voted_polls) return null;
    return user.voted_polls.find(v => v.poll_uuid === poll.uuid);
  }, [user, poll.uuid]);

  // Find the liked status for this poll
  const isLiked = useMemo(() => {
    if (!user || !user.liked_poll_uuids) return false;
    return user.liked_poll_uuids.includes(poll.uuid);
  }, [user, poll.uuid]);

  // Sync like state when user data changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setHasLiked(false);
      return;
    }
    setHasLiked(isLiked);
  }, [isAuthenticated, user?.uuid, poll.uuid, isLiked]);

  const handleVote = async (optionUuid: string) => {
    if (!isAuthenticated) {
      toast.error(TOAST_MESSAGES.AUTH.LOGIN_REQUIRED);
      setShowAuthModal(true);
      return;
    }
    if (hasVoted || isVoting) return;

    setIsVoting(true);

    try {
      await votePoll(poll.uuid, optionUuid);
      
      const option = poll.options?.find(opt => opt.uuid === optionUuid);
      if (option) {
        setHasVoted(true);
        setVotedOptionUuid(option.uuid);
        // Clear the options changed alert when voting
        setOptionsChanged(null);
      }
      
      toast.success(TOAST_MESSAGES.POLL.VOTE_SUCCESS);
    } catch (error: any) {
      if (error.message.includes('version')) {
        toast.error(TOAST_MESSAGES.POLL.VOTE_VERSION_CONFLICT);
      } else {
        toast.error(error.message || TOAST_MESSAGES.POLL.VOTE_FAILED);
      }
    } finally {
      setIsVoting(false);
    }
  };

  // Sync vote state when user data or voted option changes
  // Note: We intentionally don't include poll.options in dependencies to avoid
  // re-running when vote counts update via WebSocket
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setHasVoted(false);
      setVotedOptionUuid(null);
      return;
    }

    // Reset vote state based on user's voted polls from /auth/me API
    if (votedPollInfo) {
      // Check if the option still exists in the poll
      const option = poll.options?.find(opt => opt.uuid === votedPollInfo.option_uuid);
      if (option) {
        // User has voted and the option still exists - restore vote state
        console.log('Restoring vote state for option:', option.uuid);
        setHasVoted(true);
        setVotedOptionUuid(option.uuid);
      } else {
        // User voted but the option no longer exists (was deleted)
        // Treat as not voted so user can vote again
        console.log('User\'s voted option no longer exists, clearing vote state');
        setHasVoted(false);
        setVotedOptionUuid(null);
        // Show alert for deleted option
        setOptionsChanged('deleted');
      }
    } else {
      setHasVoted(false);
      setVotedOptionUuid(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uuid, poll.uuid, votedPollInfo?.option_uuid, isAuthenticated]);

  // Track option UUIDs to detect when options are added/deleted
  const prevOptionsCount = useRef(poll.options?.length || 0);
  
  useEffect(() => {
    const currentOptionsCount = poll.options?.length || 0;
    const optionsChanged = currentOptionsCount !== prevOptionsCount.current;
    
    if (optionsChanged && hasVoted) {
      console.log('Options count changed, detecting change type...');
      if (currentOptionsCount > prevOptionsCount.current) {
        console.log('Option was ADDED, showing alert');
        setOptionsChanged('added');
      } else if (currentOptionsCount < prevOptionsCount.current) {
        console.log('Option was DELETED, showing alert');
        setOptionsChanged('deleted');
      }
      // Clear vote state when options change
      setHasVoted(false);
      setVotedOptionUuid(null);
    }
    
    prevOptionsCount.current = currentOptionsCount;
  }, [poll.options?.length, hasVoted]);

  useEffect(() => {
    const handleOptionsChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Received pollOptionsChanged event:', customEvent.detail);
      if (customEvent.detail?.pollUuid === poll.uuid && hasVoted) {
        console.log('Event is for this poll and user voted, showing alert:', customEvent.detail.type);
        setOptionsChanged(customEvent.detail.type);
        // Clear vote state
        setHasVoted(false);
        setVotedOptionUuid(null);
      }
    };

    window.addEventListener('pollOptionsChanged', handleOptionsChanged);
    return () => {
      window.removeEventListener('pollOptionsChanged', handleOptionsChanged);
    };
  }, [poll.uuid, hasVoted]);

  // Debug logging
  useEffect(() => {
    console.log('Poll card state:', {
      pollUuid: poll.uuid,
      hasVoted,
      optionsChanged,
      votedOptionUuid,
      userVoted: !!votedPollInfo
    });
  }, [poll.uuid, hasVoted, optionsChanged, votedOptionUuid, votedPollInfo]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error(TOAST_MESSAGES.AUTH.LOGIN_REQUIRED_LIKE);
      setShowAuthModal(true);
      return;
    }
    if (isLiking) return;

    setIsLiking(true);

    try {
      // Optimistically update UI
      setHasLiked(!hasLiked);
      
      await likePoll(poll.uuid);

      // WebSocket will update the like status
      if (!hasLiked) {
        toast.success(TOAST_MESSAGES.POLL.LIKE_SUCCESS);
      } else {
        toast.success(TOAST_MESSAGES.POLL.LIKE_REMOVED);
      }
    } catch (error: any) {
      // Revert optimistic update on error
      setHasLiked(!hasLiked);
      toast.error(error.message || TOAST_MESSAGES.POLL.LIKE_FAILED);
    } finally {
      setIsLiking(false);
    }
  };

  const pollWithCreator = poll as any; // Using any to access created_by_uuid field
  const isOwner = isAuthenticated && user?.uuid && pollWithCreator?.created_by_uuid && 
    pollWithCreator.created_by_uuid === user.uuid;

  return (
    <>
      <Card className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                {poll.title || ''}
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditModalOpen(true)}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-blue-600"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </h3>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {getTotalVotes(poll.options || [])} votes
                </span>
                <span>{formatDate(poll.created_at || '')}</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={cn(
                'flex items-center gap-1 transition-all',
                hasLiked
                  ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                  : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
              )}
            >
              <Heart
                className={cn('w-5 h-5 transition-all', hasLiked && 'fill-current')}
              />
              <span className="font-semibold">{poll.likes}</span>
            </Button>
          </div>

          {/* Options Changed Alert */}
          {hasVoted && optionsChanged && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">
                    {optionsChanged === 'added' 
                      ? 'A new option was added to this poll' 
                      : 'An option you selected was deleted'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {optionsChanged === 'added' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs bg-white"
                          onClick={async () => {
                            // Retain previous selection
                            setIsVoting(true);
                            try {
                              if (votedPollInfo?.option_uuid) {
                                await votePoll(poll.uuid, votedPollInfo.option_uuid);
                                toast.success('Your previous selection has been retained');
                              }
                            } catch (error: any) {
                              toast.error(error.message || 'Failed to retain selection');
                            } finally {
                              setIsVoting(false);
                            }
                            setOptionsChanged(null);
                          }}
                        >
                          Retain My Selection
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => {
                            setOptionsChanged(null);
                          }}
                        >
                          Select New Option
                        </Button>
                      </>
                    )}
                    {optionsChanged === 'deleted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                        onClick={() => setOptionsChanged(null)}
                      >
                        Select a New Option
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {poll.options?.map((option) => {
              const totalVotes = getTotalVotes(poll.options || []);
              const percentage = getPercentage(option.votes, totalVotes);
              const isSelected = votedOptionUuid === option.uuid;

              return (
                <button
                  key={option.uuid}
                  onClick={() => handleVote(option.uuid)}
                  disabled={!optionsChanged && hasVoted || isVoting}
                  className={cn(
                    'w-full relative overflow-hidden rounded-lg border-2 transition-all text-left',
                    hasVoted && !optionsChanged
                      ? isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-slate-50'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer',
                    isVoting && 'opacity-50 cursor-wait',
                    optionsChanged && 'cursor-pointer'
                  )}
                >
                  <div
                    className={cn(
                      'absolute inset-0 transition-all duration-500',
                      isSelected ? 'bg-blue-100' : 'bg-slate-100'
                    )}
                    style={{ width: hasVoted ? `${percentage}%` : '0%' }}
                  />

                  <div className="relative px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                      <span className="font-medium text-slate-800">
                        {option.option_name}
                      </span>
                    </div>

                    {hasVoted && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-600">
                          {formatVoteCount(option.votes)}
                        </span>
                        <span className="text-base font-bold text-slate-700 min-w-[3rem] text-right">
                          {percentage}%
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {!hasVoted && !optionsChanged && (
            <p className="text-sm text-slate-500 mt-4 text-center">
              Click an option to vote
            </p>
          )}
          {optionsChanged && (
            <p className="text-sm text-blue-600 mt-4 text-center font-semibold">
              Select an option to vote
            </p>
          )}
        </div>
      </Card>

      {isOwner && (
        <EditPollModal
          poll={poll}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
        />
      )}

      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
      />
    </>
  );
}