'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Automation, ExecutionLog } from '@/types/database';
import {
  Play,
  CheckCircle2,
  Activity,
  Zap,
  Clock,
  Plus,
  Copy,
  Check,
  Code2,
  Send,
  LogOut,
  ChevronRight,
  Info,
  Radio,
  Sliders,
  Key,
  Trash2,
  ShieldCheck,
  Lock,
  Cpu,
  BarChart3,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ApiKeyItem {
  id: string;
  name: string;
  createdAt: string;
}

type SupportedActionType = 'send_email' | 'slack_webhook' | 'discord_webhook' | 'http_post';

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function calculateP95(sortedLatencies: number[]): number {
  if (sortedLatencies.length === 0) return 0;
  const idx = Math.min(
    sortedLatencies.length - 1,
    Math.max(0, Math.ceil(sortedLatencies.length * 0.95) - 1),
  );
  return sortedLatencies[idx] ?? 0;
}

export default function DashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [selectedAuto, setSelectedAuto] = useState<Automation | null>(null);

  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Status de cópia
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal de Criação de Automação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAutoName, setNewAutoName] = useState('');
  const [newTriggerType, setNewTriggerType] = useState<'webhook'>('webhook');
  const [newActionType, setNewActionType] = useState<SupportedActionType>('send_email');
  const [newActionUrl, setNewActionUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal de Criação de API Key
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [keyModalError, setKeyModalError] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [generatedKeyResult, setGeneratedKeyResult] = useState<{ name: string; rawToken: string } | null>(null);

  // Simulador de Payload
  const [simulatorEmail, setSimulatorEmail] = useState('cliente@exemplo.com');
  const [simulatorName, setSimulatorName] = useState('João Santos');
  const [simulatorPhone, setSimulatorPhone] = useState('5511999998888');
  const [simulatorMessage, setSimulatorMessage] = useState('Sua compra #4829 foi aprovada com sucesso!');
  const [simulatorBearerToken, setSimulatorBearerToken] = useState('');
  const [showBearerToken, setShowBearerToken] = useState(false);
  const [loadingTest, setLoadingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Filtros e Busca de Logs
  const [logFilterStatus] = useState<'all' | 'success' | 'failed'>('all');
  const [logSearchQuery] = useState('');

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchAutomations = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/automations', { signal, cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      if (!isMountedRef.current || !Array.isArray(json.data)) return;
      setAutomations(json.data);
      setSelectedAuto((prev) => {
        if (prev) {
          const updated = json.data.find((item: Automation) => item.id === prev.id);
          return updated ?? (json.data[0] ?? null);
        }
        return json.data[0] ?? null;
      });
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        console.error('Erro ao buscar automações.');
      }
    }
  }, []);

  const fetchLogs = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/logs', { signal, cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      if (!isMountedRef.current || !Array.isArray(json.data)) return;
      setLogs(json.data);
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        console.error('Erro ao buscar logs.');
      }
    }
  }, []);

  const fetchApiKeys = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/keys', { signal, cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      if (!isMountedRef.current || !Array.isArray(json.data)) return;
      setApiKeys(json.data);
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        console.error('Erro ao buscar chaves.');
      }
    }
  }, []);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;

    const controller = new AbortController();
    setIsLoadingInitial(true);
    Promise.all([
      fetchAutomations(controller.signal),
      fetchLogs(controller.signal),
      fetchApiKeys(controller.signal),
    ]).finally(() => {
      if (isMountedRef.current) setIsLoadingInitial(false);
    });

    const interval = setInterval(() => {
      fetchLogs(controller.signal);
    }, 3500);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [authStatus, fetchAutomations, fetchLogs, fetchApiKeys]);

  const handleCreateAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAutoName.trim()) {
      setCreateError('Informe um nome para a automação.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const payload: Record<string, string> = {
        name: newAutoName.trim(),
        trigger_type: newTriggerType,
        action_type: newActionType,
      };
      if (newActionType !== 'send_email' && newActionUrl.trim()) {
        payload.action_url = newActionUrl.trim();
      }

      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao criar automação');

      setAutomations((prev) => [data.data, ...prev]);
      setSelectedAuto(data.data);
      setNewAutoName('');
      setNewActionUrl('');
      setIsModalOpen(false);
      setBannerNotice({ type: 'success', text: `Automação "${data.data.name}" criada com sucesso.` });
    } catch (err) {
      setCreateError(getErrorMessage(err, 'Erro ao criar automação.'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      setKeyModalError('Informe um nome para identificar a chave.');
      return;
    }

    setIsGeneratingKey(true);
    setKeyModalError(null);

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar chave');

      setGeneratedKeyResult({
        name: data.data.name,
        rawToken: data.data.rawToken,
      });

      setSimulatorBearerToken(data.data.rawToken);
      await fetchApiKeys();
      setNewKeyName('');
    } catch (err) {
      setKeyModalError(getErrorMessage(err, 'Erro ao criar chave.'));
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      const res = await fetch(`/api/keys?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Não foi possível revogar a chave.');
      }
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      setConfirmRevokeId(null);
      setBannerNotice({ type: 'success', text: 'Chave de API revogada com sucesso.' });
    } catch (err) {
      setBannerNotice({ type: 'error', text: getErrorMessage(err, 'Erro ao revogar chave.') });
    }
  };

  const handleCopyWebhookUrl = async (id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = `${origin}/api/webhooks/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => {
        if (isMountedRef.current) setCopiedId(null);
      }, 2000);
    } catch {
      setBannerNotice({ type: 'error', text: 'Não foi possível copiar a URL automaticamente.' });
    }
  };

  const handleCopyCodeSnippet = async (snippet: string) => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedCode(true);
      setTimeout(() => {
        if (isMountedRef.current) setCopiedCode(false);
      }, 2000);
    } catch {
      setBannerNotice({ type: 'error', text: 'Não foi possível copiar o snippet cURL.' });
    }
  };

  const handleCopyText = async (text: string, keyIdentifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyIdentifier);
      setTimeout(() => {
        if (isMountedRef.current) setCopiedKey(null);
      }, 2000);
    } catch {
      setBannerNotice({ type: 'error', text: 'Não foi possível copiar o token.' });
    }
  };

  const applyPreset = (type: 'checkout' | 'server' | 'payment') => {
    if (type === 'checkout') {
      setSimulatorEmail('cliente.compras@empresa.com');
      setSimulatorName('Marina Duarte');
      setSimulatorMessage('Pedido #9021 aprovado! 1x MacBook Pro M3.');
    } else if (type === 'server') {
      setSimulatorEmail('devops@minhaempresa.com');
      setSimulatorName('Alerta Cloud');
      setSimulatorMessage('CRITICAL: CPU em 98% no nó Kubernetes prod-us-east-1.');
    } else if (type === 'payment') {
      setSimulatorEmail('financeiro@cliente.com.br');
      setSimulatorName('Boleto Pix');
      setSimulatorMessage('Pix de R$ 1.250,00 compensado com sucesso.');
    }
  };

  const handleSimulateWebhook = async () => {
    if (!selectedAuto) return;
    if (!simulatorBearerToken.trim()) {
      setTestResult({
        success: false,
        message: 'Informe ou gere uma API Key Bearer antes de disparar o evento.',
      });
      return;
    }

    setLoadingTest(true);
    setTestResult(null);

    try {
      const response = await fetch(`/api/webhooks/${encodeURIComponent(selectedAuto.id)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${simulatorBearerToken.trim()}`,
        },
        body: JSON.stringify({
          email: simulatorEmail,
          name: simulatorName,
          phone: simulatorPhone,
          message: simulatorMessage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro na resposta do webhook');
      }

      setTestResult({
        success: true,
        message: `Status 200 OK — Resposta entregue em ${data.latency_ms}ms`,
      });

      await fetchLogs();
    } catch (err) {
      setTestResult({
        success: false,
        message: `Falha: ${getErrorMessage(err, 'Erro inesperado')}`,
      });
      await fetchLogs();
    } finally {
      if (isMountedRef.current) setLoadingTest(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (logFilterStatus !== 'all' && log.status !== logFilterStatus) return false;
      if (logSearchQuery.trim()) {
        const query = logSearchQuery.toLowerCase();
        const payloadString = JSON.stringify(log.payloadSummary).toLowerCase();
        const errorString = (log.errorMessage || '').toLowerCase();
        return payloadString.includes(query) || errorString.includes(query);
      }
      return true;
    });
  }, [logs, logFilterStatus, logSearchQuery]);

  const successCount = logs.filter((l) => l.status === 'success').length;
  const successRate = logs.length > 0 ? ((successCount / logs.length) * 100).toFixed(1) : '100.0';
  const sortedLatencies = useMemo(
    () => logs.map((l) => (typeof l.latencyMs === 'number' ? l.latencyMs : 0)).sort((a, b) => a - b),
    [logs],
  );
  const avgLatency =
    sortedLatencies.length > 0
      ? Math.round(sortedLatencies.reduce((acc, cur) => acc + cur, 0) / sortedLatencies.length)
      : 0;
  const p95Latency = calculateP95(sortedLatencies);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const currentWebhookUrl = selectedAuto ? `${origin}/api/webhooks/${selectedAuto.id}` : '';

  const curlSnippet = `curl -X POST ${currentWebhookUrl} \\
  -H "Authorization: Bearer ${simulatorBearerToken || '<SUA_API_KEY>'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "${simulatorEmail}",
    "name": "${simulatorName}",
    "message": "${simulatorMessage}"
  }'`;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 sm:p-8 font-sans bg-grid-pattern relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-500/10 blur-[140px] pointer-events-none rounded-full" />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/[0.08] pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/40 transition">
                <Zap size={20} className="fill-cyan-400" />
              </div>
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                nexus<span className="text-cyan-400">flow</span>
              </span>
            </Link>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 font-mono border border-cyan-400/20 tracking-wider">
              ENTERPRISE SECURITY v2.5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 font-light">
            Painel analítico de orquestração de webhooks, proteção de dados e telemetria de rede.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {session?.user?.email && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-panel text-xs text-slate-300 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{session.user.email}</span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-slate-400 hover:text-rose-400 ml-1.5 transition"
                aria-label="Sair da conta"
                title="Sair da conta"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}

          <Link
            href="/pricing"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-panel text-cyan-300 hover:text-white text-xs font-mono border-cyan-500/30 hover:bg-slate-800/40 transition"
          >
            <Sparkles size={14} className="text-cyan-400" /> Planos &amp; Upgrade
          </Link>

          <button
            type="button"
            onClick={() => {
              setKeyModalError(null);
              setIsKeyModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-panel hover:bg-slate-800/60 text-slate-200 text-xs font-mono transition border-white/10 hover:border-cyan-500/30"
          >
            <Key size={14} className="text-amber-400" /> Gerenciar API Keys ({apiKeys.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 text-xs sm:text-sm font-bold transition shadow-lg shadow-cyan-500/20 font-mono"
          >
            <Plus size={16} /> Nova Regra
          </button>

          <button
            type="button"
            onClick={() => {
              fetchLogs();
              fetchAutomations();
              fetchApiKeys();
            }}
            title="Atualizar telemetria"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-panel text-cyan-300 text-xs font-mono border-cyan-500/20 hover:bg-slate-800/40 transition"
          >
            <Radio size={14} className="text-cyan-400 animate-pulse" /> Live Telemetry
          </button>
        </div>
      </header>

      {bannerNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-6 p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 relative z-10 ${bannerNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
        >
          <span>{bannerNotice.text}</span>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
            className="text-xs underline hover:opacity-80"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="mb-8 p-4 rounded-2xl glass-panel border-white/[0.08] relative z-10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-white font-bold flex items-center gap-2">
              Arquitetura Blindada de Dados
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                LGPD &amp; GDPR Ready
              </span>
            </div>
            <p className="text-slate-400 text-[11px] font-light">
              Senhas em Bcrypt · Chaves em Hash SHA-256 · Conexão TLS/SSL · Headers de segurança ativos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-white/5 text-[11px] text-cyan-300 flex items-center gap-1">
            <Lock size={12} className="text-cyan-400" /> Isolamento Multi-Tenant
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-white/5 text-[11px] text-indigo-300 flex items-center gap-1">
            <Cpu size={12} className="text-indigo-400" /> Zero-Leakage Sanitized
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL EXECUTIONS</span>
            <Activity size={15} className="text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono mt-2.5 text-white tracking-tight">
            {filteredLogs.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">Eventos persistidos</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>SUCCESS RATE</span>
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono mt-2.5 text-emerald-400 tracking-tight">
            {successRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">Taxa de assertividade</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AVG LATENCY</span>
            <Clock size={15} className="text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono mt-2.5 text-white tracking-tight">
            {avgLatency}ms
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">Média por requisição</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>P95 LATENCY</span>
            <BarChart3 size={15} className="text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono mt-2.5 text-indigo-400 tracking-tight">
            {p95Latency}ms
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">95% abaixo deste tempo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 relative z-10">
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <h2 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sliders size={15} className="text-cyan-400" /> Pipelines Ativos
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">{automations.length} total</span>
            </div>

            {isLoadingInitial ? (
              <p className="text-xs text-slate-400 py-6 text-center font-mono" role="status">
                Carregando pipelines...
              </p>
            ) : automations.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center font-mono">
                Nenhum pipeline configurado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {automations.map((auto) => {
                  const isSelected = selectedAuto?.id === auto.id;
                  return (
                    <div
                      key={auto.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedAuto(auto)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedAuto(auto);
                        }
                      }}
                      className={`p-4 rounded-xl transition cursor-pointer relative overflow-hidden ${isSelected
                          ? 'bg-slate-900/90 border border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-950/70 border border-white/[0.06] hover:border-white/20'
                        }`}
                    >
                      {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400" />}

                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-white">{auto.name}</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {auto.isActive ? 'ACTIVE' : 'PAUSED'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mb-3">
                        <span className="text-cyan-400 font-semibold">{auto.triggerType}</span>
                        <span className="text-slate-600">→</span>
                        <span className="text-indigo-400 font-semibold">{auto.actionType}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyWebhookUrl(auto.id);
                          }}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-white/[0.08] text-[11px] font-mono text-slate-300 transition flex items-center justify-center gap-1.5"
                        >
                          {copiedId === auto.id ? (
                            <>
                              <Check size={12} className="text-emerald-400" /> Copiado!
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> Copiar URL Endpoint
                            </>
                          )}
                        </button>
                        <span className="text-slate-500 text-xs">
                          <ChevronRight size={16} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {selectedAuto ? (
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4 mb-6">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                    PIPELINE SELECIONADO
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5 font-mono">{selectedAuto.name}</h3>
                </div>
                <div className="text-xs font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/5 truncate max-w-sm">
                  endpoint: /api/webhooks/{selectedAuto.id}
                </div>
              </div>

              <div className="mb-6 p-3 rounded-xl bg-slate-950/60 border border-white/5 flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="text-slate-400 text-[11px] flex items-center gap-1 mr-1">
                  <Layers size={13} className="text-cyan-400" /> Presets de Exemplo:
                </span>
                <button
                  type="button"
                  onClick={() => applyPreset('checkout')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-cyan-300 text-[11px] transition"
                >
                  E-commerce Checkout
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('server')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-rose-300 text-[11px] transition"
                >
                  Alerta Infra/DevOps
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('payment')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-emerald-300 text-[11px] transition"
                >
                  Confirmação Pix
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Send size={14} className="text-cyan-400" /> Injeção de Payload de Teste
                  </h4>

                  <div className="space-y-3 text-xs font-mono">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="sim-bearer" className="text-slate-400 text-[11px]">
                          Bearer Token de Autenticação
                        </label>
                        {apiKeys.length > 0 && !simulatorBearerToken && (
                          <span className="text-[10px] text-amber-400 font-sans">
                            Gere uma chave ao lado
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          id="sim-bearer"
                          type={showBearerToken ? 'text' : 'password'}
                          placeholder="Cole sua API Key Bearer"
                          value={simulatorBearerToken}
                          onChange={(e) => setSimulatorBearerToken(e.target.value)}
                          className="w-full pr-9 pl-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowBearerToken((v) => !v)}
                          aria-label={showBearerToken ? 'Ocultar token' : 'Mostrar token'}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showBearerToken ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="sim-email" className="block text-slate-400 mb-1 text-[11px]">
                        email (validação Zod)
                      </label>
                      <input
                        id="sim-email"
                        type="email"
                        value={simulatorEmail}
                        onChange={(e) => setSimulatorEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor="sim-name" className="block text-slate-400 mb-1 text-[11px]">
                        name (opcional)
                      </label>
                      <input
                        id="sim-name"
                        type="text"
                        value={simulatorName}
                        onChange={(e) => setSimulatorName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor="sim-phone" className="block text-slate-400 mb-1 text-[11px]">
                        phone (DDI+DDD)
                      </label>
                      <input
                        id="sim-phone"
                        type="text"
                        placeholder="5511999998888"
                        value={simulatorPhone}
                        onChange={(e) => setSimulatorPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor="sim-message" className="block text-slate-400 mb-1 text-[11px]">
                        message (payload string)
                      </label>
                      <textarea
                        id="sim-message"
                        rows={2}
                        value={simulatorMessage}
                        onChange={(e) => setSimulatorMessage(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition text-xs font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulateWebhook}
                      disabled={loadingTest}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-cyan-500/20 font-mono"
                    >
                      <Play size={14} />{' '}
                      {loadingTest ? 'Processando Ingestão...' : 'Disparar Evento Agora'}
                    </button>

                    {testResult && (
                      <div
                        role="status"
                        aria-live="polite"
                        className={`p-3 rounded-xl border text-xs font-mono ${testResult.success
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          }`}
                      >
                        {testResult.message}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Code2 size={14} className="text-indigo-400" /> Chamada cURL Externa
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleCopyCodeSnippet(curlSnippet)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition"
                    >
                      {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                      {copiedCode ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>

                  <div className="bg-slate-950/90 border border-white/[0.08] rounded-xl p-3.5 font-mono text-[11px] text-cyan-300/90 overflow-x-auto max-h-60 leading-relaxed shadow-inner">
                    <pre>{curlSnippet}</pre>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-400 font-mono space-y-1">
                    <div className="flex items-center gap-1 text-cyan-400 font-semibold">
                      <Info size={13} /> Rate Limiting Ativo:
                    </div>
                    <p>Limite de 120 requisições/minuto por webhook e 20 criações/minuto por conta.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-8 text-center text-xs font-mono text-slate-400">
              Selecione ou crie uma regra para usar o simulador de webhook.
            </div>
          )}
        </div>
      </div>

      {/* Modal Nova Automação */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-nova-regra-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="glass-panel border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 id="modal-nova-regra-title" className="text-sm font-bold text-white">
                Nova Regra de Automação
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleCreateAutomation} className="space-y-3">
              <div>
                <label htmlFor="auto-name" className="block text-slate-400 mb-1">
                  Nome da Regra
                </label>
                <input
                  id="auto-name"
                  type="text"
                  value={newAutoName}
                  onChange={(e) => setNewAutoName(e.target.value)}
                  placeholder="Ex.: Notificar venda aprovada"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="auto-trigger" className="block text-slate-400 mb-1">
                  Gatilho
                </label>
                <select
                  id="auto-trigger"
                  value={newTriggerType}
                  onChange={(e) => setNewTriggerType(e.target.value as 'webhook')}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white"
                >
                  <option value="webhook">webhook</option>
                </select>
              </div>

              <div>
                <label htmlFor="auto-action" className="block text-slate-400 mb-1">
                  Ação
                </label>
                <select
                  id="auto-action"
                  value={newActionType}
                  onChange={(e) => setNewActionType(e.target.value as SupportedActionType)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white"
                >
                  <option value="send_email">send_email</option>
                  <option value="slack_webhook">slack_webhook</option>
                  <option value="discord_webhook">discord_webhook</option>
                  <option value="http_post">http_post</option>
                </select>
              </div>

              {newActionType !== 'send_email' && (
                <div>
                  <label htmlFor="auto-url" className="block text-slate-400 mb-1">
                    URL HTTPS de Destino
                  </label>
                  <input
                    id="auto-url"
                    type="url"
                    value={newActionUrl}
                    onChange={(e) => setNewActionUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white"
                    required
                  />
                </div>
              )}

              {createError && (
                <p role="alert" className="text-rose-400 text-xs">
                  {createError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-900 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold disabled:opacity-50"
                >
                  {isCreating ? 'Salvando...' : 'Criar Regra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gerenciar API Keys */}
      {isKeyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-api-keys-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="glass-panel border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 id="modal-api-keys-title" className="text-sm font-bold text-white">
                API Keys de Integração
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsKeyModalOpen(false);
                  setGeneratedKeyResult(null);
                  setConfirmRevokeId(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleCreateApiKey} className="flex gap-2">
              <label htmlFor="new-key-name" className="sr-only">
                Nome da chave
              </label>
              <input
                id="new-key-name"
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Nome da chave (ex.: CI/CD Produção)"
                className="flex-1 px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white"
              />
              <button
                type="submit"
                disabled={isGeneratingKey}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold disabled:opacity-50"
              >
                {isGeneratingKey ? 'Gerando...' : 'Gerar'}
              </button>
            </form>

            {keyModalError && (
              <p role="alert" className="text-rose-400 text-xs">
                {keyModalError}
              </p>
            )}

            {generatedKeyResult && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
                <p className="font-bold">Copie esta chave agora — ela não será exibida novamente:</p>
                <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-lg">
                  <code className="truncate">{generatedKeyResult.rawToken}</code>
                  <button
                    type="button"
                    onClick={() => handleCopyText(generatedKeyResult.rawToken, 'new-token')}
                    className="px-2 py-1 rounded bg-slate-800 text-cyan-300 shrink-0"
                  >
                    {copiedKey === 'new-token' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {apiKeys.length === 0 ? (
                <p className="text-slate-500 text-center py-4">Nenhuma API Key cadastrada.</p>
              ) : (
                apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-white/5"
                  >
                    <div>
                      <div className="text-white font-semibold">{k.name}</div>
                      <div className="text-[10px] text-slate-500">
                        Criada em {new Date(k.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    {confirmRevokeId === k.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteApiKey(k.id)}
                          className="px-2 py-1 rounded bg-rose-600 text-white text-[10px]"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRevokeId(null)}
                          className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px]"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmRevokeId(k.id)}
                        aria-label={`Revogar chave ${k.name}`}
                        className="text-slate-400 hover:text-rose-400 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
