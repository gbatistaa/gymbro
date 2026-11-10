import { ApiError, parseErrorResponse } from '../error';

describe('parseErrorResponse', () => {
  it('carries code, status, path and field errors from the contract', () => {
    const error = parseErrorResponse(400, {
      status: 400,
      code: 'VALIDATION_FAILED',
      message: 'must not be blank',
      path: '/api/auth/register',
      errors: [{ field: 'email', message: 'Email must be valid' }],
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.status).toBe(400);
    expect(error.path).toBe('/api/auth/register');
    expect(error.fields).toEqual([{ field: 'email', message: 'Email must be valid' }]);
  });

  it('never throws on a body that is not an ErrorResponse', () => {
    const error = parseErrorResponse(502, '<html>Bad Gateway</html>');

    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.status).toBe(502);
    expect(error.fields).toEqual([]);
    expect(error.path).toBeUndefined();
  });

  it('derives the code from the status when the body is empty', () => {
    expect(parseErrorResponse(401, undefined).code).toBe('UNAUTHENTICATED');
    expect(parseErrorResponse(403, undefined).code).toBe('FORBIDDEN');
    expect(parseErrorResponse(404, undefined).code).toBe('NOT_FOUND');
  });

  it('drops malformed field errors instead of trusting their shape', () => {
    const error = parseErrorResponse(400, {
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'email' }, { message: 'sem campo' }, 'lixo'],
    });

    expect(error.fields).toEqual([]);
  });

  it('keeps a domain code even without a message', () => {
    const error = parseErrorResponse(409, { code: 'SESSION_ALREADY_ACTIVE' });

    expect(error.code).toBe('SESSION_ALREADY_ACTIVE');
    expect(error.message).toBe('SESSION_ALREADY_ACTIVE');
  });
});

describe('parseErrorResponse — retry after', () => {
  it('carries retryAfterSeconds when the response says how long to wait', () => {
    const error = parseErrorResponse(429, { code: 'TOO_MANY_ATTEMPTS' }, 60);

    expect(error.code).toBe('TOO_MANY_ATTEMPTS');
    expect(error.retryAfterSeconds).toBe(60);
  });

  it('leaves retryAfterSeconds undefined when the header is absent', () => {
    expect(parseErrorResponse(429, { code: 'TOO_MANY_ATTEMPTS' }).retryAfterSeconds).toBeUndefined();
  });
});
