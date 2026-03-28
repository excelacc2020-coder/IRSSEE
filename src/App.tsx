import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TodayTab from './components/tabs/TodayTab';
import DashboardTab from './components/tabs/DashboardTab';
import CardsTab from './components/tabs/CardsTab';
import SettingsTab from './components/tabs/SettingsTab';
import AuthGate from './components/AuthGate';
import { getSession, onAuthStateChange } from './services/authService';
import { getAllSessions, getUserSettings } from './services/storageService';
import type { ActiveTab, User, Session, UserSettings } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [viewingDay, setViewingDay] = useState<number>(1);

  // Load user data
  const loadUserData = useCallback(async (userId: string) => {
    const [fetchedSessions, fetchedSettings] = await Promise.all([
      getAllSessions(userId),
      getUserSettings(userId),
    ]);
    setSessions(fetchedSessions);

    if (fetchedSettings) {
      setSettings(fetchedSettings);
      setViewingDay(fetchedSettings.current_day);
    } else {
      setViewingDay(1);
    }
  }, []);

  useEffect(() => {
    // Initial session check
    getSession().then((sessionUser) => {
      setUser(sessionUser);
      setLoadingAuth(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((sessionUser) => {
      setUser(sessionUser);
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData(user.id);
    }
  }, [user, loadUserData]);

  const refreshData = useCallback(() => {
    if (user) {
      loadUserData(user.id);
    }
  }, [user, loadUserData]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        <div className="animate-pulse">Loading command center...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthGate onAuth={() => {}} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentDay={settings?.current_day ?? 1}
        sessions={sessions}
        onDaySelect={setViewingDay}
      />

      <main className="flex-1 overflow-auto lg:mt-0 mt-12">
        {activeTab === 'today' && (
          <TodayTab
            user={user}
            viewingDay={viewingDay}
            settings={settings}
            onDataChange={refreshData}
          />
        )}
        {activeTab === 'dashboard' && (
          <DashboardTab user={user} />
        )}
        {activeTab === 'cards' && (
          <CardsTab user={user} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            user={user}
            settings={settings}
            onSettingsChange={refreshData}
          />
        )}
      </main>
    </div>
  );
}
