
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Add the allowedDevOrigins configuration
  experimental: {
    allowedDevOrigins: [
      // This should match the origin Next.js reports in the warning
      'http://9003-firebase-studio-1746941702181.cluster-t23zgfo255e32uuvburngnfnn4.cloudworkstations.dev',
      // It's also good practice to include localhost if you access it directly
      'http://localhost:9003',
    ],
  },
};

export default nextConfig;
