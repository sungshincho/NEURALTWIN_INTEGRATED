import { getCorsHeaders } from './cors';

export interface ErrorResponse {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  req?: Request,
  details?: unknown
): Response {
  const error: ErrorResponse['error'] = { code, message };
  if (details !== undefined) error.details = details;
  const body: ErrorResponse = { success: false, error };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(req?.headers.get('origin')),
      'Content-Type': 'application/json',
    },
  });
}
