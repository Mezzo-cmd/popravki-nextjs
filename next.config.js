/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Забранява сайтът да се вгражда в iframe на друг сайт (кражба)
  { key: "X-Frame-Options", value: "DENY" },
  // Забранява браузъра да познава типа на файла
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer информация — само origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Разрешения за камера/микрофон/геолокация
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // XSS защита за стари браузъри
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Принудително HTTPS за 1 година
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Content Security Policy — блокира инжектиране на чужди скриптове
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
