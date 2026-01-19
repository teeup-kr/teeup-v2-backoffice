import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';
import path from 'path';

export default defineConfig(({ mode }) => {
  // 프로젝트 루트 디렉토리 경로
  const rootDir = path.resolve(__dirname, '.');
  const env = loadEnv(mode, rootDir, '');
  const API_URL = env.VITE_APP_BASE_NAME || '/';
  
  // Admin 개발 서버 포트 (환경변수 필수)
  const ADMIN_PORT = env.VITE_ADMIN_PORT;
  if (!ADMIN_PORT) {
    throw new Error('VITE_ADMIN_PORT 환경 변수가 설정되지 않았습니다.');
  }
  const adminPortNum = parseInt(ADMIN_PORT, 10);
  if (isNaN(adminPortNum) || adminPortNum <= 0) {
    throw new Error(`VITE_ADMIN_PORT가 유효하지 않습니다: ${ADMIN_PORT}`);
  }
  
  // Backend API 서버 포트 (환경변수 필수)
  const BACKEND_PORT = env.VITE_BACKEND_PORT;
  if (!BACKEND_PORT) {
    throw new Error('VITE_BACKEND_PORT 환경 변수가 설정되지 않았습니다.');
  }
  const backendPortNum = parseInt(BACKEND_PORT, 10);
  if (isNaN(backendPortNum) || backendPortNum <= 0) {
    throw new Error(`VITE_BACKEND_PORT가 유효하지 않습니다: ${BACKEND_PORT}`);
  }
  
  // 개발 서버 프록시 타겟 (환경변수로 설정, 없으면 localhost 백엔드 사용)
  const DEV_API_TARGET = env.VITE_API_BASE_URL || env.VITE_DEV_API_TARGET || `http://localhost:${backendPortNum}`;

  return {
    base: API_URL,
    
    envDir: rootDir, // 루트 디렉토리의 .env 파일 사용 (절대 경로)
    
    server: {
      open: true,
      port: adminPortNum,
      host: true,
      proxy: {
        '/api': {
          target: DEV_API_TARGET,
          changeOrigin: true
        }
      }
    },
    preview: {
      port: adminPortNum,        // dev와 동일한 포트
      open: true,
      host: true,
      proxy: {
        '/api': {
          target: DEV_API_TARGET,
          changeOrigin: true,
        },
      },
    },
    define: {
      global: 'window',
      // 환경 변수를 클라이언트에 명시적으로 주입
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || 'http://localhost:8002'),
    },
    resolve: {
      alias: {
        '@ant-design/icons': path.resolve(__dirname, 'node_modules/@ant-design/icons')
        // Add more aliases as needed
      }
    },
    plugins: [
      react(),
      jsconfigPaths(),
    ],
    build: {
      chunkSizeWarningLimit: 1000,
      sourcemap: true,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || '';
            const ext = name.split('.').pop();
            if (/\.css$/.test(name)) return `css/[name]-[hash].${ext}`;
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(name)) return `images/[name]-[hash].${ext}`;
            if (/\.(woff2?|eot|ttf|otf)$/.test(name)) return `fonts/[name]-[hash].${ext}`;
            return `assets/[name]-[hash].${ext}`;
          }
        }
      },
      // 프로덕션에서도 디버깅을 위해 console 로그 유지 (임시)
      // ...(mode === 'production' && {
      //   esbuild: {
      //     drop: ['console', 'debugger'],
      //     pure: ['console.log', 'console.info', 'console.debug', 'console.warn']
      //   }
      // })
    },
    optimizeDeps: {
      include: ['@mui/material/Tooltip', 'react', 'react-dom', 'react-router-dom']
    }
  };
});