import { create } from 'zustand';
import { Poll, PollOption } from '@/application-shared/interfaces/polls-interface';
import { fetchPolls, createPoll as apiCreatePoll, updatePoll as apiUpdatePoll, deletePoll as apiDeletePoll, addPollOptions as apiAddPollOptions, deletePollOptions as apiDeletePollOptions, votePoll as apiVotePoll, likePoll as apiLikePoll } from '@/lib/api';
import { WS_EVENTS } from '@/application-shared/constants/websocket-constants';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/application-shared/constants/toaster-constants';

interface PollsStore {
  polls: Poll[];
  loading: boolean;
  initialized: boolean;
  // Actions
  fetchPolls: () => Promise<void>;
  refreshPolls: () => Promise<void>;
  createPoll: (poll: { title: string; options: { option_name: string }[] }) => Promise<Poll | null>;
  updatePoll: (pollUuid: string, poll: { title?: string; version_id: number; options?: any[] }) => Promise<void>;
  deletePoll: (pollUuid: string) => Promise<void>;
  addPollOptions: (pollUuid: string, options: { option_name: string }[] ) => Promise<void>;
  deletePollOptions: (pollUuid: string, optionUuids: string[]) => Promise<void>;
  votePoll: (pollUuid: string, optionUuid: string) => Promise<void>;
  likePoll: (pollUuid: string) => Promise<void>;
  // WebSocket handlers
  handleWebSocketMessage: (message: any, userVotes?: Record<string, string>) => void;
}

/**
 * Updates poll options with vote data from summary
 */
function updatePollOptionsWithSummary(options: PollOption[], summary: any): PollOption[] {
  if (!summary || !summary.option_percentages) return options;
  
  const totalVotes = summary.total_votes || 0;
  const optionPercentages = summary.option_percentages;
  
  return options.map(option => {
    const percentage = optionPercentages[option.uuid] || 0;
    const votes = Math.round((totalVotes * percentage) / 100);
    return {
      ...option,
      votes
    };
  });
}

/**
 * Merges two polls, preserving important fields and updating with new data
 */
function mergePoll(existing: Poll, incoming: Partial<Poll>): Poll {
  // If incoming has all required fields, use it directly
  if (incoming.options && incoming.title && incoming.created_at) {
    // Check if incoming has vote data (non-zero votes)
    const incomingHasVoteData = incoming.options?.some(opt => opt.votes > 0) || (incoming.total_votes !== undefined && incoming.total_votes > 0);
    
    // If incoming doesn't have vote data, preserve vote data from existing options
    if (!incomingHasVoteData) {
      const existingOptionVoteMap = new Map(existing.options.map(opt => [opt.uuid, opt.votes]));
      
      return {
        ...existing,
        ...incoming,
        total_votes: incoming.total_votes !== undefined ? incoming.total_votes : existing.total_votes,
        options: incoming.options.map(opt => {
          // Preserve vote data if option exists in old poll
          const existingVotes = existingOptionVoteMap.get(opt.uuid);
          return {
            ...opt,
            votes: existingVotes !== undefined ? existingVotes : opt.votes
          };
        })
      };
    }
    
    return {
      ...existing,
      ...incoming,
      total_votes: incoming.total_votes !== undefined ? incoming.total_votes : existing.total_votes,
      options: incoming.options,
    };
  }
  
  // Otherwise, merge partial updates
  return {
    ...existing,
    ...incoming,
  };
}

export const usePollsStore = create<PollsStore>((set, get) => ({
  polls: [],
  loading: true,
  initialized: false,

  fetchPolls: async () => {
    set({ loading: true });
    try {
      const polls = await fetchPolls();
      
      // Log vote data to debug
      console.log('Fetched polls with votes:', polls.map(p => ({
        uuid: p.uuid,
        title: p.title,
        total_votes: p.total_votes,
        options_votes: p.options.map(o => ({ uuid: o.uuid, name: o.option_name, votes: o.votes }))
      })));
      
      set({ polls, loading: false, initialized: true });
    } catch (error) {
      console.error('Error fetching polls:', error);
      set({ loading: false });
      toast.error('Failed to load polls');
    }
  },

  refreshPolls: async () => {
    try {
      const polls = await fetchPolls();
      set({ polls });
    } catch (error) {
      console.error('Error refreshing polls:', error);
      toast.error('Failed to refresh polls');
    }
  },

  createPoll: async (pollData) => {
    try {
      const newPoll = await apiCreatePoll(pollData);
      // Don't add to state here - WebSocket will handle it
      return newPoll;
    } catch (error: any) {
      toast.error(error.message || 'Failed to create poll');
      return null;
    }
  },

  updatePoll: async (pollUuid, pollData) => {
    try {
      const updatedPoll = await apiUpdatePoll(pollUuid, pollData);
      set(state => ({
        polls: state.polls.map(p => 
          p.uuid === pollUuid ? mergePoll(p, updatedPoll) : p
        )
      }));
    } catch (error: any) {
      toast.error(error.message || 'Failed to update poll');
      throw error;
    }
  },

  deletePoll: async (pollUuid) => {
    try {
      await apiDeletePoll(pollUuid);
      // WebSocket will broadcast the deletion event, don't update here to avoid conflicts
      toast.success(TOAST_MESSAGES.POLL?.DELETED_SUCCESS || 'Poll deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete poll');
      throw error;
    }
  },

  addPollOptions: async (pollUuid, options) => {
    try {
      const updatedPoll = await apiAddPollOptions(pollUuid, options);
      // WebSocket will also broadcast this event with vote data
      // This merges any vote data properly
      set(state => ({
        polls: state.polls.map(p => 
          p.uuid === pollUuid ? mergePoll(p, updatedPoll) : p
        )
      }));
    } catch (error: any) {
      toast.error(error.message || 'Failed to add options');
      throw error;
    }
  },

  deletePollOptions: async (pollUuid, optionUuids) => {
    try {
      const updatedPoll = await apiDeletePollOptions(pollUuid, optionUuids);
      // WebSocket will also broadcast this event with vote data
      // This merges any vote data properly
      set(state => ({
        polls: state.polls.map(p => 
          p.uuid === pollUuid ? mergePoll(p, updatedPoll) : p
        )
      }));
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete options');
      throw error;
    }
  },

  votePoll: async (pollUuid, optionUuid) => {
    try {
      await apiVotePoll(pollUuid, { option_uuid: optionUuid });
      // Don't update state here - WebSocket will broadcast the vote event
    } catch (error: any) {
      if (error.message.includes('version')) {
        toast.error(TOAST_MESSAGES.POLL?.VOTE_VERSION_CONFLICT || 'Poll was updated, please refresh');
      } else {
        toast.error(error.message || TOAST_MESSAGES.POLL?.VOTE_FAILED || 'Failed to vote');
      }
      throw error;
    }
  },

  likePoll: async (pollUuid) => {
    try {
      await apiLikePoll(pollUuid);
      // Don't update state here - WebSocket will broadcast the like event
    } catch (error: any) {
      toast.error(error.message || TOAST_MESSAGES.POLL?.LIKE_FAILED || 'Failed to like poll');
      throw error;
    }
  },

  handleWebSocketMessage: (message, userVotes) => {
    const { type, data } = message;
    // Attach userVotes to message for use in handlers
    (message as any).userVotes = userVotes;
    
    if (!data) return;

    switch (type) {
      case WS_EVENTS.POLL_CREATED:
        // Prevent duplicates by checking if poll already exists
        set(state => {
          const exists = state.polls.some(p => p.uuid === data.uuid);
          if (exists) return state;
          
          return {
            polls: [data, ...state.polls]
          };
        });
        break;

      case WS_EVENTS.POLL_DELETED:
        console.log('POLL_DELETED event:', data);
        set(state => {
          console.log('Current polls before delete:', state.polls.map(p => ({ uuid: p.uuid, title: p.title })));
          const filtered = state.polls.filter(p => {
            // Keep polls that don't match uuid
            const matchesUuid = p.uuid === data.uuid;
            return !matchesUuid;
          });
          console.log('Filtered polls after delete:', filtered.map(p => ({ uuid: p.uuid, title: p.title })));
          return { polls: filtered };
        });
        break;

      case WS_EVENTS.POLL_UPDATED:
        // Full poll replacement when structure changes
        set(state => ({
          polls: state.polls.map(p => {
            if (p.uuid === data.uuid) {
              return mergePoll(p, data);
            }
            return p;
          })
        }));
        break;

      case WS_EVENTS.POLL_OPTIONS_ADDED:
      case WS_EVENTS.POLL_OPTIONS_DELETED:
        console.log('POLL_OPTIONS_ADDED/DELETED event:', data);
        const userVotes = (message as any).userVotes || {};
        const changeType = type === WS_EVENTS.POLL_OPTIONS_ADDED ? 'added' : 'deleted';
        
        // When options are added/deleted, preserve vote data
        set(state => {
          const updatedPolls = state.polls.map(p => {
            if (p.uuid === data.uuid) {
              // Preserve total votes from existing poll
              const existingTotalVotes = p.total_votes || 0;
              
              // Map existing vote data by option UUID
              const existingVoteMap = new Map(p.options.map(opt => [opt.uuid, opt.votes]));
              
              // Update poll with new options but preserve vote counts
              const updatedPoll = {
                ...p,
                ...data,
                version_id: data.version_id || p.version_id,
                total_votes: existingTotalVotes, // Preserve existing total votes
                options: data.options.map((opt: PollOption) => {
                  // Preserve vote count from existing options
                  const existingVotes = existingVoteMap.get(opt.uuid) || 0;
                  return {
                    ...opt,
                    votes: existingVotes
                  };
                })
              };
              
              console.log('Updated poll preserving votes:', {
                uuid: updatedPoll.uuid,
                total_votes: updatedPoll.total_votes,
                options_count: updatedPoll.options.length,
                options: updatedPoll.options.map((o: PollOption) => ({ uuid: o.uuid, votes: o.votes }))
              });
              
              return updatedPoll;
            }
            return p;
          });
          
          return { polls: updatedPolls };
        });
        break;

      case WS_EVENTS.POLL_LIKED:
        set(state => ({
          polls: state.polls.map(p => {
            if (p.uuid === data.poll_uuid || p.uuid === data.uuid) {
              // Update likes count, preserve all other data
              return {
                ...p,
                likes: data.likes ?? (p.likes + 1)
              };
            }
            return p;
          })
        }));
        break;

      case WS_EVENTS.POLL_UNLIKED:
        set(state => ({
          polls: state.polls.map(p => {
            if (p.uuid === data.poll_uuid || p.uuid === data.uuid) {
              // Update likes count, preserve all other data
              return {
                ...p,
                likes: data.likes ?? Math.max(0, p.likes - 1)
              };
            }
            return p;
          })
        }));
        break;

      case WS_EVENTS.POLL_VOTED:
        console.log('POLL_VOTED event:', data);
        set(state => ({
          polls: state.polls.map(p => {
            if (p.uuid === data.poll_uuid || p.uuid === data.uuid) {
              // Update poll with vote summary data
              if (data.summary && data.summary.option_percentages) {
                const updatedPoll = {
                  ...p,
                  total_votes: data.summary.total_votes ?? p.total_votes,
                  options: updatePollOptionsWithSummary(p.options, data.summary)
                };
                console.log('Updated poll votes:', {
                  uuid: updatedPoll.uuid,
                  total_votes: updatedPoll.total_votes,
                  options: updatedPoll.options.map(o => ({ uuid: o.uuid, votes: o.votes }))
                });
                return updatedPoll;
              }
              return p;
            }
            return p;
          })
        }));
        break;

      case 'connected':
        console.log('WebSocket connected successfully');
        break;

      case 'pong':
        // Echo response - no state update needed
        console.log('WebSocket pong:', data);
        break;

      default:
        // Unknown event type
        break;
    }
  },
}));
