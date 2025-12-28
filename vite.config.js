import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  // Use relative paths for assets (required for Capacitor mobile apps)
  base: './',

  plugins: [
    react(),

    // Gzip compression
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // Only compress files larger than 10KB
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false,
    }),

    // Brotli compression (better compression ratio than gzip)
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
      deleteOriginFile: false,
    }),

    // Bundle analyzer - creates stats.html to visualize bundle composition
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'sunburst', 'treemap', 'network'
    }),
  ],

  server: {
    port: 3000,
    // Security headers for development server
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },

  preview: {
    // Security headers for preview server
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    },
  },

  build: {
    // Target ES2015 for better Android WebView compatibility
    target: 'es2015',

    // Minification - use esbuild for production
    minify: 'esbuild',

    // Source maps disabled for production
    sourcemap: false,

    // Chunk size warnings
    chunkSizeWarningLimit: 500, // Warn if chunk > 500KB

    rollupOptions: {
      output: {
        // Use legacy format for better compatibility
        format: 'es',

        // Simpler chunk splitting - bundle everything together for now
        manualChunks: undefined,

        // Naming pattern for chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  // Optimize dependencies during dev
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'i18next',
      'react-i18next',
      'i18next-browser-languagedetector',
      'i18next-http-backend',
    ],
  },
});
