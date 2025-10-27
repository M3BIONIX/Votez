const MIN_TITLE_LENGTH = 3;
const MIN_OPTIONS = 2;

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
export const getValidOptions = (options: { text: string }[]): { text: string }[] => {
  return options.filter(opt => opt.text.trim().length > 0);
};

/**
 * Validate poll options
 */
export const validatePollOptions = (validOptionsCount: number): { valid: boolean; message: string } => {
  if (validOptionsCount < MIN_OPTIONS) {
    return { 
      valid: false, 
      message: `Please provide at least ${MIN_OPTIONS} options` 
    };
  }
  return { valid: true, message: '' };
};

/**
 * Can remove option
 */
export const canRemoveOption = (optionsLength: number): boolean => {
  return optionsLength > MIN_OPTIONS;
};

/**
 * Split options into existing and new
 */
export const splitOptionsByExistence = (options: { uuid: string; version_id: number; text: string }[]) => {
  const existingOptions = options.filter(opt => opt.uuid);
  const newOptions = options.filter(opt => !opt.uuid);
  return { existingOptions, newOptions };
};

