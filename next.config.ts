import type { NextConfig } from 'next';
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').trim().replace(/\/+$/, '');
const nextConfig: NextConfig = { output: 'export', trailingSlash: true, basePath, images: { unoptimized: true }, devIndicators: false, ...(process.env.SITE_EXPORT_DIR ? { distDir: process.env.SITE_EXPORT_DIR } : {}) };
export default nextConfig;
