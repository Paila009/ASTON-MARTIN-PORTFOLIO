const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').trim().replace(/\/+$/, '');

/** Prefix a raw path to a file in public/. Route links should use next/link. */
export function publicPath(path: string): string {
  return path.startsWith('/') && !path.startsWith('//') ? `${basePath}${path}` : path;
}
