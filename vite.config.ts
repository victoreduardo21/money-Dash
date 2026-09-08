import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'recharts',
      'lucide-react',
      'motion/react',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'jspdf',
      'react-markdown',
    ],
  },
});