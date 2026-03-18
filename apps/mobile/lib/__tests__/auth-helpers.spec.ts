import { ApiException } from '../api';

// Test useApiError logic directly (extracted from auth-context.tsx)
// The hook itself is a thin wrapper around this logic
function getErrorMessage(error: unknown, language: 'fr' | 'en' = 'en'): string {
  if (error instanceof ApiException) {
    return error.getLocalizedMessage(language);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return language === 'fr' ? "Une erreur s'est produite" : 'An error occurred';
}

describe('getErrorMessage (useApiError logic)', () => {
  it('returns localized message from ApiException in English', () => {
    const err = new ApiException({
      code: 'INVALID',
      message: 'Invalid',
      message_en: 'Invalid input',
      message_fr: 'Entrée invalide',
    });
    expect(getErrorMessage(err, 'en')).toBe('Invalid input');
  });

  it('returns localized message from ApiException in French', () => {
    const err = new ApiException({
      code: 'INVALID',
      message: 'Invalid',
      message_en: 'Invalid input',
      message_fr: 'Entrée invalide',
    });
    expect(getErrorMessage(err, 'fr')).toBe('Entrée invalide');
  });

  it('returns message from standard Error', () => {
    const err = new Error('Something broke');
    expect(getErrorMessage(err)).toBe('Something broke');
  });

  it('returns generic English message for unknown errors', () => {
    expect(getErrorMessage('string error')).toBe('An error occurred');
    expect(getErrorMessage(42)).toBe('An error occurred');
    expect(getErrorMessage(null)).toBe('An error occurred');
  });

  it('returns generic French message for unknown errors', () => {
    expect(getErrorMessage('string error', 'fr')).toBe("Une erreur s'est produite");
  });
});
