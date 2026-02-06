import { Link, useRouterState } from '@tanstack/react-router';
import { MessageSquare, Settings, MapPin } from 'lucide-react';
import { useAreaSelection } from '../../hooks/useAreaSelection';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const routerState = useRouterState();
  const { selection } = useAreaSelection();
  const currentPath = routerState.location.pathname;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-16 items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center min-w-0 shrink">
            <img 
              src="/assets/generated/chugli-logo-uploaded.dim_512x512.png" 
              alt="Chugli" 
              className="h-10 sm:h-12 w-auto object-contain block" 
            />
          </Link>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline truncate">{selection.areaLabel || 'Select area'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-16 items-center justify-around px-4">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              currentPath === '/' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs font-medium">Rooms</span>
          </Link>

          <Link
            to="/settings"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              currentPath === '/settings' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs font-medium">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
