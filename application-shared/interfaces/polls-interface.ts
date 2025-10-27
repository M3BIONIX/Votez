export interface PollOption {
    id: string;
    uuid: string;
    poll_id: string;
    option_name: string;
    votes: number;
    version_id: number;
    created_at: string;
}

export interface Poll {
    id: string;
    uuid: string;
    title: string;
    created_at: string;
    likes: number;
    options: PollOption[];
    total_votes?: number;
    version_id: number;
    creator_id?: string;
    user_id?: string;
    created_by_uuid?: string;
}

export interface PollCardProps {
    poll: Poll;
    onPollUpdated?: (poll: Poll) => void;
}

export interface PollListProps {
    polls: Poll[];
    onPollUpdated?: (poll: Poll) => void;
}

export interface CreatePollRequest {
    title: string;
    options: { option_name: string }[];
}

export interface UpdatePollOption {
    uuid: string;
    version_id: number;
    option_name: string;
}

export interface UpdatePollRequest {
    title?: string;
    options?: UpdatePollOption[];
    version_id: number;
}