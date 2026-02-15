/** @type {import('next').NextConfig} */
const nextConfig = {
  // Отключаем проверку типов при сборке
  typescript: {
    ignoreBuildErrors: true,
  },
  // Отключаем ESLint при сборке
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;