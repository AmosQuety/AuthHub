import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const buildTarget = env.VITE_BUILD_TARGET ?? (mode === 'user' ? 'user' : 'full')
  const includeAdmin = buildTarget !== 'user'
  const includeDeveloper = buildTarget !== 'user'

  return {
    // Vite 7 Environments API
    environments: {
      client: {
        define: {
          __INCLUDE_ADMIN__: JSON.stringify(includeAdmin),
          __INCLUDE_DEVELOPER__: JSON.stringify(includeDeveloper),
        }
      },
      user: {
        define: {
          __INCLUDE_ADMIN__: 'false',
          __INCLUDE_DEVELOPER__: 'false',
        }
      }
    },
    plugins: [
      react(),
      tailwindcss(),
      ViteImageOptimizer({
        svg: {
          multipass: true,
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  cleanupNumericValues: false,
                  removeViewBox: false,
                },
              },
            },
            'sortAttrs',
          ],
        },
        png: { quality: 80 },
        jpeg: { quality: 80 },
        jpg: { quality: 80 },
        webp: { lossless: true },
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 10240,
        deleteOriginFile: false,
      }),
      visualizer({
        filename: 'dist/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@app-root': path.resolve(
          __dirname,
          includeAdmin ? './src/App.tsx' : './src/App.user.tsx',
        ),
      },
    },
    define: {
      __INCLUDE_ADMIN__: JSON.stringify(includeAdmin),
      __INCLUDE_DEVELOPER__: JSON.stringify(includeDeveloper),
    },
    build: {
      cssMinify: 'lightningcss',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/recharts')) {
              return 'vendor-recharts'
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-lucide'
            }
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          },
        },
      },
    },
  }
})
