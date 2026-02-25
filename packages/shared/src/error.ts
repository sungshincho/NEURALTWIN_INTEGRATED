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
  const body: ErrorResponse = {
    success: false,
    error: { code, message, ...(details && { details }) },
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(req?.headers.get('origin')),
      'Content-Type': 'application/json',
    },
  });
}
