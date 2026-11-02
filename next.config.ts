import type { NextConfig } from 'next';

/**
 * Static export para GitHub Pages / hospedagem estática.
 * Defina NEXT_PUBLIC_BASE_PATH=/nome-do-repo se publicar em
 * https://usuario.github.io/nome-do-repo/
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
};

export default nextConfig;
