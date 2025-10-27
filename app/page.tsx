'use client';

import { useState, useEffect, useRef } from 'react';
import { CreatePollForm } from '@/components/create-poll-form';
import { PollList } from '@/components/poll-list';
import { fetchPolls } from '@/lib/api';
import { wsManager } from '@/lib/websocket';
import { Button } from '@/components/ui/button';
import { PlusCircle, TrendingUp } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { Poll } from "@/application-shared/interfaces/polls-interface";
import { AuthButton } from '@/components/auth-button';
import { AuthModal } from '@/components/auth-modal';
import { useAuth } from '@/lib/auth-store';
import { WS_EVENTS } from '@/application-shared/constants/websocket-constants';

export default function Home() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { isAuthenticated, isLoading, user } = useAuth();
  const hasLoadedRef = useRef(false);
  const prevIsLoadingRef = useRef(true);

  useEffect(() => {
    if (prevIsLoadingRef.current && !isLoading && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadPolls();
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading]);

  // Reload polls when user logs in or out to refresh vote/like states
  useEffect(() => {
    if (hasLoadedRef.current && !isLoading) {
      // Small delay to ensure auth state is fully updated
      const timeoutId = setTimeout(() => {
        loadPolls();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [user?.uuid, isAuthenticated]);

  useEffect(() => {
    wsManager.connect();

    const unsubscribe = wsManager.onMessage((message) => {
      console.log('WebSocket message received:', message.type, message.data);
      
      // Handle poll lifecycle events (create/delete)
      if (message.type === WS_EVENTS.POLL_CREATED) {
        setPolls(prev => {
          const exists = prev.some(p => p.uuid === message.data.uuid || p.id === message.data.id);
          return exists ? prev : [message.data, ...prev];
        });
      } else if (message.type === WS_EVENTS.POLL_DELETED) {
        setPolls(prev =>
          prev.filter(poll =>
            poll.uuid !== message.data.uuid && poll.id !== message.data.id
          )
        );
      } 
      // Handle poll interaction events (like/unlike, vote)
      else if (
        message.type === WS_EVENTS.POLL_LIKED || 
        message.type === WS_EVENTS.POLL_UNLIKED ||
        message.type === WS_EVENTS.VOTE_CAST ||
        message.type === WS_EVENTS.POLL_VOTED
      ) {
        // Like/unlike, vote submission - update the specific poll
        setPolls(prev =>
          prev.map(poll => {
            if (poll.uuid === message.data.uuid || poll.id === message.data.id) {
              return message.data;
            }
            return poll;
          })
        );
      } 
      // Handle poll structure changes (options added/deleted, poll updated)
      else if (
        message.type === WS_EVENTS.POLL_OPTIONS_ADDED || 
        message.type === WS_EVENTS.POLL_UPDATED || 
        message.type === WS_EVENTS.POLL_OPTIONS_DELETED ||
        message.type === WS_EVENTS.POLL_SUMMARY_UPDATED
      ) {
        // Poll structure changes - update the poll
        setPolls(prev =>
          prev.map(poll => {
            if (poll.uuid === message.data.uuid || poll.id === message.data.id) {
              return message.data;
            }
            return poll;
          })
        );
      }
    });

    return () => {
      unsubscribe();
      wsManager.disconnect();
    };
  }, []);

  const handleShowCreateForm = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setShowCreateForm(true);
  };

  const loadPolls = async () => {
    try {
      const data = await fetchPolls();
      setPolls(data);
    } catch (error) {
      console.error('Error loading polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePollCreated = (newPoll: Poll) => {
    setPolls(prev => [newPoll, ...prev]);
    setShowCreateForm(false);
  };

  const handlePollUpdated = (updatedPoll: Poll) => {
    setPolls(prev =>
      prev.map(poll =>
        poll.uuid === updatedPoll.uuid || poll.id === updatedPoll.id ? updatedPoll : poll
      )
    );
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
              <PollList polls={polls} onPollUpdated={handlePollUpdated} />
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
