import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    open: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        timeout: 30000,
      },
    },
  },

  build: {
    target: 'es2020',
    outDir: 'build',
    assetsDir: 'static',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            'lucide-react',
          ],
          'utils': [
            'axios',
            'date-fns',
          ],
        },
        entryFileNames: 'js/[name].[hash].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
            return 'images/[name].[hash][extname]'
          } else if (/\.woff2?$/.test(name ?? '')) {
            return 'fonts/[name].[hash][extname]'
          } else if (/\.css$/.test(name ?? '')) {
            return 'css/[name].[hash][extname]'
          }
          return '[name].[hash][extname]'
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@data': path.resolve(__dirname, './src/data'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },

  css: {
    postcss: './postcss.config.js',
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react', 'three', '@react-three/fiber', '@react-three/drei'],
    exclude: ['@vite/preload-helper'],
  },

  define: {
    'process.env': {},
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
  },
})
