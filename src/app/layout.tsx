import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Shell from '@/components/Shell';
import { publicPath } from '@/lib/public-path';

const displayFont = localFont({
 src: [
  { path: '../../public/fonts/BarlowCondensed-SemiBold.ttf', weight: '600' },
  { path: '../../public/fonts/BarlowCondensed-Bold.ttf', weight: '700' },
 ],
 variable: '--font-barlow', display: 'swap', preload: false, adjustFontFallback: false,
});
const bodyFont = localFont({
 src: [
  { path: '../../public/fonts/Inter-Regular.ttf', weight: '400' },
  { path: '../../public/fonts/Inter-Medium.ttf', weight: '500' },
  { path: '../../public/fonts/Inter-SemiBold.ttf', weight: '600' },
 ],
 variable: '--font-inter', display: 'swap', preload: false, adjustFontFallback: false,
});
const siteUrl = new URL(process.env.SITE_URL || 'https://aston-martin-the-pursuit.pailaakash041.chatgpt.site');

export const metadata: Metadata = {
 title: { default: 'Aston Martin / The Pursuit', template: '%s / The Pursuit' },
 description: 'Every curve. Every thousandth. An independent exploration of Aston Martin Formula One: the people, the machine, the pursuit.',
 metadataBase: siteUrl,
 openGraph: { title: 'Aston Martin / The Pursuit', description: 'Every curve. Every thousandth.', images: [new URL(publicPath('/images/hero.jpg'), siteUrl)] }
};
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}><body><a className="skip-link" href="#main">Skip to content</a><Shell>{children}</Shell></body></html>;
}
