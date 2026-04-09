export function getUserFriendlyError(error: any): string {
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code;

  if (code === '23505') return 'This record already exists. Please try different information.';
  if (code === '23503') return 'Invalid selection. Please verify your choices.';
  if (code === '42501') return 'You do not have permission to perform this action.';
  if (code === '23502') return 'Required information is missing.';
  if (code === '23514') return 'Invalid data provided. Please check your input.';

  if (message.includes('row-level security') || message.includes('policy') || message.includes('permission denied for table')) {
    return 'Access denied. You are not authorized to perform this action.';
  }
  if (message.includes('duplicate') || message.includes('unique constraint')) {
    return 'This item already exists. Please check your information.';
  }
  if (message.includes('foreign key') || message.includes('violates constraint')) {
    return 'Invalid data reference. Please verify your selections.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Connection error. Please check your internet and try again.';
  }
  if (message.includes('jwt') || message.includes('unauthorized') || message.includes('invalid login')) {
    return 'Authentication error. Please check your credentials or sign in again.';
  }
  if (message.includes('invalid') || message.includes('validation')) {
    return 'Invalid input. Please check your information and try again.';
  }
  if (message.includes('email') && message.includes('already')) {
    return 'This email is already registered. Please try signing in instead.';
  }

  return 'An unexpected error occurred. Please try again or contact support.';
}
