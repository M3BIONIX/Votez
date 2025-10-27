export const TOAST_MESSAGES = {
  // Auth messages
  AUTH: {
    LOGIN_SUCCESS: 'Logged in successfully!',
    LOGOUT_SUCCESS: 'Logged out successfully',
    ACCOUNT_CREATED: 'Account created and logged in successfully!',
    LOGIN_FAILED: 'Failed to login',
    REGISTER_FAILED: 'Failed to register',
    LOGIN_REQUIRED: 'Please login to vote',
    LOGIN_REQUIRED_LIKE: 'Please login to like polls',
    INVALID_EMAIL: 'Please enter a valid email address',
  },

  // Poll messages
  POLL: {
    CREATED_SUCCESS: 'Poll created successfully!',
    CREATED_FAILED: 'Failed to create poll',
    UPDATED_SUCCESS: 'Poll updated successfully!',
    UPDATED_FAILED: 'Failed to update poll',
    UPDATED_VERSION_CONFLICT: 'Poll was modified. Please refresh and try again.',
    DELETED_SUCCESS: 'Poll deleted successfully!',
    DELETED_FAILED: 'Failed to delete poll',
    VOTE_SUCCESS: 'Vote recorded!',
    VOTE_FAILED: 'Failed to vote',
    VOTE_VERSION_CONFLICT: 'Poll was modified. Please refresh and try again.',
    LIKE_SUCCESS: 'Poll liked!',
    LIKE_REMOVED: 'Like removed',
    LIKE_FAILED: 'Failed to like poll',
    OPTION_DELETED_SUCCESS: 'Option deleted successfully!',
    OPTION_DELETED_FAILED: 'Failed to delete option',
    INVALID_TITLE_LENGTH: 'Poll title must be at least 3 characters long',
    INVALID_OPTIONS_COUNT: 'Please provide at least 2 options',
    MISSING_VERSION_INFO: 'Poll version information is missing',
    MIN_OPTIONS_REQUIRED: 'Polls must have at least 2 options',
  },
} as const;

