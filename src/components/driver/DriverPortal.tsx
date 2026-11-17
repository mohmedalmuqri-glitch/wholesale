import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { DriverSession } from '@/types';
import { DriverLogin } from './DriverLogin';
import { DriverShell } from './DriverShell';

const SESSION_KEY = 'driver_session';

export function DriverPortal() {
  const [session, setSession] = useLocalStorage<DriverSession | null>(SESSION_KEY, null);

  if (!session) {
    return <DriverLogin onLogin={setSession} />;
  }

  return <DriverShell session={session} onLogout={() => setSession(null)} />;
}
