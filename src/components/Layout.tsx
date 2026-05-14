import type { ReactNode } from 'react';
import { HeaderBrand } from './HeaderBrand';
import { InstructionsPanel } from './InstructionsPanel';

interface LayoutProps {
  children: ReactNode;
  dashboard: ReactNode;
}

export function Layout({ children, dashboard }: LayoutProps) {
  return (
    <div className="app-shell">
      <div className="app-shell-overlay" aria-hidden />
      <div className="app-grid">
        <HeaderBrand />
        <main className="play-area">{children}</main>
        <InstructionsPanel />
        {dashboard}
      </div>
    </div>
  );
}
