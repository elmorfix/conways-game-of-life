import './global.css';

export const metadata = {
  title: "Conway's Game of Life",
  description:
    'A cellular automaton simulation built with Next.js, Nx, and TypeScript.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
