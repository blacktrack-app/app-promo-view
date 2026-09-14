export type DateRange = { since: string; until: string };
export type MetaConfig = { token: string; accountId: string };
export type Action = { action_type: string; value: string };

type Insight = {
  campaign_name?: string;
  campaign_id?: string;
  spend?: string;
  actions?: Action[];
  action_values?: Action[];
  inline_link_clicks?: string;
  inline_link_click_ctr?: string;
  cpm?: string;
  date_start?: string;
};

type CampaignStatus = { id: string; status: string };
type MetaResponse<T> = { data?: T[]; error?: { code?: number; message?: string } };

export type EventMetrics = {
  spend: number;
  installs: number;
  activations: number;
  registrations: number;
  startTrials: number;
  initiatedCheckouts: number;
  subscribes: number;
  purchases: number;
  purchaseValue: number;
  subscribeValue: number;
  viewContent: number;
  searches: number;
  detectorQueries: number;
  clicks: number;
  ctr: number;
  cpm: number;
};

export type Summary = EventMetrics;
export type DailyMetric = EventMetrics & { date: string };
export type CampaignMetric = EventMetrics & {
  id: string;
  name: string;
  status: string;
  cpi: number | null;
  cpa: number | null;
  roas: number | null;
};
export type DashboardData = { summary: Summary; daily: DailyMetric[]; campaigns: CampaignMetric[] };

export class MetaApiError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
  }
}

const BASE_URL = "https://graph.facebook.com/v19.0";
const numberValue = (value?: string) => Number(value ?? 0) || 0;

export function getActionValue(actions: Action[] | undefined, actionType: string) {
  if (!Array.isArray(actions)) return 0;
  const shortType = actionType.replace("app_custom_event.fb_mobile_", "");
  const variations = [
    actionType,
    `offsite_conversion.${actionType}`,
    actionType.replace("app_custom_event.", "offsite_conversion.fb_pixel_"),
    actionType.replace("app_custom_event.", ""),
    shortType,
    `offsite_conversion.${shortType}`,
  ];
  for (const variation of variations) {
    const found = actions.find((action) => action.action_type === variation);
    if (found) return numberValue(found.value);
  }
  return 0;
}

export function processInsight(data: Insight | undefined): EventMetrics {
  const actions = data?.actions;
  const actionValues = data?.action_values;
  return {
    spend: numberValue(data?.spend),
    installs: getActionValue(actions, "mobile_app_install"),
    activations: getActionValue(actions, "app_custom_event.fb_mobile_activate_app"),
    registrations: getActionValue(actions, "app_custom_event.fb_mobile_complete_registration"),
    startTrials: getActionValue(actions, "app_custom_event.fb_mobile_start_trial"),
    initiatedCheckouts: getActionValue(actions, "app_custom_event.fb_mobile_initiated_checkout"),
    subscribes: getActionValue(actions, "app_custom_event.fb_mobile_subscribe"),
    purchases: getActionValue(actions, "app_custom_event.fb_mobile_purchase"),
    purchaseValue: getActionValue(actionValues, "app_custom_event.fb_mobile_purchase"),
    subscribeValue: getActionValue(actionValues, "app_custom_event.fb_mobile_subscribe"),
    viewContent: getActionValue(actions, "app_custom_event.fb_mobile_content_view"),
    searches: getActionValue(actions, "app_custom_event.fb_mobile_search"),
    detectorQueries: getActionValue(actions, "app_custom_event.DetectorQuery"),
    clicks: numberValue(data?.inline_link_clicks),
    ctr: numberValue(data?.inline_link_click_ctr),
    cpm: numberValue(data?.cpm),
  };
}

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
const insightFields = "spend,actions,action_values,inline_link_clicks,inline_link_click_ctr,cpm";

export async function testMetaConnection(token: string) {
  const query = new URLSearchParams({ fields: "name", access_token: token });
  const response = await fetch(`${BASE_URL}/me?${query.toString()}`);
  const payload = (await response.json()) as { name?: string; error?: { code?: number; message?: string } };
  if (!response.ok || payload.error) {
    throw new MetaApiError(payload.error?.message ?? "Token inválido ou expirado", payload.error?.code);
  }
  return payload.name ?? "Conta conectada";
}

export async function fetchDashboard(config: MetaConfig, range: DateRange): Promise<DashboardData> {
  const account = accountPath(config.accountId);
  const rangeValue = timeRange(range);
  const [summaryRows, dailyRows, campaignRows, statusRows] = await Promise.all([
    request<Insight>(account + "/insights", { fields: insightFields, time_range: rangeValue }, config.token),
    request<Insight>(account + "/insights", {
      fields: insightFields,
      time_increment: "1",
      time_range: rangeValue,
      level: "account",
    }, config.token),
    request<Insight>(account + "/insights", {
      fields: `campaign_name,campaign_id,${insightFields}`,
      level: "campaign",
      time_range: rangeValue,
      limit: "100",
    }, config.token),
    request<CampaignStatus>(account + "/campaigns", { fields: "id,name,status", limit: "100" }, config.token),
  ]);

  const statuses = new Map(statusRows.map((campaign) => [campaign.id, campaign.status]));
  const campaigns = campaignRows.map((campaign) => {
    const metrics = processInsight(campaign);
    const acquisitions = metrics.subscribes + metrics.purchases;
    const revenue = metrics.purchaseValue + metrics.subscribeValue;
    return {
      ...metrics,
      id: campaign.campaign_id ?? campaign.campaign_name ?? crypto.randomUUID(),
      name: campaign.campaign_name ?? "Campanha sem nome",
      status: statuses.get(campaign.campaign_id ?? "") ?? "UNKNOWN",
      cpi: metrics.installs > 0 ? metrics.spend / metrics.installs : null,
      cpa: acquisitions > 0 ? metrics.spend / acquisitions : null,
      roas: metrics.spend > 0 ? revenue / metrics.spend : null,
    };
  });

  return {
    summary: processInsight(summaryRows[0]),
    daily: dailyRows.map((day) => ({ ...processInsight(day), date: day.date_start ?? "" })),
    campaigns,
  };
}