import { useState, useEffect } from 'react';
import { upsertUserSettings, resetAllProgress } from '../../services/storageService';
import { testConnection, refreshModels, PROVIDER_TIERS } from '../../services/aiService';
import type { TaskTier } from '../../services/aiService';
import { supabase } from '../../lib/supabase';
import { signOut } from '../../services/authService';
import type { User, UserSettings, AIProvider } from '../../types';

interface SettingsTabProps {
  user: User;
  settings: UserSettings | null;
  onSettingsChange: () => void;
}

const PROVIDERS: { id: AIProvider; label: string }[] = [
  { id: 'claude',   label: 'Claude (Anthropic)' },
  { id: 'groq',     label: 'Groq' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'gemini',   label: 'Google Gemini' },
  { id: 'zai',      label: 'Z.ai (GLM)' },
];

const TIER_LABELS: [TaskTier, string][] = [
  ['heavy',     'Briefs / Maps / Cards / Story'],
  ['reasoning', 'MCQ generation'],
  ['light',     'Error tagging'],
];

export default function SettingsTab({ user, settings, onSettingsChange }: SettingsTabProps) {
  const [provider, setProvider] = useState<AIProvider>(settings?.ai_provider ?? 'claude');
  const [apiKey, setApiKey] = useState(settings?.ai_api_key ?? '');
  const [currentDay, setCurrentDay] = useState(settings?.current_day ?? 1);
  const [currentTiers, setCurrentTiers] = useState<Record<TaskTier, string>>(
    () => ({ ...PROVIDER_TIERS[settings?.ai_provider ?? 'claude'] })
  );
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);
  const [testError, setTestError] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string>('');
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setProvider(settings.ai_provider);
      setApiKey(settings.ai_api_key);
      setCurrentDay(settings.current_day);
      setCurrentTiers({ ...PROVIDER_TIERS[settings.ai_provider] });
    }
  }, [settings]);

  useEffect(() => {
    // Check Supabase connection
    supabase.from('user_settings').select('id').limit(1).then(({ error }) => {
      setSupabaseStatus(error ? 'error' : 'connected');
    });
  }, []);

  function handleProviderChange(p: AIProvider) {
    setProvider(p);
    setCurrentTiers({ ...PROVIDER_TIERS[p] });
    setTestResult(null);
    setRefreshMsg('');
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await upsertUserSettings(user.id, {
        ai_provider: provider,
        ai_api_key: apiKey,
        ai_model: currentTiers.heavy, // store the heavy-tier model for DB compat
        current_day: currentDay,
      });
      setSaved(true);
      onSettingsChange();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    setTestError('');
    const result = await testConnection({ provider, apiKey, model: currentTiers.heavy });
    setTestResult(result.ok ? 'success' : 'fail');
    if (!result.ok && result.error) setTestError(result.error);
    setTesting(false);
  }

  async function handleRefreshModels() {
    setRefreshing(true);
    setRefreshMsg('');
    const { models, tiers } = await refreshModels(provider, apiKey);
    setCurrentTiers(tiers);
    setRefreshing(false);
    setRefreshMsg(
      models.length > 0
        ? `Found ${models.length} models — routing updated`
        : 'Could not reach models endpoint — defaults kept'
    );
  }

  async function handleReset() {
    setResetting(true);
    try {
      await resetAllProgress(user.id);
      onSettingsChange();
      setShowResetConfirm(false);
    } finally {
      setResetting(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    window.location.reload();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-th-text">Settings</h2>
        <p className="text-sm text-th-text-muted mt-1">AI configuration, study progress, and account</p>
      </div>

      {/* AI Configuration */}
      <div className="bg-th-card border border-th-border rounded-xl p-6 mb-4">
        <h3 className="text-sm font-semibold text-th-text mb-4">AI Provider</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-th-text-muted mb-1.5">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`p-3 rounded-lg border text-left text-sm transition-colors ${
                    provider === p.id
                      ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-200'
                      : 'bg-th-input border-th-border-strong text-th-text-muted hover:border-th-border-strong hover:text-th-text'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-th-text-muted mb-1.5">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Enter your API key..."
              className="w-full bg-th-input border border-th-border-strong rounded-lg px-3 py-2.5 text-th-text placeholder-th-text-faint text-sm focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="mt-1 text-xs text-th-text-faint">
              Stored securely in Supabase. Never sent to this server.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-th-text-muted">Smart Model Routing</label>
              <button
                onClick={handleRefreshModels}
                disabled={!apiKey || refreshing}
                className="text-xs text-blue-500 hover:text-blue-400 disabled:text-th-text-faint disabled:cursor-not-allowed transition-colors"
              >
                {refreshing ? 'Fetching...' : 'Refresh Models'}
              </button>
            </div>
            <div className="bg-th-input border border-th-border-strong rounded-lg p-3 space-y-2">
              {TIER_LABELS.map(([tier, label]) => (
                <div key={tier} className="flex items-baseline gap-3">
                  <span className="text-xs text-th-text-muted w-40 flex-shrink-0">{label}</span>
                  <span className="text-xs font-mono text-th-text truncate">{currentTiers[tier]}</span>
                </div>
              ))}
            </div>
            {refreshMsg && (
              <p className={`mt-1.5 text-xs ${refreshMsg.startsWith('Could') ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                {refreshMsg}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestConnection}
              disabled={!apiKey || testing}
              className="bg-th-hover hover:bg-th-hover disabled:bg-th-input disabled:cursor-not-allowed text-th-text-secondary text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            {testResult === 'success' && (
              <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
            )}
            {testResult === 'fail' && (
              <div className="flex flex-col">
                <span className="text-sm text-red-600 dark:text-red-400">Connection failed</span>
                {testError && (
                  <span className="text-xs text-red-500/80 dark:text-red-400/70 mt-0.5 max-w-xs break-all">{testError}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Study Progress */}
      <div className="bg-th-card border border-th-border rounded-xl p-6 mb-4">
        <h3 className="text-sm font-semibold text-th-text mb-4">Study Progress</h3>
        <div>
          <label className="block text-xs text-th-text-muted mb-1.5">Current Day (1–50)</label>
          <input
            type="number"
            value={currentDay}
            onChange={e => setCurrentDay(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
            min={1}
            max={50}
            className="w-24 bg-th-input border border-th-border-strong rounded-lg px-3 py-2 text-th-text text-sm focus:outline-none focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-th-text-faint">
            Advance your current day manually if needed.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl mb-6 transition-colors"
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>

      {/* Supabase Status */}
      <div className="bg-th-card border border-th-border rounded-xl p-6 mb-4">
        <h3 className="text-sm font-semibold text-th-text mb-3">Supabase Connection</h3>
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            supabaseStatus === 'connected' ? 'bg-green-500' :
            supabaseStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
          }`} />
          <span className="text-sm text-th-text-muted">
            {supabaseStatus === 'connected' ? 'Connected' :
             supabaseStatus === 'error' ? 'Connection error — data saved locally' :
             'Checking...'}
          </span>
        </div>
        <p className="text-xs text-th-text-faint mt-2">
          Account: {user.email}
        </p>
      </div>

      {/* Danger Zone */}
      <div className="bg-th-card border border-red-900/50 rounded-xl p-6 mb-4">
        <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">Danger Zone</h3>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="bg-red-50 dark:bg-red-900/30 hover:bg-red-900/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            Reset All Progress
          </button>
        ) : (
          <div>
            <p className="text-sm text-th-text-secondary mb-4">
              This will permanently delete all sessions, errors, and Anki cards. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={resetting}
                className="bg-red-700 hover:bg-red-600 disabled:bg-th-hover disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {resetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="bg-th-hover hover:bg-th-hover text-th-text-secondary text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full bg-th-input hover:bg-th-hover text-th-text-secondary hover:text-th-text font-medium py-3 rounded-xl transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
