export interface VoteRequest {
    option_uuid: string;
}

export interface VoteResponse {
    message: string;
    poll_uuid: string;
    option_uuid: string;
    summary: {
        total_votes: number;
        option_percentages: Record<string, number>;
    };
}

export interface LikeResponse {
    poll_uuid: string;
    user_id: number;
    is_liked: boolean;
}

export interface VotedPollInfo {
    poll_uuid: string;
    option_uuid: string;
    total_votes: number;
    summary: Record<string, number>; // option_uuid -> percentage
}

export interface UserStatus {
    has_voted: boolean;
    voted_option_id: string | null;
    has_liked: boolean;
}