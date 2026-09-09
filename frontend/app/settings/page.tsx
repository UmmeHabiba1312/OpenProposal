"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../providers";
import { api } from "@/lib/api";

type ProviderInfo = { label: string; default_model: string | null; needs_base_url: boolean };

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [providers, setProviders] = useState<Record<string, ProviderInfo>>({});
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [hasExistingKey, setHasExistingKey] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.listProviders(), api.getSettings()])
      .then(([providerList, current]) => {
        setProviders(providerList);
        if (current.has_key) {
          setHasExistingKey(true);
          setProvider(current.provider || "openai");
          setModel(current.model || "");
          setCustomBaseUrl(current.custom_base_url || "");
        } else if (providerList.openai) {
          setModel(providerList.openai.default_model || "");
        }
      })
      .finally(() => setChecking(false));
  }, [user]);

  function handleProviderChange(p: string) {
    setProvider(p);
    const info = providers[p];
    if (info?.default_model) setModel(info.default_model);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!apiKey.trim() && !hasExistingKey) {
      setError("Add your API key.");
      return;
    }
    if (providers[provider]?.needs_base_url && !customBaseUrl.trim()) {
      setError("Add the base URL for your custom provider.");
      return;
    }

    setSaving(true);
    try {
      await api.saveSettings({
        provider,
        api_key: apiKey.trim() || "unchanged", // backend requires non-empty; see note below
        model: model.trim(),
        custom_base_url: customBaseUrl.trim() || undefined,
      });
      setSuccess("Saved. You're ready to generate proposals.");
      setHasExistingKey(true);
      setApiKey("");
    } catch (err: any) {
      setError(err.message || "Couldn't save your settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || checking) {
    return (
      <main className="min-h-screen flex items-center justify-center text-paper/40 text-sm">
        Loading…
      </main>
    );
  }

  const inputClass =
    "w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display italic text-3xl">API settings</h1>
          <Link href="/" className="text-sm text-paper/40 hover:text-paper shrink-0">
            ← Back to chat
          </Link>
        </div>
        <p className="text-paper/40 text-sm mb-8">
          Use your own API key so generating proposals runs on your account,
          not ours.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-paper/70 mb-2">Provider</label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className={inputClass}
            >
              {Object.entries(providers).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>

          {providers[provider]?.needs_base_url && (
            <div>
              <label className="block text-sm text-paper/70 mb-2">Base URL</label>
              <input
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
                placeholder="https://your-endpoint.example.com/v1"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-paper/70 mb-2">
              API key {hasExistingKey && <span className="text-paper/40">(leave blank to keep current key)</span>}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasExistingKey ? "••••••••••••" : "sk-..."}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm text-paper/70 mb-2">Model</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. gpt-4o-mini, claude-sonnet-4-5"
              className={inputClass}
            />
            <p className="text-paper/30 text-xs mt-1.5">
              Any model your provider supports on this endpoint.
            </p>
          </div>

          {error && <p className="text-seal text-sm">{error}</p>}
          {success && <p className="text-moss text-sm">{success}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-gold text-ink font-semibold py-3 text-sm hover:bg-gold/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </form>
      </div>
    </main>
  );
}