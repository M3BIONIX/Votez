const MIN_TITLE_LENGTH = 3;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

/**
 * Validate poll title
 */
export const validatePollTitle = (title: string): { valid: boolean; message: string } => {
  if (title.trim().length < MIN_TITLE_LENGTH) {
    return { 
      valid: false, 
      message: `Poll title must be at least ${MIN_TITLE_LENGTH} characters long` 
    };
  }
  return { valid: true, message: '' };
};

/**
 * Get valid options (non-empty)
 */
export const getValidOptions = (options: string[]): string[] => {
  return options.filter(opt => opt.trim().length > 0);
};

/**
 * Validate poll options
 */
export const validatePollOptions = (validOptions: string[]): { valid: boolean; message: string } => {
  if (validOptions.length < MIN_OPTIONS) {
    return { 
      valid: false, 
      message: `Please provide at least ${MIN_OPTIONS} options` 
    };
  }
  return { valid: true, message: '' };
};

/**
 * Can add more options
 */
export const canAddOption = (optionsLength: number): boolean => {
  return optionsLength < MAX_OPTIONS;
};

/**
 * Can remove option
 */
export const canRemoveOption = (optionsLength: number): boolean => {
  return optionsLength > MIN_OPTIONS;
};

