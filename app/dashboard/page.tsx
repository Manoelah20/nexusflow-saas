'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Automation, ExecutionLog } from '@/types/database';
import {
  Play,
  CheckCircle2,
  XCircle,
  Activity,
  Zap,
  Clock,
  Mail,
  Plus,
  Copy,
  Check,
  X,
  Code2,
  Send,
  Eye,
  LogOut,
  ChevronRight,
  Info,
  Terminal,
  Radio,
  Sliders,
  RefreshCw,
  Key,
  Trash2,
  Download,
  Filter,
  Search,
  ShieldCheck,
  Lock,
  FileSpreadsheet,
  FileCode2,
  Cpu,
  BarChart3,
  Layers,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface ApiKeyItem {
  id: string;
  name: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [selectedAuto, setSelectedAuto] = useState<Automation | null>(null);
  const [selectedLog, setSelectedLog] = useState<ExecutionLog | null>(null);

  // Status de cópia
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal de Criação de Automação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAutoName, setNewAutoName] = useState('');
  const [newTriggerType, setNewTriggerType] = useState<'webhook' | 'cron' | 'db_event'>('webhook');
  const [newActionType, setNewActionType] = useState<'send_email' | 'whatsapp_message' | 'slack_webhook' | 'discord_webhook' | 'http_post' | 'critical_alert'>('send_email');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal / Seção de Criação de API Key
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [generatedKeyResult, setGeneratedKeyResult] = useState<{ name: string; rawToken: string } | null>(null);

  // Simulador de Payload
  const [simulatorEmail, setSimulatorEmail] = useState('cliente@exemplo.com');
  const [simulatorName, setSimulatorName] = useState('João Santos');
  const [simulatorPhone, setSimulatorPhone] = useState('5511999998888');
  const [simulatorMessage, setSimulatorMessage] = useState('Sua compra #4829 foi aprovada com sucesso!');
  const [simulatorBearerToken, setSimulatorBearerToken] = useState('');
  const [loadingTest, setLoadingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Filtros e Busca de Logs
  const [logFilterStatus, setLogFilterStatus] = useState<'all' | 'success' | 'failed'>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Busca automações
  const fetchAutomations = useCallback(async () => {
    try {
      const res = await fetch('/api/automations');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setAutomations(json.data);
          if (!selectedAuto && json.data.length > 0) {
            setSelectedAuto(json.data[0]);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao buscar automações:', err);
    }
  }, [selectedAuto]);

  // Busca logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setLogs(json.data);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
    }
  }, []);

  // Busca API Keys
  const fetchApiKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/keys');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setApiKeys(json.data);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar chaves:', err);
    }
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchAutomations();
      fetchLogs();
      fetchApiKeys();

      const interval = setInterval(fetchLogs, 3500);
      return () => clearInterval(interval);
    }
  }, [authStatus, fetchAutomations, fetchLogs, fetchApiKeys]);

  const handleCreateAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAutoName.trim()) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAutoName,
          trigger_type: newTriggerType,
          action_type: newActionType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao criar automação');

      setAutomations((prev) => [data.data, ...prev]);
      setSelectedAuto(data.data);
      setNewAutoName('');
      setIsModalOpen(false);
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsGeneratingKey(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar chave');

      setGeneratedKeyResult({
        name: data.data.name,
        rawToken: data.data.rawToken,
      });

      setSimulatorBearerToken(data.data.rawToken);
      fetchApiKeys();
      setNewKeyName('');
    } catch (err: any) {
      alert(err.message || 'Erro ao criar chave');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Deseja realmente revogar esta chave de API? Webhooks que a utilizam serão bloqueados.')) return;

    try {
      const res = await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.id !== id));
      }
    } catch (err) {
      console.error('Erro ao revogar chave:', err);
    }
  };

  const handleCopyWebhookUrl = (id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = `${origin}/api/webhooks/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyCodeSnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyText = (text: string, keyIdentifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyIdentifier);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Presets de teste
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
      alert('Por favor, gere ou informe uma API Key Bearer para autenticar a requisição.');
      return;
    }

    setLoadingTest(true);
    setTestResult(null);

    try {
      const response = await fetch(`/api/webhooks/${selectedAuto.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${simulatorBearerToken.trim()}`,
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

      fetchLogs();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Falha: ${err.message}`,
      });
      fetchLogs();
    } finally {
      setLoadingTest(false);
    }
  };

  // Filtro avançado de logs
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

  // Exportação de relatórios
  const exportLogsAsJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nexusflow-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportLogsAsCSV = () => {
    const headers = ['ID', 'Status', 'Latencia_MS', 'Timestamp', 'Payload', 'Erro'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.status,
      l.latencyMs,
      new Date(l.createdAt).toISOString(),
      `"${JSON.stringify(l.payloadSummary).replace(/"/g, '""')}"`,
      `"${(l.errorMessage || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `nexusflow-telemetria-${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Métricas analíticas
  const successCount = logs.filter((l) => l.status === 'success').length;
  const successRate = logs.length > 0 ? ((successCount / logs.length) * 100).toFixed(1) : '100';
  const latencies = logs.map((l) => l.latencyMs || 0).sort((a, b) => a - b);
  const avgLatency = logs.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / logs.length) : 0;
  const p95Latency = logs.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] || avgLatency : 0;

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
      {/* Luzes de Fundo Dinâmicas */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-500/10 blur-[140px] pointer-events-none rounded-full" />

      {/* Top Navbar */}
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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{session.user.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-slate-400 hover:text-rose-400 ml-1.5 transition"
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
            <Sparkles size={14} className="text-cyan-400" /> Planos & Upgrade
          </Link>

          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-panel hover:bg-slate-800/60 text-slate-200 text-xs font-mono transition border-white/10 hover:border-cyan-500/30"
          >
            <Key size={14} className="text-amber-400" /> Gerenciar API Keys ({apiKeys.length})
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 text-xs sm:text-sm font-bold transition shadow-lg shadow-cyan-500/20 font-mono"
          >
            <Plus size={16} /> Nova Regra
          </button>

          <button
            onClick={() => { fetchLogs(); fetchAutomations(); fetchApiKeys(); }}
            title="Atualizar telemetria"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-panel text-cyan-300 text-xs font-mono border-cyan-500/20 hover:bg-slate-800/40 transition"
          >
            <Radio size={14} className="text-cyan-400 animate-pulse" /> Live Telemetry
          </button>
        </div>
      </header>

      {/* Banner de Segurança & Criptografia (Explicativo) */}
      <div className="mb-8 p-4 rounded-2xl glass-panel border-white/[0.08] relative z-10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-white font-bold flex items-center gap-2">
              Arquitetura Blindada de Dados
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">LGPD & GDPR Ready</span>
            </div>
            <p className="text-slate-400 text-[11px] font-light">
              Senhas em Bcrypt (10 rounds) · Chaves em Hash SHA-256 · Conexão TLS/SSL Neon · Headers HSTS & CSP ativos.
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

      {/* Métricas Analíticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL EXECUTIONS</span>
            <Activity size={15} className="text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono mt-2.5 text-white tracking-tight">{logs.length}</div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">Eventos persistidos</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>SUCCESS RATE</span>
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono mt-2.5 text-emerald-400 tracking-tight">{successRate}%</div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">Taxa de assertividade</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AVG LATENCY</span>
            <Clock size={15} className="text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono mt-2.5 text-white tracking-tight">{avgLatency}ms</div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">Média por requisição</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>P95 LATENCY</span>
            <BarChart3 size={15} className="text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono mt-2.5 text-indigo-400 tracking-tight">{p95Latency}ms</div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">95% abaixo deste tempo</p>
        </div>
      </div>

      {/* Grid Principal: Pipelines + Simulador */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 relative z-10">
        {/* Coluna 1: Pipelines */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <h2 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sliders size={15} className="text-cyan-400" /> Pipelines Ativos
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">{automations.length} total</span>
            </div>

            {automations.length === 0 ? (
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
                      onClick={() => setSelectedAuto(auto)}
                      className={`p-4 rounded-xl transition cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-slate-900/90 border border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-950/70 border border-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400" />
                      )}

                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-white">{auto.name}</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ACTIVE
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

        {/* Coluna 2: Playground & Simulador */}
        <div className="lg:col-span-8 space-y-6">
          {selectedAuto ? (
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4 mb-6">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">PIPELINE SELECIONADO</span>
                  <h3 className="text-lg font-bold text-white mt-0.5 font-mono">{selectedAuto.name}</h3>
                </div>
                <div className="text-xs font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/5 truncate max-w-sm">
                  endpoint: /api/webhooks/{selectedAuto.id}
                </div>
              </div>

              {/* Botões de Presets Rápidos */}
              <div className="mb-6 p-3 rounded-xl bg-slate-950/60 border border-white/5 flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="text-slate-400 text-[11px] flex items-center gap-1 mr-1">
                  <Layers size={13} className="text-cyan-400" /> Presets de Exemplo:
                </span>
                <button
                  type="button"
                  onClick={() => applyPreset('checkout')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-cyan-300 text-[11px] transition"
                >
                  🛒 E-commerce Checkout
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('server')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-rose-300 text-[11px] transition"
                >
                  🚨 Alerta Infra/DevOps
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('payment')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-emerald-300 text-[11px] transition"
                >
                  💳 Confirmação Pix
                </button>
              </div>

              {/* Form de Simulação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Send size={14} className="text-cyan-400" /> Injeção de Payload de Teste
                  </h4>

                  <div className="space-y-3 text-xs font-mono">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-400 text-[11px]">Bearer Token de Autenticação</label>
                        {apiKeys.length > 0 && !simulatorBearerToken && (
                          <span className="text-[10px] text-amber-400 font-sans">
                            Gere uma chave abaixo
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Cole sua API Key Bearer (ou gere uma ao lado)"
                        value={simulatorBearerToken}
                        onChange={(e) => setSimulatorBearerToken(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 text-[11px]">email (validação Zod)</label>
                      <input
                        type="email"
                        value={simulatorEmail}
                        onChange={(e) => setSimulatorEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 text-[11px]">name (opcional)</label>
                      <input
                        type="text"
                        value={simulatorName}
                        onChange={(e) => setSimulatorName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 text-[11px]">phone (WhatsApp DDI+DDD)</label>
                      <input
                        type="text"
                        placeholder="5511999998888"
                        value={simulatorPhone}
                        onChange={(e) => setSimulatorPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 text-[11px]">message (payload string)</label>
                      <textarea
                        rows={2}
                        value={simulatorMessage}
                        onChange={(e) => setSimulatorMessage(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition text-xs font-mono"
                      />
                    </div>

                    <button
                      onClick={handleSimulateWebhook}
                      disabled={loadingTest}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-cyan-500/20 font-mono"
                    >
                      <Play size={14} /> {loadingTest ? 'Processando Ingestão...' : 'Disparar Evento Agora'}
                    </button>

                    {testResult && (
                      <div
                        className={`p-3 rounded-xl border text-xs font-mono ${
                          testResult.success
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {testResult.message}
                      </div>
                    )}
                  </div>
                </div>

                {/* Snippet cURL */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Code2 size={14} className="text-indigo-400" /> Chamada cURL Externa
                    </h4>
                    <button
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
                    <p className="font-light">
                      Endpoints protegidos com limite deslizante de 120 req/min por IP. Exceder retorna status 429.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 text-xs font-mono">
              Selecione um pipeline para inspecionar os parâmetros.
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Telemetria com Filtros, Busca e Exportação */}
      <div className="glass-panel rounded-2xl p-6 relative z-10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-mono font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Activity size={16} className="text-emerald-400" /> Fluxo de Telemetria ao Vivo
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-light">
              Logs auditados e persistidos no banco de dados Neon.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportLogsAsCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition"
              title="Baixar em formato CSV para Excel/Sheets"
            >
              <FileSpreadsheet size={13} className="text-emerald-400" /> Exportar CSV
            </button>
            <button
              onClick={exportLogsAsJSON}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition"
              title="Baixar em formato JSON"
            >
              <FileCode2 size={13} className="text-cyan-400" /> Exportar JSON
            </button>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/5 w-full sm:w-auto">
            <button
              onClick={() => setLogFilterStatus('all')}
              className={`px-3 py-1 rounded-lg transition ${logFilterStatus === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              Todos ({logs.length})
            </button>
            <button
              onClick={() => setLogFilterStatus('success')}
              className={`px-3 py-1 rounded-lg transition ${logFilterStatus === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              200 OK ({successCount})
            </button>
            <button
              onClick={() => setLogFilterStatus('failed')}
              className={`px-3 py-1 rounded-lg transition ${logFilterStatus === 'failed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              Falhas ({logs.length - successCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar no payload ou erro..."
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 pl-8 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500"
            />
            <Search size={14} className="absolute left-2.5 top-2 text-slate-500" />
          </div>
        </div>

        {/* Tabela de Logs */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Payload Sanitizado</th>
                <th className="pb-3 font-medium">Latência</th>
                <th className="pb-3 font-medium">Data / Hora</th>
                <th className="pb-3 font-medium text-right">Inspecionar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
                    Nenhum log encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <td className="py-3">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                          <CheckCircle2 size={12} /> 200 OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]">
                          <XCircle size={12} /> FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-300 max-w-xs truncate">
                      {JSON.stringify(log.payloadSummary)}
                    </td>
                    <td className="py-3 text-cyan-400">{log.latencyMs}ms</td>
                    <td className="py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                      >
                        <Eye size={13} /> Depurar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Gestão de API Keys */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-panel border-white/10 rounded-2xl p-6 w-full max-w-xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-semibold text-white flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
                <Key size={16} className="text-amber-400" /> Gestão Segura de API Keys (SHA-256)
              </h3>
              <button
                onClick={() => {
                  setIsKeyModalOpen(false);
                  setGeneratedKeyResult(null);
                }}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Aviso ao gerar nova chave */}
            {generatedKeyResult && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono space-y-2">
                <div className="text-amber-300 font-bold flex items-center gap-1.5">
                  <AlertTriangle size={15} /> Copie o Token Agora!
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Por segurança máxima, o token puro é mostrado <strong>apenas uma vez</strong>. Nosso banco armazena apenas o hash criptográfico SHA-256.
                </p>
                <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-white/10">
                  <code className="text-cyan-300 text-[11px] truncate flex-1">{generatedKeyResult.rawToken}</code>
                  <button
                    onClick={() => handleCopyText(generatedKeyResult.rawToken, 'modal-key')}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    {copiedKey === 'modal-key' ? <Check size={13} /> : <Copy size={13} />}
                    {copiedKey === 'modal-key' ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}

            {/* Criar Nova Chave */}
            <form onSubmit={handleCreateApiKey} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Nome da chave (ex: Servidor Stripe, Prod AWS)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isGeneratingKey}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus size={14} /> Gerar Chave
              </button>
            </form>

            {/* Lista de Chaves Ativas */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Chaves Ativas Registradas</div>
              {apiKeys.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center font-mono">Nenhuma chave cadastrada ainda.</p>
              ) : (
                apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-white/5 flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div>
                      <div className="text-white font-semibold flex items-center gap-2">
                        <Key size={13} className="text-amber-400" /> {key.name}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Criada em: {new Date(key.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteApiKey(key.id)}
                      className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition"
                      title="Revogar chave"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setIsKeyModalOpen(false);
                  setGeneratedKeyResult(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold font-mono transition"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Inspeção de Log */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-panel border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-semibold text-white flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
                <Activity size={16} className="text-cyan-400" /> Depurador de Evento
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-slate-500">ID da Execução:</span>
                <span className="text-slate-300 text-[11px]">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-slate-500">Status HTTP:</span>
                <span className={selectedLog.status === 'success' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {selectedLog.status === 'success' ? '200 OK' : 'FAILED / ERROR'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-slate-500">Latência do Pipeline:</span>
                <span className="text-cyan-400 font-bold">{selectedLog.latencyMs} ms</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-slate-500">Timestamp UTC:</span>
                <span className="text-slate-300">{new Date(selectedLog.createdAt).toLocaleString()}</span>
              </div>

              {selectedLog.errorMessage && (
                <div className="mt-2">
                  <span className="text-rose-400 font-bold block mb-1">Motivo da Falha:</span>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-[11px]">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}

              <div className="mt-3">
                <span className="text-slate-400 block mb-1">Payload JSON Inspecionado:</span>
                <pre className="p-3 bg-slate-950/90 border border-white/10 rounded-xl text-cyan-300 text-[11px] overflow-x-auto max-h-48 leading-relaxed font-mono">
                  {JSON.stringify(selectedLog.payloadSummary, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold font-mono transition"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Automação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-panel border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-semibold text-white flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
                <Plus size={16} className="text-cyan-400" /> Novo Pipeline de Automação
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-mono">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateAutomation} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-400 text-xs mb-1 font-mono">Nome da Regra</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Confirmação de Pedido Pix"
                  value={newAutoName}
                  onChange={(e) => setNewAutoName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/90 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-mono">Gatilho (Ingestion)</label>
                <select
                  value={newTriggerType}
                  onChange={(e) => setNewTriggerType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950/90 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-xs font-mono"
                >
                  <option value="webhook">Webhook HTTP Endpoint (POST)</option>
                  <option value="cron">Cron Schedule Periódico</option>
                  <option value="db_event">PostgreSQL CDC Event</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-mono">Ação (Dispatch)</label>
                <select
                  value={newActionType}
                  onChange={(e) => setNewActionType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950/90 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-xs font-mono"
                >
                  <option value="send_email">E-mail Transacional (Resend)</option>
                  <option value="whatsapp_message">Mensagem WhatsApp (Z-API / Gateway)</option>
                  <option value="slack_webhook">Notificação em Canal do Slack</option>
                  <option value="discord_webhook">Embed e Alerta no Discord</option>
                  <option value="http_post">HTTP POST Forwarding</option>
                  <option value="critical_alert">Critical Sentry / Webhook Alert</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold font-mono transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 font-mono"
                >
                  {isCreating ? 'Provisionando...' : 'Salvar Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer com Links de Conformidade */}
      <footer className="mt-12 pt-6 border-t border-white/[0.06] text-xs font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        <div>NexusFlow SaaS © {new Date().getFullYear()} — Plataforma Enterprise de Webhooks</div>
        <div className="flex items-center gap-4 text-slate-400">
          <Link href="/pricing" className="hover:text-cyan-400 transition">Planos</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-cyan-400 transition">Termos de Uso</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-cyan-400 transition">Privacidade (LGPD)</Link>
        </div>
      </footer>
    </div>
  );
}
