'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, CheckCircle2, Users, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { likePoll, votePoll } from "@/lib/api";
import { PollCardProps } from "@/application-shared/interfaces/polls-interface";
import { useAuth } from '@/lib/auth-store';
import { EditPollModal } from './edit-poll-modal';
import { AuthModal } from './auth-modal';
import { getPercentage, getTotalVotes, formatDate, formatVoteCount, hasOptionsChanged } from './helper/poll-card-helpers';
import { TOAST_MESSAGES } from '@/application-shared/constants/toaster-constants';

export function PollCard({ poll, onPollUpdated }: PollCardProps) {
  const { isAuthenticated, user } = useAuth();
  const [hasVoted, setHasVoted] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [localPoll, setLocalPoll] = useState(poll);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const prevPollRef = useRef<typeof poll | null>(null);

  useEffect(() => {
    if (!poll) return;
    
    if (poll === prevPollRef.current) return;
    
    const prevPoll = prevPollRef.current;
    prevPollRef.current = poll;

    if (!prevPoll || poll.uuid !== prevPoll.uuid) {
      setLocalPoll(poll);
      return;
    }

    const likesChanged = poll.likes !== prevPoll.likes;
    const optionsChanged = hasOptionsChanged(poll.options, prevPoll.options);
    
    if (likesChanged || optionsChanged) {
      setLocalPoll(poll);
    }
  });

  useEffect(() => {
    if (hasVoted && votedOptionId && isAuthenticated && localPoll.options) {
      const votedOption = localPoll.options.find(opt => opt.id === votedOptionId);
      if (!votedOption) {
        setHasVoted(false);
        setVotedOptionId(null);
      }
    }
  }, [localPoll, hasVoted, votedOptionId, isAuthenticated]);

  useEffect(() => {
    if (user && isAuthenticated) {
      const isLiked = user.liked_poll_uuids?.includes(poll.uuid) || false;
      setHasLiked(isLiked);
      
      const voteInfo = user.voted_polls?.find(v => v.poll_uuid === poll.uuid);
      if (voteInfo) {
        const option = poll.options.find(opt => opt.uuid === voteInfo.option_uuid);
        if (option) {
          setHasVoted(true);
          setVotedOptionId(option.id);
          setLocalPoll(prev => ({
            ...prev,
            options: prev.options.map(opt => ({
              ...opt,
              votes: voteInfo.summary[opt.uuid] 
                ? Math.round((voteInfo.total_votes * voteInfo.summary[opt.uuid]) / 100)
                : opt.votes
            }))
          }));
        } else {
          setHasVoted(false);
          setVotedOptionId(null);
        }
      } else {
        if (!hasVoted) {
          setHasVoted(false);
          setVotedOptionId(null);
        }
      }
    } else {
      setHasVoted(false);
      setHasLiked(false);
      setVotedOptionId(null);
    }
  }, [user?.uuid, isAuthenticated, poll.uuid]);

  const handleVote = async (optionUuid: string) => {
    if (!isAuthenticated) {
      toast.error(TOAST_MESSAGES.AUTH.LOGIN_REQUIRED);
      setShowAuthModal(true);
      return;
    }
    if (hasVoted || isVoting) return;

    setIsVoting(true);

    try {
       await votePoll(poll.uuid, {
        option_uuid: optionUuid,
      });

      setHasVoted(true);
      const option = localPoll.options?.find(opt => opt.uuid === optionUuid);
      if (option) {
        setVotedOptionId(option.id);
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

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error(TOAST_MESSAGES.AUTH.LOGIN_REQUIRED_LIKE);
      setShowAuthModal(true);
      return;
    }
    if (isLiking) return;

    setIsLiking(true);

    try {
      const result = await likePoll(poll.uuid);

      setHasLiked(result.is_liked);
      
      // Don't manually update like count - let WebSocket handle it for consistency
      // The backend will send the authoritative like data via WebSocket
      if (result.is_liked) {
        toast.success(TOAST_MESSAGES.POLL.LIKE_SUCCESS);
      } else {
        toast.success(TOAST_MESSAGES.POLL.LIKE_REMOVED);
      }
    } catch (error: any) {
      toast.error(error.message || TOAST_MESSAGES.POLL.LIKE_FAILED);
    } finally {
      setIsLiking(false);
    }
  };

  const handlePollUpdated = (updatedPoll: typeof poll) => {
    setLocalPoll(updatedPoll);
    if (onPollUpdated) {
      onPollUpdated(updatedPoll);
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
                {localPoll.title || ''}
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
                  {getTotalVotes(localPoll.options || [])} votes
                </span>
                <span>{formatDate(localPoll.created_at || '')}</span>
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
              <span className="font-semibold">{localPoll.likes}</span>
            </Button>
          </div>

        <div className="space-y-3">
          {localPoll.options?.map((option) => {
            const totalVotes = getTotalVotes(localPoll.options || []);
            const percentage = getPercentage(option.votes, totalVotes);
            const isSelected = votedOptionId === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.uuid)}
                disabled={hasVoted || isVoting}
                className={cn(
                  'w-full relative overflow-hidden rounded-lg border-2 transition-all text-left',
                  hasVoted
                    ? isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-slate-50'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer',
                  isVoting && 'opacity-50 cursor-wait'
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

        {!hasVoted && (
          <p className="text-sm text-slate-500 mt-4 text-center">
            Click an option to vote
          </p>
        )}
        </div>
      </Card>

      {isOwner && (
        <EditPollModal
          poll={localPoll}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onPollUpdated={handlePollUpdated}
        />
      )}

      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
      />
    </>
  );
}
