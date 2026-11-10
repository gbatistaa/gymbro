import { ApiError } from '../error';
import { GENERIC_MESSAGE, fieldMessages, messageForCode, messageForError } from '../error-messages';

// Lista espelhada de docs/adr/0001-contrato-de-erro.md + os códigos que só existem no cliente.
// Duplicar aqui é o ponto do teste: um código novo no backend sem mensagem quebra esta suíte.
const KNOWN_CODES = [
  'NOT_FOUND',
  'FORBIDDEN',
  'UNAUTHENTICATED',
  'BAD_REQUEST',
  'INVALID_PARAMETER',
  'MALFORMED_BODY',
  'VALIDATION_FAILED',
  'CONFLICT',
  'SESSION_ALREADY_ACTIVE',
  'CLIENT_LOG_CONFLICT',
  'RESOURCE_ALREADY_EXISTS',
  'DATA_CONFLICT',
  'STALE_WRITE',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'METHOD_NOT_ALLOWED',
  'INTERNAL_ERROR',
  'TOO_MANY_ATTEMPTS',
  'NETWORK',
  'UNEXPECTED_RESPONSE',
];

describe('messageForCode', () => {
  it.each(KNOWN_CODES)('has a specific PT-BR message for %s', (code) => {
    const message = messageForCode(code);

    expect(message).not.toBe(GENERIC_MESSAGE);
    expect(message.length).toBeGreaterThan(0);
  });

  it('falls back to the generic message for an unknown code', () => {
    expect(messageForCode('SOMETHING_NEW')).toBe(GENERIC_MESSAGE);
  });

  it('falls back when the code is empty', () => {
    expect(messageForCode('')).toBe(GENERIC_MESSAGE);
  });
});

describe('fieldMessages', () => {
  it('indexes field errors by field name', () => {
    const error = new ApiError({
      code: 'VALIDATION_FAILED',
      status: 400,
      fields: [
        { field: 'email', message: 'Email must be valid' },
        { field: 'password', message: 'too short' },
      ],
    });

    expect(fieldMessages(error)).toEqual({
      email: 'Email must be valid',
      password: 'too short',
    });
  });

  it('returns an empty map when the error has no field errors', () => {
    expect(fieldMessages(new ApiError({ code: 'CONFLICT', status: 409 }))).toEqual({});
  });
});

describe('messageForError', () => {
  it('uses the code mapping for an ApiError', () => {
    expect(messageForError(new ApiError({ code: 'NETWORK', status: 0 }))).toBe(
      messageForCode('NETWORK'),
    );
  });

  it('returns the generic message for anything that is not an ApiError', () => {
    expect(messageForError(new Error('boom'))).toBe(GENERIC_MESSAGE);
    expect(messageForError('boom')).toBe(GENERIC_MESSAGE);
  });
});

describe('messageForError — rate limit', () => {
  it('turns Retry-After into a human wait time', () => {
    const error = new ApiError({ code: 'TOO_MANY_ATTEMPTS', status: 429, retryAfterSeconds: 90 });

    expect(messageForError(error)).toBe('Muitas tentativas. Espere 2 min.');
  });

  it('falls back to the generic rate-limit message without the header', () => {
    const error = new ApiError({ code: 'TOO_MANY_ATTEMPTS', status: 429 });

    expect(messageForError(error)).toBe(messageForCode('TOO_MANY_ATTEMPTS'));
  });
});

describe('messageForError — falha de rede em desenvolvimento', () => {
  it('names the origin that could not be reached, so a stale IP is obvious', () => {
    const error = new ApiError({ code: 'NETWORK', status: 0, message: 'http://172.20.10.4:8080' });

    expect(messageForError(error)).toContain('http://172.20.10.4:8080');
  });

  it('keeps the friendly text when the error carries no origin', () => {
    const error = new ApiError({ code: 'NETWORK', status: 0 });

    expect(messageForError(error)).toBe(messageForCode('NETWORK'));
  });
});
