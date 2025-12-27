import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
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
    // Target modern browsers for smaller bundle
    target: 'es2015',

    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        comments: false, // Remove comments
      },
    },

    // Source maps (disable in production for smaller bundles)
    sourcemap: false,

    // Chunk size warnings
    chunkSizeWarningLimit: 500, // Warn if chunk > 500KB

    rollupOptions: {
      output: {
        // Manual chunk splitting strategy
        manualChunks: (id) => {
          // Vendor chunks - separate large libraries
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }

            // i18n libraries (separate chunk for better caching)
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'vendor-i18n';
            }

            // Capacitor plugins
            if (id.includes('@capacitor')) {
              return 'vendor-capacitor';
            }

            // Claude Agent SDK
            if (id.includes('@anthropic-ai')) {
              return 'vendor-claude';
            }

            // Other vendor code
            return 'vendor-other';
          }

          // i18n translation files - create separate chunks per language
          if (id.includes('/i18n/locales/')) {
            const match = id.match(/locales\/([a-z]{2})\//);
            if (match) {
              const lang = match[1];
              // Further split by namespace for granular loading
              if (id.includes('/common/')) return `i18n-${lang}-common`;
              if (id.includes('/dashboard/')) return `i18n-${lang}-dashboard`;
              if (id.includes('/workout/')) return `i18n-${lang}-workout`;
              if (id.includes('/exercises/')) return `i18n-${lang}-exercises`;
              if (id.includes('/training/')) return `i18n-${lang}-training`;
              if (id.includes('/stats/')) return `i18n-${lang}-stats`;
              if (id.includes('/settings/')) return `i18n-${lang}-settings`;
              if (id.includes('/auth/')) return `i18n-${lang}-auth`;
              if (id.includes('/calendar/')) return `i18n-${lang}-calendar`;

              return `i18n-${lang}`;
            }
          }

          // Component chunks - group by feature
          if (id.includes('/src/components/')) {
            return 'components';
          }

          if (id.includes('/src/pages/')) {
            return 'pages';
          }

          if (id.includes('/src/hooks/')) {
            return 'hooks';
          }
        },

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
