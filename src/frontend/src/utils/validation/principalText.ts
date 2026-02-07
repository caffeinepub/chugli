import { Principal } from '@dfinity/principal';

/**
 * Validates and parses a Principal from a user-entered string.
 * Returns the parsed Principal on success, or an error message on failure.
 */
export function validatePrincipalText(text: string): { 
  valid: true; 
  principal: Principal 
} | { 
  valid: false; 
  error: string 
} {
  const trimmed = text.trim();
  
  if (!trimmed) {
    return {
      valid: false,
      error: 'Principal ID cannot be empty',
    };
  }

  try {
    const principal = Principal.fromText(trimmed);
    return {
      valid: true,
      principal,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid principal format. Please enter a valid principal ID.',
    };
  }
}
