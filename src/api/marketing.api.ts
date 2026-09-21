import { apiClient } from './client';
import { MarketingCampaign, SocialPost } from '../types';

export const marketingApi = {
  getCampaigns: async (): Promise<MarketingCampaign[]> => {
    const response = await apiClient.get<any>('/marketing/campaigns/');
    return Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
  },

  getSocialPosts: async (): Promise<SocialPost[]> => {
    const response = await apiClient.get<any>('/marketing/social-posts/');
    return Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
  },

  createSocialPost: async (payload: Partial<SocialPost>): Promise<SocialPost> => {
    const response = await apiClient.post<SocialPost>('/marketing/social-posts/', payload);
    return response.data;
  },

  updateSocialPostStatus: async (
    id: string,
    status: SocialPost['status']
  ): Promise<SocialPost> => {
    const response = await apiClient.patch<SocialPost>(`/marketing/social-posts/${id}/`, { status });
    return response.data;
  },
};

