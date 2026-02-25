const ALLOWED_ORIGINS = [
  'https://neuraltwin.com',
  'https://neuraltwin.website',
  /\.vercel\.app$/,
  /localhost:\d+/,
];

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o =>
    typeof o === 'string' ? o === origin : o.test(origin)
  ) ? origin : ALLOWED_ORIGINS[0] as string;

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  };
}

export function handleCorsOptions(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) });
  }
  return null;
}
