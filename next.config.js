/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    env: {
        stackbitPreview: process.env.STACKBIT_PREVIEW
    },
    trailingSlash: false,
    reactStrictMode: true,
    allowedDevOrigins: [
        '192.168.1.84'
    ],
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**.supabase.co' },
            { protocol: 'https', hostname: '**.supabase.in' }
        ]
    }
};

module.exports = nextConfig;
