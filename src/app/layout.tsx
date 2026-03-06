import type { Metadata } from 'next';
import '../css/main.css';
import './globals.css';

export const metadata: Metadata = {
    title: 'TelecomOps - Panel de Gestión',
    description: 'Sistema de gestión para unidad de negocios de telecomunicaciones'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
            <body className="bg-gray-50 text-gray-900 antialiased">
                {children}
            </body>
        </html>
    );
}
