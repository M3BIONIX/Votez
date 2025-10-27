export interface UserVotedPollInfo {
  poll_uuid: string;
  option_uuid: string;
  total_votes: number;
  summary: {
    total_votes: number;
    option_percentages: Record<string, number>;
  };
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  uuid: string;
  created_at: string;
  liked_poll_uuids: string[];
  voted_polls: UserVotedPollInfo[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  uuid: string;
  created_at: string;
  liked_poll_uuids?: string[];
  voted_polls?: UserVotedPollInfo[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface PollSummaryResponse {
  poll_uuid: string;
  total_votes: number;
  option_summary: Record<string, number>;
}

