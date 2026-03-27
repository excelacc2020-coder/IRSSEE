import { useState, useEffect } from 'react';
import { upsertUserSettings, resetAllProgress } from '../../services/storageService';
import { testConnection } from '../../services/aiService';
import { supabase } from '../../lib/supabase';
import { signOut } from '../../services/authService';
import type { User, UserSettings, AIProvider } from '../../types';

interface SettingsTabProps {
  user: User;
  settings: UserSettings | null;
  onSettingsChange: () => void;
}

const PROVIDERS: { id: AIProvider; label: string; models: string[] }[] = [
  {
    id: 'claude',
    label: 'Claude (Anthropic)',
    models: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  },
  {
    id: 'groq',
    label: 'Groq',
    models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'llama3-8b-8192'],
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
];

export default function SettingsTab({ user, settings, onSettingsChange }: SettingsTabProps) {
  const [provider, setProvider] = useState<AIProvider>(settings?.ai_provider ?? 'claude');
  const [apiKey, setApiKey] = useState(settings?.ai_api_key ?? '');
  const [model, setModel] = useState(settings?.ai_model ?? 'claude-opus-4-6');
  const [currentDay, setCurrentDay] = useState(settings?.current_day ?? 1);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setProvider(settings.ai_provider);
      setApiKey(settings.ai_api_key);
      setModel(settings.ai_model);
      setCurrentDay(settings.current_day);
    }
  }, [settings]);

  useEffect(() => {
    // Check Supabase connection
    supabase.from('user_settings').select('id').limit(1).then(({ error }) => {
      setSupabaseStatus(error ? 'error' : 'connected');
    });
  }, []);

  const providerModels = PROVIDERS.find(p => p.id === provider)?.models ?? [];

  function handleProviderChange(p: AIProvider) {
    setProvider(p);
    setModel(PROVIDERS.find(pr => pr.id === p)?.models[0] ?? '');
    setTestResult(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await upsertUserSettings(user.id, {
        ai_provider: provider,
        ai_api_key: apiKey,
        ai_model: model,
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
    const ok = await testConnection({ provider, apiKey, model });
    setTestResult(ok ? 'success' : 'fail');
    setTesting(false);
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
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-sm text-gray-400 mt-1">AI configuration, study progress, and account</p>
      </div>

      {/* AI Configuration */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
        <h3 className="text-sm font-semibold text-white mb-4">AI Provider</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`p-3 rounded-lg border text-left text-sm transition-colors ${
                    provider === p.id
                      ? 'bg-blue-900/40 border-blue-700 text-blue-200'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {provider === 'claude' && (
              <p className="mt-2 text-xs text-blue-400">
                Smart Hybrid routing: Opus 4.6 for briefs/mind maps/cards, Haiku 4.5 for MCQs/categorization
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Enter your API key..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="mt-1 text-xs text-gray-600">
              Stored securely in Supabase. Never sent to this server.
            </p>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Model {provider === 'claude' ? '(default — overridden by Smart Hybrid)' : ''}
            </label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-200 text-sm focus:outline-none focus:border-blue-500"
            >
              {providerModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestConnection}
              disabled={!apiKey || testing}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            {testResult === 'success' && (
              <span className="text-sm text-green-400">Connected</span>
            )}
            {testResult === 'fail' && (
              <span className="text-sm text-red-400">Connection failed — check your API key</span>
            )}
          </div>
        </div>
      </div>

      {/* Study Progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
        <h3 className="text-sm font-semibold text-white mb-4">Study Progress</h3>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Current Day (1–50)</label>
          <input
            type="number"
            value={currentDay}
            onChange={e => setCurrentDay(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
            min={1}
            max={50}
            className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-600">
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
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
        <h3 className="text-sm font-semibold text-white mb-3">Supabase Connection</h3>
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            supabaseStatus === 'connected' ? 'bg-green-500' :
            supabaseStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
          }`} />
          <span className="text-sm text-gray-400">
            {supabaseStatus === 'connected' ? 'Connected' :
             supabaseStatus === 'error' ? 'Connection error — data saved locally' :
             'Checking...'}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Account: {user.email}
        </p>
      </div>

      {/* Danger Zone */}
      <div className="bg-gray-900 border border-red-900/50 rounded-xl p-6 mb-4">
        <h3 className="text-sm font-semibold text-red-400 mb-3">Danger Zone</h3>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="bg-red-900/30 hover:bg-red-900/60 border border-red-800 text-red-300 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            Reset All Progress
          </button>
        ) : (
          <div>
            <p className="text-sm text-gray-300 mb-4">
              This will permanently delete all sessions, errors, and Anki cards. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={resetting}
                className="bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {resetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
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
        className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium py-3 rounded-xl transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
