import {
    LikeResponse,
    VoteRequest,
    VoteResponse,
} from "@/application-shared/interfaces/shared-interfaces";
import {CreatePollRequest, Poll, UpdatePollRequest} from "@/application-shared/interfaces/polls-interface";
import { CurrentUser, LoginResponse } from "@/application-shared/interfaces/user-interfaces";
import { env } from './env-config';
import { getToken, clearToken, dispatchLogoutEvent } from './token-utils';

const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

// Get headers with auth if available
function getHeaders(includeAuth: boolean = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

// Handle 401 errors
async function handleResponse(response: Response) {
  if (response.status === 401) {
    clearToken();
    dispatchLogoutEvent();
    throw new Error('Unauthorized');
  }
  return response;
}

export async function fetchPolls(): Promise<Poll[]> {
  const response = await handleResponse(await fetch(`${API_BASE_URL}/poll/`));
  if (!response.ok) throw new Error('Failed to fetch polls');
  const data = await response.json();
  return Array.isArray(data) ? data : data.polls || [];
}

export async function fetchPoll(pollId: string): Promise<Poll> {
  const response = await handleResponse(await fetch(`${API_BASE_URL}/poll/${pollId}`));
  if (!response.ok) throw new Error('Failed to fetch poll');
  return response.json();
}

export async function createPoll(poll: CreatePollRequest): Promise<Poll> {
  const response = await handleResponse(await fetch(`${API_BASE_URL}/poll/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(poll),
  }));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create poll');
  }
  return response.json();
}

export async function votePoll(pollId: string, vote: VoteRequest): Promise<VoteResponse> {
  const response = await handleResponse(await fetch(`${API_BASE_URL}/poll/${pollId}/vote`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(vote),
  }));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to vote');
  }
  return response.json();
}

export async function likePoll(pollId: string): Promise<LikeResponse> {
  const response = await handleResponse(await fetch(`${API_BASE_URL}/poll/${pollId}/like`, {
    method: 'POST',
    headers: getHeaders(),
  }));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to like poll');
  }
  return response.json();
}

export async function register(email: string, password: string, name: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify({ email, password, name }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }
  return response.json();
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    // Don't throw on 401 - user is just not authenticated
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch user');
  }
  
  return response.json();
}

// Poll update endpoint
export async function updatePoll(pollId: string, poll: UpdatePollRequest): Promise<Poll> {
  const response = await handleResponse(await fetch(`${API_BASE_URL}/poll/${pollId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(poll),
  }));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update poll');
  }
  return response.json();
}

// Delete poll endpoint
export async function deletePoll(pollId: string): Promise<void> {
  const response = await handleResponse(await fetch(`${API_BASE_URL}/poll/${pollId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete poll');
  }
}

// Add options to existing poll
export async function addPollOptions(pollId: string, options: { option_name: string }[]): Promise<Poll> {
  const response = await handleResponse(await fetch(`${API_BASE_URL}/poll/${pollId}/options`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ options }),
  }));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to add options');
  }
  return response.json();
}

// Delete options from existing poll
export async function deletePollOptions(pollId: string, optionUuids: string[]): Promise<Poll> {
  const response = await handleResponse(await fetch(`${API_BASE_URL}/poll/${pollId}/options`, {
    method: 'DELETE',
    headers: getHeaders(),
    body: JSON.stringify({ option_uuids: optionUuids }),
  }));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete options');
  }
  return response.json();
}
