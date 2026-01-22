import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  async rewrites() {
    return [
      // Auth routes that need to go to backend
      {
        source: '/api/auth/register',
        destination: 'http://localhost:5000/api/auth/register',
      },
      {
        source: '/api/auth/verify-email',
        destination: 'http://localhost:5000/api/auth/verify-email',
      },
      {
        source: '/api/auth/resend-verification',
        destination: 'http://localhost:5000/api/auth/resend-verification',
      },
      // Other backend routes
      {
        source: '/api/clients/:path*',
        destination: 'http://localhost:5000/api/clients/:path*',
      },
      {
        source: '/api/invoices/:path*',
        destination: 'http://localhost:5000/api/invoices/:path*',
      },
      {
        source: '/api/settings/:path*',
        destination: 'http://localhost:5000/api/settings/:path*',
      },
      {
        source: '/api/dashboard/:path*',
        destination: 'http://localhost:5000/api/dashboard/:path*',
      },
      {
        source: '/api/portal/:path*',
        destination: 'http://localhost:5000/api/portal/:path*',
      },
      {
        source: '/api/admin/:path*',
        destination: 'http://localhost:5000/api/admin/:path*',
      },
      {
        source: '/api/upload/:path*',
        destination: 'http://localhost:5000/api/upload/:path*',
      },
      {
        source: '/api/custom-templates/:path*',
        destination: 'http://localhost:5000/api/custom-templates/:path*',
      },
      {
        source: '/api/newsletter/:path*',
        destination: 'http://localhost:5000/api/newsletter/:path*',
      },
      // Static uploads
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5000/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
