import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router';
import RoomsPage from './pages/RoomsPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import AppShell from './components/layout/AppShell';
import { useAnonProfile } from './hooks/useAnonProfile';
import { useAreaSelection } from './hooks/useAreaSelection';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

// Redeploy marker: 2026-02-07T14:32:00Z
function RootLayout() {
  // Initialize anonymous profile and area selection
  useAnonProfile();
  useAreaSelection();

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const roomsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: RoomsPage,
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat/$roomId',
  component: ChatPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const routeTree = rootRoute.addChildren([roomsRoute, chatRoute, settingsRoute, loginRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
