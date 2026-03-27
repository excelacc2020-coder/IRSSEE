import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TodayTab from './components/tabs/TodayTab';
import DashboardTab from './components/tabs/DashboardTab';
import CardsTab from './components/tabs/CardsTab';
import SettingsTab from './components/tabs/SettingsTab';
import { getAllSessions, getUserSettings } from './services/storageService';
import type { ActiveTab, User, Session, UserSettings } from './types';

// DEV MODE: auth bypassed — using local mock user
const DEV_USER: User = { id: 'local-dev-user', email: 'dev@local' };

export default function App() {
  const user: User = DEV_USER;
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
    loadUserData(user.id);
  }, [user.id, loadUserData]);

  const refreshData = useCallback(() => {
    loadUserData(user.id);
  }, [user.id, loadUserData]);

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
