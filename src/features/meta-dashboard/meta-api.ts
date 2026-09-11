export type DateRange = { since: string; until: string };
export type MetaConfig = { token: string; accountId: string };
export type Action = { action_type: string; value: string };

type Insight = {
  campaign_name?: string;
  campaign_id?: string;
  spend?: string;
  actions?: Action[];
  inline_link_clicks?: string;
  inline_link_click_ctr?: string;
  cpm?: string;
  date_start?: string;
};

type CampaignStatus = { id: string; status: string };
type MetaResponse<T> = { data?: T[]; error?: { code?: number; message?: string } };

export type Summary = { spend: number; downloads: number; clicks: number; ctr: number; cpm: number };
export type DailyMetric = { date: string; spend: number; downloads: number; cpi: number | null };
export type CampaignMetric = {
  id: string;
  name: string;
  status: string;
  spend: number;
  downloads: number;
  cpi: number | null;
  clicks: number;
};
export type DashboardData = { summary: Summary; daily: DailyMetric[]; campaigns: CampaignMetric[] };

export class MetaApiError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
  }
}

const BASE_URL = "https://graph.facebook.com/v19.0";
const numberValue = (value?: string) => Number(value ?? 0) || 0;
export const getDownloads = (actions?: Action[]) =>
  numberValue(actions?.find((action) => action.action_type === "mobile_app_install")?.value);

function accountPath(accountId: string) {
  const clean = accountId.trim().replace(/^act_/, "");
  return `act_${clean}`;
}

async function request<T>(path: string, params: Record<string, string>, token: string): Promise<T[]> {
  const query = new URLSearchParams({ ...params, access_token: token });
  const response = await fetch(`${BASE_URL}/${path}?${query.toString()}`);
  const payload = (await response.json()) as MetaResponse<T>;
  if (!response.ok || payload.error) {
    throw new MetaApiError(payload.error?.message ?? "Não foi possível carregar os dados.", payload.error?.code);
  }
  return payload.data ?? [];
}

const timeRange = (range: DateRange) => JSON.stringify(range);

export async function testMetaConnection(token: string) {
  const rows = await request<{ name: string }>("me", { fields: "name" }, token);
  return rows[0]?.name ?? "Conta conectada";
}

export async function fetchDashboard(config: MetaConfig, range: DateRange): Promise<DashboardData> {
  const account = accountPath(config.accountId);
  const rangeValue = timeRange(range);
  const [summaryRows, dailyRows, campaignRows, statusRows] = await Promise.all([
    request<Insight>(account + "/insights", {
      fields: "spend,actions,inline_link_clicks,inline_link_click_ctr,cpm",
      time_range: rangeValue,
    }, config.token),
    request<Insight>(account + "/insights", {
      fields: "spend,actions",
      time_increment: "1",
      time_range: rangeValue,
      level: "account",
    }, config.token),
    request<Insight>(account + "/insights", {
      fields: "campaign_name,campaign_id,spend,actions,inline_link_clicks",
      level: "campaign",
      time_range: rangeValue,
      limit: "100",
    }, config.token),
    request<CampaignStatus>(account + "/campaigns", { fields: "id,name,status", limit: "100" }, config.token),
  ]);

  const insight = summaryRows[0];
  const statuses = new Map(statusRows.map((campaign) => [campaign.id, campaign.status]));
  const campaigns = campaignRows.map((campaign) => {
    const spend = numberValue(campaign.spend);
    const downloads = getDownloads(campaign.actions);
    return {
      id: campaign.campaign_id ?? campaign.campaign_name ?? crypto.randomUUID(),
      name: campaign.campaign_name ?? "Campanha sem nome",
      status: statuses.get(campaign.campaign_id ?? "") ?? "UNKNOWN",
      spend,
      downloads,
      cpi: downloads > 0 ? spend / downloads : null,
      clicks: numberValue(campaign.inline_link_clicks),
    };
  });

  return {
    summary: {
      spend: numberValue(insight?.spend),
      downloads: getDownloads(insight?.actions),
      clicks: numberValue(insight?.inline_link_clicks),
      ctr: numberValue(insight?.inline_link_click_ctr),
      cpm: numberValue(insight?.cpm),
    },
    daily: dailyRows.map((day) => {
      const spend = numberValue(day.spend);
      const downloads = getDownloads(day.actions);
      return { date: day.date_start ?? "", spend, downloads, cpi: downloads > 0 ? spend / downloads : null };
    }),
    campaigns,
  };
}
