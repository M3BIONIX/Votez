'use client';

import { useState, useEffect, useRef } from 'react';
import { CreatePollForm } from '@/components/create-poll-form';
import { PollList } from '@/components/poll-list';
import { wsManager } from '@/lib/websocket';
import { Button } from '@/components/ui/button';
import { PlusCircle, TrendingUp } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { AuthButton } from '@/components/auth-button';
import { AuthModal } from '@/components/auth-modal';
import { useAuth } from '@/lib/auth-store';
import { usePollsStore } from '@/lib/stores/polls-store';

export default function Home() {
  // Debug: Log environment variables
  useEffect(() => {
    console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log('NEXT_PUBLIC_WS_URL:', process.env.NEXT_PUBLIC_WS_URL);
  }, []);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { polls, loading, fetchPolls, refreshPolls, handleWebSocketMessage } = usePollsStore();
  const prevUserUuid = useRef<string | undefined>(undefined);
  const hasLoadedRef = useRef(false);

  // Fetch polls on mount
  useEffect(() => {
    if (!hasLoadedRef.current && !authLoading) {
      hasLoadedRef.current = true;
      fetchPolls();
    }
  }, [authLoading, fetchPolls]);

  // Refresh polls when user logs in/out to update vote/like states
  useEffect(() => {
    if (hasLoadedRef.current && !authLoading && prevUserUuid.current !== user?.uuid) {
      prevUserUuid.current = user?.uuid;
      // Small delay to ensure auth state is fully updated
      setTimeout(() => {
        refreshPolls();
      }, 100);
    }
  }, [user?.uuid, authLoading, refreshPolls]);

  // Setup WebSocket connection
  useEffect(() => {
    wsManager.connect();
    
    const unsubscribe = wsManager.onMessage((message) => {
      const userVoteMap: Record<string, string> = {};
      if (user?.voted_polls) {
        user.voted_polls.forEach(vote => {
          userVoteMap[vote.poll_uuid] = vote.option_uuid;
        });
      }
      handleWebSocketMessage(message, userVoteMap);
      
      // Trigger notifications for option changes
      if ((message.type === 'poll_options_added' || message.type === 'poll_options_deleted') && message.data) {
        const pollUuid = message.data.uuid;
        console.log('Checking if user voted on poll:', pollUuid, 'User voted:', !!userVoteMap[pollUuid]);
        if (userVoteMap[pollUuid]) {
          // Dispatch event that poll cards can listen to
          const event = new CustomEvent('pollOptionsChanged', {
            detail: {
              pollUuid,
              type: message.type === 'poll_options_added' ? 'added' : 'deleted'
            }
          });
          console.log('Dispatching pollOptionsChanged event:', event.detail);
          window.dispatchEvent(event);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [handleWebSocketMessage, user]);

  const handleShowCreateForm = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setShowCreateForm(true);
  };

  const handlePollCreated = (_poll: any) => {
    // The websocket will broadcast the poll creation event to all clients
    setShowCreateForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Toaster />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-12 pt-8">
          <div className="flex items-center justify-between mb-8">
            <div></div>
            <div className="flex items-center justify-center gap-3">
              <TrendingUp className="w-10 h-10 text-blue-600" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Votez
              </h1>
            </div>
            <AuthButton />
          </div>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Create instant polls and see results update in real-time. Share your opinion and discover what others think.
          </p>
        </header>

        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

        <div className="mb-8">
          {!showCreateForm ? (
            <div className="flex justify-center">
              <Button
                onClick={handleShowCreateForm}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Create New Poll
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-800">Create a New Poll</h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateForm(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </Button>
              </div>
              <CreatePollForm onPollCreated={handlePollCreated} />
            </div>
          )}
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-slate-600">Loading polls...</p>
            </div>
          ) : polls.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
              <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No polls yet</h3>
              <p className="text-slate-500">Be the first to create a poll and start the conversation!</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px bg-slate-300 flex-1"></div>
                <h2 className="text-2xl font-bold text-slate-800">Active Polls</h2>
                <div className="h-px bg-slate-300 flex-1"></div>
              </div>
              <PollList polls={polls} />
            </>
          )}
        </div>
      </div>

      <footer className="text-center py-8 mt-12 border-t border-slate-200">
        <p className="text-slate-500 text-sm">
          Made with ❤ by <a className="hover:underline" href={'https://github.com/M3BIONIX'}>M3BIONIX</a>
        </p>
      </footer>
    </div>
  );
}
