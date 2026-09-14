import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  LogOut,
  RefreshCw,
  Search,
  Settings,
  TrendingDown,
  TriangleAlert,
  UserPlus,
  Zap,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import blackTrackLogo from "@/assets/blacktrack-logo.png.asset.json";
import {
  fetchDashboard,
  MetaApiError,
  testMetaConnection,
  type CampaignMetric,
  type DashboardData,
  type MetaConfig,
} from "./meta-api";
import { currency, getDateRange, integer, percent, periods, shortDate, type PeriodKey } from "./utils";

const AUTH_KEY = "app-install-authenticated";
const CONFIG_KEY = "app-install-meta-config";
const emptyData: DashboardData = {
  summary: {
    spend: 0,
    installs: 0,
    activations: 0,
    registrations: 0,
    initiatedCheckouts: 0,
    subscribes: 0,
    purchases: 0,
    purchaseValue: 0,
    subscribeValue: 0,
    viewContent: 0,
    searches: 0,
    detectorQueries: 0,
    clicks: 0,
    ctr: 0,
    cpm: 0,
  },
  daily: [],
  campaigns: [],
};

type SortKey =
  | "name"
  | "status"
  | "spend"
  | "installs"
  | "registrations"
  | "initiatedCheckouts"
  | "acquisitions"
  | "cpi"
  | "cpa"
  | "roas";
type SortState = { key: SortKey; direction: "asc" | "desc" };

function getInitialConfig(): MetaConfig {
  return {
    token: import.meta.env["VITE_FB_ACCESS_TOKEN"] ?? "",
    accountId: import.meta.env["VITE_FB_ACCOUNT_ID"] ?? "",
  };
}

export function Dashboard() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [config, setConfig] = useState<MetaConfig>(getInitialConfig);
  const [period, setPeriod] = useState<PeriodKey>("7days");
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [generalError, setGeneralError] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    setAuthenticated(localStorage.getItem(AUTH_KEY) === "true");
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig) as MetaConfig);
      } catch {
        localStorage.removeItem(CONFIG_KEY);
      }
    }
    setReady(true);
  }, []);

  async function loadData(force = false, nextConfig = config, nextPeriod = period) {
    if (!nextConfig.token || !nextConfig.accountId || (tokenExpired && !force)) {
      if (!nextConfig.token || !nextConfig.accountId) setSettingsOpen(true);
      return;
    }
    setLoading(true);
    setGeneralError(false);
    try {
      const result = await fetchDashboard(nextConfig, getDateRange(nextPeriod));
      setData(result);
      setHasLoaded(true);
      setTokenExpired(false);
      setLastUpdated(new Date());
    } catch (error) {
      if (error instanceof MetaApiError && error.code === 190) {
        setTokenExpired(true);
      } else {
        setGeneralError(true);
        toast.error("Erro ao carregar dados. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready && authenticated && config.token && config.accountId && !hasLoaded && !tokenExpired) {
      void loadData();
    }
  }, [ready, authenticated, config.token, config.accountId]);

  if (!ready) return <PageSkeleton />;
  if (!authenticated) return <LoginScreen onSuccess={() => setAuthenticated(true)} />;

  const selectPeriod = (nextPeriod: PeriodKey) => {
    setPeriod(nextPeriod);
    void loadData(false, config, nextPeriod);
  };
  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {tokenExpired && (
        <div className="fixed inset-x-0 top-0 z-[60] flex min-h-11 items-center justify-center gap-2 bg-warning px-4 py-2 text-center text-sm font-semibold text-warning-foreground">
          <TriangleAlert className="size-4 shrink-0" />
          <span>A sincronização com o Gerenciador de Anúncios precisa ser atualizada.</span>
          <Button
            variant="link"
            className="h-auto p-0 text-warning-foreground underline"
            onClick={() => setSettingsOpen(true)}
          >
            Atualizar conexão
          </Button>
        </div>
      )}
      <Header
        period={period}
        onPeriodChange={selectPeriod}
        loading={loading}
        lastUpdated={lastUpdated}
        onRefresh={() => void loadData(true)}
        onSettings={() => setSettingsOpen(true)}
        onLogout={logout}
        shifted={tokenExpired}
      />
      <main className={cn("mx-auto max-w-[1440px] px-4 pb-12 pt-32 sm:px-6 lg:px-8", tokenExpired && "pt-44")}>
        <div className="mb-7">
          <p className="text-sm font-medium text-primary">Visão geral da conta</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Desempenho de instalações</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe seus resultados de aquisição em um só lugar.</p>
        </div>
        {generalError && (
          <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 sm:flex-row sm:items-center">
            <p className="text-sm text-destructive">
              Não foi possível atualizar os dados. Verifique sua conexão e tente novamente.
            </p>
            <Button variant="outline" size="sm" onClick={() => void loadData(true)}>
              Tentar novamente
            </Button>
          </div>
        )}
        <KpiGrid data={data} loading={loading && !hasLoaded} />
        <FunnelChart data={data} loading={loading && !hasLoaded} />
        <EngagementMetrics data={data} loading={loading && !hasLoaded} />
        <PerformanceChart data={data} loading={loading && !hasLoaded} />
        <CampaignTable data={data.campaigns} loading={loading && !hasLoaded} />
      </main>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={config}
        onSaved={(saved) => {
          setConfig(saved);
          setTokenExpired(false);
          setSettingsOpen(false);
          void loadData(true, saved);
        }}
      />
    </div>
  );
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const expectedUser = import.meta.env["VITE_DASH_USER"] ?? "p7growth";
    const expectedPassword = import.meta.env["VITE_DASH_PASSWORD"] ?? "z!DwG6!2";
    if (user === expectedUser && password === expectedPassword) {
      localStorage.setItem(AUTH_KEY, "true");
      onSuccess();
      return;
    }
    setError(true);
  };
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-x-0 top-0 h-px bg-primary/70" />
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-7 shadow-2xl shadow-shadow/20 sm:p-8"
      >
        <div className="mb-8 flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-lg font-semibold">
              Black<span className="text-primary">Track</span>
            </p>
            <p className="text-xs text-muted-foreground">Painel de performance</p>
          </div>
        </div>
        <h1 className="text-2xl font-semibold">Boas-vindas</h1>
        <p className="mt-2 text-sm text-muted-foreground">Entre para acessar os dados das suas campanhas.</p>
        <div className="mt-7 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">Usuário</Label>
            <Input
              id="user"
              autoComplete="username"
              value={user}
              onChange={(e) => {
                setUser(e.target.value);
                setError(false);
              }}
              placeholder="Digite seu usuário"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Digite sua senha"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              Usuário ou senha incorretos
            </p>
          )}
          <Button type="submit" className="mt-2 h-11 w-full">
            Entrar
          </Button>
        </div>
      </form>
    </main>
  );
}

function BrandMark() {
  return <img src={blackTrackLogo.url} alt="Logo BlackTrack" className="size-10 shrink-0 object-contain" />;
}

function Header(props: {
  period: PeriodKey;
  onPeriodChange: (value: PeriodKey) => void;
  loading: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  onSettings: () => void;
  onLogout: () => void;
  shifted: boolean;
}) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur",
        props.shifted && "top-11",
      )}
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mr-auto flex items-center gap-3">
          <BrandMark />
          <p className="hidden font-semibold sm:block">
            Black<span className="text-primary">Track</span>
          </p>
        </div>
        <nav aria-label="Período" className="order-3 flex w-full gap-1 overflow-x-auto lg:order-none lg:w-auto">
          {periods.map((item) => (
            <Button
              key={item.key}
              size="sm"
              variant={props.period === item.key ? "default" : "ghost"}
              onClick={() => props.onPeriodChange(item.key)}
              className="shrink-0"
            >
              {item.label}
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <span className="mr-1 hidden text-xs text-muted-foreground xl:block">
            Última atualização:{" "}
            {props.lastUpdated
              ? props.lastUpdated.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
              : "—"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={props.onRefresh}
            disabled={props.loading}
            aria-label="Atualizar dados"
          >
            <RefreshCw className={cn(props.loading && "animate-spin")} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={props.onSettings} aria-label="Configurações">
            <Settings />
          </Button>
          <Button variant="ghost" size="sm" onClick={props.onLogout}>
            <LogOut />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

function KpiGrid({ data, loading }: { data: DashboardData; loading: boolean }) {
  const { summary } = data;
  const revenue = summary.purchaseValue + summary.subscribeValue;
  const acquisitions = summary.subscribes + summary.purchases;
  const cpa = acquisitions > 0 ? summary.spend / acquisitions : null;
  const roas = summary.spend > 0 ? revenue / summary.spend : null;
  const financial = [
    { label: "Investimento", value: currency.format(summary.spend), Icon: DollarSign, tone: "bg-muted text-muted-foreground" },
    { label: "Faturamento", value: currency.format(revenue), Icon: DollarSign, tone: "bg-success/15 text-success" },
    { label: "CPA", value: cpa === null ? "—" : currency.format(cpa), Icon: TrendingDown, tone: "bg-warning/15 text-warning" },
    {
      label: "ROAS",
      value: roas === null ? "—" : `${roas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`,
      Icon: BarChart3,
      tone: "bg-primary text-primary-foreground",
      valueTone: roas === null ? "" : roas >= 1 ? "text-success" : "text-destructive",
    },
  ];
  const volume = [
    { label: "Installs", value: integer.format(summary.installs), Icon: Download, tone: "bg-primary text-primary-foreground" },
    { label: "Cadastros", value: integer.format(summary.registrations), Icon: UserPlus, tone: "bg-info/15 text-info" },
    { label: "Assinantes", value: integer.format(acquisitions), Icon: CreditCard, tone: "bg-success/15 text-success" },
  ];
  return (
    <div className="space-y-6">
      <KpiSection title="KPIs financeiros" items={financial} loading={loading} />
      <KpiSection title="KPIs de volume" items={volume} loading={loading} />
    </div>
  );
}

function KpiSection({
  title,
  items,
  loading,
}: {
  title: string;
  items: Array<{ label: string; value: string; Icon: typeof DollarSign; tone: string; valueTone?: string }>;
  loading: boolean;
}) {
  return (
    <section aria-label={title}>
      <h2 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">{title}</h2>
      <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", items.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4")}>
        {items.map(({ label, value, Icon, tone, valueTone }) => (
          <article key={label} className="rounded-xl border border-border bg-card p-5 shadow-lg shadow-shadow/20 transition-colors hover:bg-card-hover">
            <div className="flex items-start justify-between gap-3">
              <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", tone)}><Icon className="size-5" /></div>
              <span className="text-right text-[11px] font-semibold uppercase text-muted-foreground">{label}</span>
            </div>
            {loading ? <Skeleton className="mt-6 h-9 w-36" /> : <p className={cn("mt-5 text-3xl font-bold", valueTone)}>{value}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}

function FunnelChart({ data, loading }: { data: DashboardData; loading: boolean }) {
  const { summary } = data;
  const steps = [
    { label: "Install", value: summary.installs },
    { label: "Activate", value: summary.activations },
    { label: "Registration", value: summary.registrations },
    { label: "InitiatedCheckout", value: summary.initiatedCheckouts },
    { label: "Subscribe", value: summary.subscribes + summary.purchases },
  ];
  const maxValue = steps[0]?.value || 1;
  const chartWidth = 1000;
  const centerY = 142;
  const maxHalfHeight = 68;
  const minHalfHeight = 12;
  const firstX = 100;
  const lastX = 900;
  const stepGap = (lastX - firstX) / Math.max(steps.length - 1, 1);
  const points = steps.map((step, index) => {
    const ratio = Math.max(0, step.value / maxValue);
    const halfHeight = Math.max(ratio * maxHalfHeight, minHalfHeight);
    return {
      ...step,
      ratio,
      x: firstX + index * stepGap,
      top: centerY - halfHeight,
      bottom: centerY + halfHeight,
    };
  });
  const topPath = points.reduce((path, point, index) => {
    if (index === 0) return `M 28 ${point.top} L ${point.x} ${point.top}`;
    const previous = points[index - 1];
    if (!previous) return path;
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.top}, ${controlX} ${point.top}, ${point.x} ${point.top}`;
  }, "");
  const bottomPath = [...points].reverse().reduce((path, point, reverseIndex) => {
    if (reverseIndex === 0) return `L 972 ${point.bottom} L ${point.x} ${point.bottom}`;
    const previous = points[points.length - reverseIndex];
    if (!previous) return path;
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.bottom}, ${controlX} ${point.bottom}, ${point.x} ${point.bottom}`;
  }, "");
  const flowPath = `${topPath} L 972 ${points[points.length - 1]?.top ?? centerY} ${bottomPath} L 28 ${points[0]?.bottom ?? centerY} Z`;
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-lg shadow-shadow/20 sm:p-6">
      <h2 className="font-semibold">Funil de conversão</h2>
      <p className="mt-1 text-xs text-muted-foreground">Install → Subscribe</p>
      <div className="mt-5 min-h-72 overflow-x-auto">
        {loading ? <LoadingState label="Carregando funil" /> : (
          <svg
            viewBox={`0 0 ${chartWidth} 280`}
            className="h-auto min-w-[760px] w-full"
            role="img"
            aria-label="Funil de conversão em fluxo contínuo de Install até Subscribe"
          >
            <defs>
              <linearGradient id="sankey-flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
                <stop offset="36%" stopColor="var(--warning)" stopOpacity="0.86" />
                <stop offset="72%" stopColor="var(--success)" stopOpacity="0.78" />
                <stop offset="100%" stopColor="var(--chart-2)" stopOpacity="0.88" />
              </linearGradient>
            </defs>
            {points.slice(1).map((point) => (
              <line key={point.label} x1={point.x} x2={point.x} y1="52" y2="230" stroke="var(--border)" strokeWidth="1" />
            ))}
            <path d={flowPath} fill="url(#sankey-flow-gradient)" />
            {points.map((point) => (
              <g key={point.label}>
                <text x={point.x} y="24" textAnchor="middle" fill="var(--muted-foreground)" fontSize="12" fontWeight="600">
                  {point.label}
                </text>
                <text x={point.x} y={centerY + 4} textAnchor="middle" fill="var(--primary-foreground)" fontSize="14" fontWeight="700">
                  {(point.ratio * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                </text>
                <text x={point.x} y="258" textAnchor="middle" fill="var(--foreground)" fontSize="15" fontWeight="700">
                  {integer.format(point.value)}
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>
    </section>
  );
}

function EngagementMetrics({ data, loading }: { data: DashboardData; loading: boolean }) {
  const items = [
    { label: "Abriu Confronto", value: data.summary.viewContent, Icon: Eye },
    { label: "Buscas", value: data.summary.searches, Icon: Search },
    { label: "Detector", value: data.summary.detectorQueries, Icon: Zap },
  ];
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-lg shadow-shadow/20 sm:p-6">
      <h2 className="font-semibold">Eventos de Engajamento</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3 sm:divide-x sm:divide-border">
        {items.map(({ label, value, Icon }) => (
          <div key={label} className="flex items-center gap-4 sm:px-5 first:pl-0 last:pr-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary"><Icon className="size-5" /></div>
            <div><p className="text-xs uppercase text-muted-foreground">{label}</p>{loading ? <Skeleton className="mt-2 h-7 w-20" /> : <p className="mt-1 text-2xl font-bold">{integer.format(value)}</p>}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PerformanceChart({ data, loading }: { data: DashboardData; loading: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-lg shadow-shadow/20 sm:p-6">
      <div>
        <h2 className="font-semibold">Gasto vs. installs vs. assinantes por dia</h2>
        <p className="mt-1 text-xs text-muted-foreground">Evolução diária no período selecionado</p>
      </div>
      <div className="mt-6 h-[320px] w-full">
        {loading ? (
          <LoadingState label="Carregando gráfico" />
        ) : data.daily.length === 0 ? (
          <EmptyState text="Sem dados para o período selecionado" />
        ) : mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.daily} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spend-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="download-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="subscriber-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--success)" stopOpacity={0.26} />
                  <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="spend"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <YAxis
                yAxisId="volume"
                orientation="right"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend verticalAlign="bottom" height={28} />
              <Area
                yAxisId="spend"
                type="monotone"
                dataKey="spend"
                name="Gasto (R$)"
                stroke="var(--destructive)"
                fill="url(#spend-fill)"
                strokeWidth={2}
              />
              <Area
                yAxisId="volume"
                type="monotone"
                dataKey="installs"
                name="Installs"
                stroke="var(--primary)"
                fill="url(#download-fill)"
                strokeWidth={2}
              />
              <Area
                yAxisId="volume"
                type="monotone"
                dataKey={(item) => item.subscribes + item.purchases}
                name="Assinantes"
                stroke="var(--success)"
                fill="url(#subscriber-fill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <LoadingState label="Preparando gráfico" />
        )}
      </div>
    </section>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: DashboardData["daily"][number] }>;
  label?: string;
}) {
  if (!active || !payload?.[0]) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-xs shadow-xl">
      <p className="mb-2 font-semibold">{label?.split("-").reverse().join("/")}</p>
      <p className="text-muted-foreground">
        Gasto: <span className="text-foreground">{currency.format(item.spend)}</span>
      </p>
      <p className="text-muted-foreground">
        Installs: <span className="text-foreground">{integer.format(item.installs)}</span>
      </p>
      <p className="text-muted-foreground">
        Cadastros: <span className="text-foreground">{integer.format(item.registrations)}</span>
      </p>
      <p className="text-muted-foreground">
        Assinantes: <span className="text-foreground">{integer.format(item.subscribes + item.purchases)}</span>
      </p>
      <p className="text-muted-foreground">
        Receita: <span className="text-foreground">{currency.format(item.purchaseValue + item.subscribeValue)}</span>
      </p>
    </div>
  );
}

function CampaignTable({ data, loading }: { data: CampaignMetric[]; loading: boolean }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "spend", direction: "desc" });
  const averageCpi = useMemo(() => {
    const withCpi = data.filter((campaign) => campaign.cpi !== null);
    return withCpi.length ? withCpi.reduce((sum, campaign) => sum + (campaign.cpi ?? 0), 0) / withCpi.length : 0;
  }, [data]);
  const rows = useMemo(
    () =>
      data
        .filter((campaign) => campaign.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")))
        .sort((a, b) => {
          const value = (campaign: CampaignMetric) => sort.key === "acquisitions" ? campaign.subscribes + campaign.purchases : campaign[sort.key];
          const first = value(a) ?? -1;
          const second = value(b) ?? -1;
          const result =
            typeof first === "string" ? first.localeCompare(String(second), "pt-BR") : Number(first) - Number(second);
          return sort.direction === "asc" ? result : -result;
        }),
    [data, search, sort],
  );
  const changeSort = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "name" || key === "status" ? "asc" : "desc" },
    );
  return (
    <section className="mt-6 rounded-xl border border-border bg-card shadow-lg shadow-shadow/20">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="font-semibold">Campanhas</h2>
          <p className="mt-1 text-xs text-muted-foreground">Resultados detalhados por campanha</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar campanha"
            className="pl-9"
          />
        </div>
      </div>
      {loading ? (
        <div className="h-56">
          <LoadingState label="Carregando campanhas" />
        </div>
      ) : rows.length === 0 ? (
        <div className="h-48">
          <EmptyState text={search ? "Nenhuma campanha corresponde à busca" : "Nenhuma campanha encontrada"} />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {[
                ["name", "Campanha"],
                ["status", "Status"],
                ["spend", "Gasto"],
                ["installs", "Installs"],
                ["registrations", "Registros"],
                ["initiatedCheckouts", "Checkouts"],
                ["acquisitions", "Assinantes"],
                ["cpi", "CPI"],
                ["cpa", "CPA"],
                ["roas", "ROAS"],
              ].map(([key, label]) => (
                <TableHead key={key} className={cn("px-5", key !== "name" && key !== "status" && "text-right")}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1 text-muted-foreground"
                    onClick={() => changeSort(key as SortKey)}
                  >
                    {label}
                    {sort.key === key ? sort.direction === "asc" ? <ArrowUp /> : <ArrowDown /> : <ArrowUpDown />}
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((campaign) => (
              <TableRow
                key={campaign.id}
                className={cn(
                  campaign.installs === 0 && campaign.spend > 0 && "bg-destructive/5 hover:bg-destructive/10",
                )}
              >
                <TableCell className="min-w-64 px-5 py-4 font-medium">{campaign.name}</TableCell>
                <TableCell className="px-5">
                  <StatusBadge status={campaign.status} />
                </TableCell>
                <TableCell className="px-5 text-right">{currency.format(campaign.spend)}</TableCell>
                <TableCell className="px-5 text-right">{integer.format(campaign.installs)}</TableCell>
                <TableCell className="px-5 text-right">{integer.format(campaign.registrations)}</TableCell>
                <TableCell className="px-5 text-right">{integer.format(campaign.initiatedCheckouts)}</TableCell>
                <TableCell className="px-5 text-right">{integer.format(campaign.subscribes + campaign.purchases)}</TableCell>
                <TableCell
                  className={cn(
                    "px-5 text-right",
                    campaign.cpi !== null &&
                      averageCpi > 0 &&
                      campaign.cpi > averageCpi * 1.5 &&
                      "font-semibold text-warning",
                  )}
                >
                  {campaign.cpi === null ? "—" : currency.format(campaign.cpi)}
                </TableCell>
                <TableCell className="px-5 text-right">{campaign.cpa === null ? "—" : currency.format(campaign.cpa)}</TableCell>
                <TableCell className={cn("px-5 text-right font-semibold", campaign.roas !== null && (campaign.roas >= 1 ? "text-success" : "text-destructive"))}>
                  {campaign.roas === null ? "—" : `${campaign.roas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
      )}
    >
      <span className={cn("size-1.5 rounded-full", active ? "bg-success" : "bg-muted-foreground")} />
      {active ? "Ativo" : "Pausado"}
    </span>
  );
}

function SettingsDialog({
  open,
  onOpenChange,
  config,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: MetaConfig;
  onSaved: (config: MetaConfig) => void;
}) {
  const [token, setToken] = useState(config.token);
  const [accountId, setAccountId] = useState(config.accountId);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  useEffect(() => {
    if (open) {
      setToken(config.token);
      setAccountId(config.accountId);
      setResult(null);
    }
  }, [open, config]);
  const test = async () => {
    if (!token.trim()) {
      setResult({ ok: false, message: "Informe um token para testar." });
      return;
    }
    setTesting(true);
    try {
      const name = await testMetaConnection(token.trim());
      setResult({ ok: true, message: `Conexão válida — ${name}` });
    } catch {
      setResult({ ok: false, message: "Token inválido ou expirado" });
    } finally {
      setTesting(false);
    }
  };
  const save = () => {
    if (!token.trim() || !accountId.trim()) {
      setResult({ ok: false, message: "Preencha o token e o ID da conta." });
      return;
    }
    const next = { token: token.trim(), accountId: accountId.trim() };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    onSaved(next);
    toast.success("Conexão atualizada com sucesso.");
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configuração da Meta</DialogTitle>
          <DialogDescription>Atualize os dados usados para sincronizar suas campanhas.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="token">Access Token</Label>
            <Input
              id="token"
              type="password"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setResult(null);
              }}
              placeholder="Cole seu token"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account">Account ID</Label>
            <Input
              id="account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="act_XXXXXXXXX"
            />
          </div>
          {result && (
            <p className={cn("text-sm", result.ok ? "text-success" : "text-destructive")}>
              {result.ok ? "✓" : "✕"} {result.message}
            </p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button variant="outline" onClick={() => void test()} disabled={testing}>
            {testing && <RefreshCw className="animate-spin" />}Testar conexão
          </Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
      <RefreshCw className="size-4 animate-spin text-primary" />
      {label}
    </div>
  );
}
function EmptyState({ text }: { text: string }) {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{text}</div>;
}
function PageSkeleton() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-[1440px]">
        <Skeleton className="h-16 w-full" />
        <div className="mt-24 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
        <Skeleton className="mt-6 h-96" />
      </div>
    </main>
  );
}
