const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self' https:;
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;
              frame-src https://checkout-demo.airwallex.com;
              connect-src 'self' http://192.168.1.23:5000 http://localhost:5000 https://api-demo.airwallex.com https://checkout-demo.airwallex.com;
              img-src 'self' data: https:;
              style-src 'self' 'unsafe-inline' https:;
            `.replace(/\n/g, ""),
          },
        ],
      },
    ];
  },
};

export default nextConfig;