import { Inter, Lora } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'] });

export const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
});