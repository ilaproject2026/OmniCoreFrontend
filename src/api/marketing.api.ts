import { apiClient } from './client';
import { MarketingCampaign, SocialPost } from '../types';

export interface MarketingSocialAccount {
  id: string;
  channelId: string;
  platform: SocialPost['channel'];
  accountName: string;
  accountId: string;
  isConnected: boolean;
}

const extractList = (data: any): any[] =>
  Array.isArray(data) ? data : (data?.results || data?.data || []);

const platformFromBackend = (platform?: string): SocialPost['channel'] => {
  switch ((platform || '').toUpperCase()) {
    case 'FACEBOOK': return 'Facebook';
    case 'INSTAGRAM': return 'Instagram';
    case 'LINKEDIN': return 'LinkedIn';
    case 'GOOGLE_ADS': return 'Google';
    default: return 'LinkedIn';
  }
};

const platformToBackend = (platform: SocialPost['channel']): string => ({
  Facebook: 'FACEBOOK',
  Instagram: 'INSTAGRAM',
  LinkedIn: 'LINKEDIN',
  Google: 'GOOGLE_ADS',
}[platform]);

const campaignChannelFromBackend = (campaignType?: string): MarketingCampaign['channel'] => {
  switch ((campaignType || '').toUpperCase()) {
    case 'GOOGLE_ADS': return 'Google Ads';
    case 'LINKEDIN':
    case 'LINKEDIN_B2B': return 'LinkedIn B2B';
    case 'INDUSTRY_EXPO': return 'Industry Expo';
    case 'COLD_OUTREACH': return 'Cold Outreach';
    case 'REFERRAL': return 'Referral';
    default: return 'LinkedIn B2B';
  }
};

const campaignTypeToBackend = (channel: MarketingCampaign['channel']): string => ({
  'Google Ads': 'GOOGLE_ADS',
  'LinkedIn B2B': 'LINKEDIN_B2B',
  'Industry Expo': 'INDUSTRY_EXPO',
  'Cold Outreach': 'COLD_OUTREACH',
  Referral: 'REFERRAL',
}[channel]);

const normalizeCampaign = (raw: any): MarketingCampaign => {
  const metrics = Array.isArray(raw.metrics) ? raw.metrics : [];
  const impressions = Number(raw.impressions ?? metrics.reduce((sum: number, m: any) => sum + Number(m.impressions || 0), 0));
  const clicks = Number(raw.clicks ?? metrics.reduce((sum: number, m: any) => sum + Number(m.clicks || 0), 0));
  const leadsGenerated = Number(raw.leads_generated ?? metrics.reduce((sum: number, m: any) => sum + Number(m.leads_generated || 0), 0));
  const conversions = Number(raw.conversions ?? metrics.reduce((sum: number, m: any) => sum + Number(m.conversions || 0), 0));
  const spend = Number(raw.spend || 0);
  const budget = Number(raw.budget || 0);
  const attributedRevenue = Number(raw.attributed_revenue ?? raw.attributedRevenue ?? 0);
  return {
    ...raw,
    id: raw.id,
    name: raw.name || '',
    channel: raw.channel || campaignChannelFromBackend(raw.campaign_type),
    verticalTarget: raw.vertical_target || raw.verticalTarget || 'freight_logistics',
    budget,
    spend,
    impressions,
    clicks,
    leadsGenerated,
    conversions,
    cac: conversions > 0 ? spend / conversions : 0,
    roi: spend > 0 ? Math.round(((attributedRevenue - spend) / spend) * 100) : 0,
    attributedRevenue,
    startDate: raw.start_date || raw.startDate || '',
    endDate: raw.end_date || raw.endDate || '',
    status: String(raw.status || 'DRAFT').toLowerCase() as MarketingCampaign['status'],
  };
};

const normalizeSocialPost = (raw: any): SocialPost => {
  const performance = raw.performance || {};
  return {
    ...raw,
    id: raw.id,
    socialAccountId: raw.social_account_id || raw.social_account,
    socialCampaignId: raw.social_campaign_id || raw.social_campaign || undefined,
    channel: raw.channel || platformFromBackend(raw.platform),
    campaignName: raw.campaign_name || raw.account_name || 'Social post',
    caption: raw.caption || raw.content || '',
    imageUrl: raw.image_url || raw.media_urls?.[0] || undefined,
    scheduledTime: raw.scheduled_at || raw.scheduledTime || '',
    reach: Number(raw.reach ?? performance.impressions ?? 0),
    engagements: Number(raw.engagements ?? performance.engagements ?? performance.clicks ?? 0),
    leadsGenerated: Number(raw.leads_generated ?? performance.leads ?? 0),
    conversions: Number(raw.conversions ?? performance.conversions ?? 0),
    spend: Number(raw.spend ?? 0),
    status: String(raw.status || 'DRAFT').toLowerCase() as SocialPost['status'],
  };
};

export const marketingApi = {
  getCampaigns: async (): Promise<MarketingCampaign[]> => {
    const response = await apiClient.get<any>('/marketing/campaigns/');
    return extractList(response.data).map(normalizeCampaign);
  },

  createCampaign: async (payload: Partial<MarketingCampaign>): Promise<MarketingCampaign> => {
    const response = await apiClient.post<any>('/marketing/campaigns/', {
      name: payload.name,
      campaign_type: payload.channel ? campaignTypeToBackend(payload.channel) : 'DIGITAL',
      vertical_target: payload.verticalTarget || 'freight_logistics',
      start_date: payload.startDate,
      end_date: payload.endDate,
      budget: payload.budget ?? 0,
      status: String(payload.status || 'draft').toUpperCase(),
    });
    return normalizeCampaign(response.data);
  },

  updateCampaignStatus: async (id: string, status: MarketingCampaign['status']): Promise<MarketingCampaign> => {
    const response = await apiClient.patch<any>(`/marketing/campaigns/${id}/`, { status: status.toUpperCase() });
    return normalizeCampaign(response.data);
  },

  updateCampaignMetrics: async (
    id: string,
    metrics: { impressions: number; clicks: number; leadsGenerated: number; conversions: number; spend: number; attributedRevenue: number }
  ): Promise<MarketingCampaign> => {
    const response = await apiClient.patch<any>(`/marketing/campaigns/${id}/metrics/`, {
      impressions: metrics.impressions,
      clicks: metrics.clicks,
      leads_generated: metrics.leadsGenerated,
      conversions: metrics.conversions,
      spend: metrics.spend,
      attributed_revenue: metrics.attributedRevenue,
    });
    return normalizeCampaign(response.data);
  },

  getSocialChannels: async (): Promise<any[]> => {
    const response = await apiClient.get<any>('/marketing/social/channels/');
    return extractList(response.data);
  },

  getSocialAccounts: async (): Promise<MarketingSocialAccount[]> => {
    const response = await apiClient.get<any>('/marketing/social/accounts/');
    return extractList(response.data).map((raw: any) => ({
      id: raw.id,
      channelId: raw.channel,
      platform: platformFromBackend(raw.platform),
      accountName: raw.account_name || '',
      accountId: raw.account_id || '',
      isConnected: Boolean(raw.is_connected),
    }));
  },

  createSocialAccount: async (payload: { platform: SocialPost['channel']; accountName: string; accountId: string; token?: string }): Promise<MarketingSocialAccount> => {
    const channelName = `${payload.platform} — ${payload.accountName}`;
    const channels = await marketingApi.getSocialChannels();
    let channel = channels.find((item: any) => item.platform === platformToBackend(payload.platform) && item.name === channelName);
    if (!channel) {
      const channelResponse = await apiClient.post<any>('/marketing/social/channels/', {
        platform: platformToBackend(payload.platform),
        name: channelName,
        is_active: true,
      });
      channel = channelResponse.data;
    }
    const accountResponse = await apiClient.post<any>('/marketing/social/accounts/', {
      channel: channel.id,
      account_name: payload.accountName,
      account_id: payload.accountId,
      api_key_or_token: payload.token || '',
      is_connected: true,
    });
    return {
      id: accountResponse.data.id,
      channelId: accountResponse.data.channel,
      platform: payload.platform,
      accountName: accountResponse.data.account_name,
      accountId: accountResponse.data.account_id,
      isConnected: Boolean(accountResponse.data.is_connected),
    };
  },

  getSocialPosts: async (): Promise<SocialPost[]> => {
    const response = await apiClient.get<any>('/marketing/social/posts/');
    return extractList(response.data).map(normalizeSocialPost);
  },

  createSocialPost: async (payload: Partial<SocialPost>): Promise<SocialPost> => {
    if (!payload.socialAccountId) throw new Error('Select a connected social account before scheduling a post.');
    const scheduledAt = payload.scheduledTime ? new Date(payload.scheduledTime).toISOString() : null;
    const response = await apiClient.post<any>('/marketing/social/posts/', {
      social_account: payload.socialAccountId,
      social_campaign: payload.socialCampaignId || null,
      content: payload.caption || '',
      media_urls: payload.imageUrl ? [payload.imageUrl] : [],
      scheduled_at: scheduledAt,
      status: scheduledAt && new Date(scheduledAt).getTime() > Date.now() ? 'SCHEDULED' : 'DRAFT',
    });
    return normalizeSocialPost(response.data);
  },

  updateSocialPostStatus: async (id: string, status: SocialPost['status']): Promise<SocialPost> => {
    const response = await apiClient.patch<any>(`/marketing/social/posts/${id}/`, { status: status.toUpperCase() });
    return normalizeSocialPost(response.data);
  },
};
