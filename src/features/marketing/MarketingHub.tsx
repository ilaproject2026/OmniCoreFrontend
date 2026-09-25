import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketingApi } from '../../api/marketing.api';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Tabs } from '../../components/common/Tabs';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { MarketingCampaign, SocialPost } from '../../types';
import {
  Megaphone,
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  Share2,
  Eye,
  Heart,
  MessageSquare,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export const MarketingHub: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);

  const [newPost, setNewPost] = useState({
    channel: 'LinkedIn' as SocialPost['channel'],
    campaignName: '',
    caption: '',
    spend: 250,
    scheduledTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => marketingApi.getCampaigns(),
  });

  const { data: socialPosts = [], isLoading: postsLoading, refetch: refetchSocial } = useQuery({
    queryKey: ['socialPosts'],
    queryFn: () => marketingApi.getSocialPosts(),
  });

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    await marketingApi.createSocialPost({
      ...newPost,
      status: 'published',
    });
    refetchSocial();
    setIsNewPostModalOpen(false);
  };

  const totalSpend =
    campaigns.reduce((acc, c) => acc + (c.spend || 0), 0) +
    socialPosts.reduce((acc, p) => acc + (p.spend || 0), 0);

  const totalImpressions = socialPosts.reduce((acc, p) => acc + (p.reach || 0), 0);
  const totalLeads = campaigns.reduce((acc, c) => acc + (c.leadsGenerated || 0), 0);
  const averageRoi =
    campaigns.length > 0
      ? Math.round(campaigns.reduce((acc, c) => acc + (c.roi || 0), 0) / campaigns.length)
      : 0;

  const campaignColumns: ColumnDef<MarketingCampaign>[] = [
    {
      key: 'name',
      header: 'Campaign Name',
      sortable: true,
      accessor: (r) => r.name,
      render: (_, row) => (
        <div>
          <span className="font-bold text-white text-xs block">{row.name}</span>
          <span className="text-[11px] text-slate-400 capitalize">{row.verticalTarget.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      key: 'channel',
      header: 'Acquisition Channel',
      accessor: (r) => r.channel,
      render: (val) => <Badge variant="outline">{val}</Badge>,
    },
    {
      key: 'budget',
      header: 'Budget / Spend',
      render: (_, row) => (
        <div className="text-xs font-mono">
          <span className="text-white font-bold block">{formatCurrency(row.spend)}</span>
          <span className="text-[10px] text-slate-500">Budget: {formatCurrency(row.budget)}</span>
        </div>
      ),
    },
    {
      key: 'metrics',
      header: 'Leads & Conversions',
      render: (_, row) => (
        <div className="text-xs">
          <span className="font-bold text-emerald-400 font-mono block">{row.conversions} Signed Clients</span>
          <span className="text-[10px] text-slate-400">{row.leadsGenerated} Inbound Leads</span>
        </div>
      ),
    },
    {
      key: 'cac',
      header: 'Customer Acquisition Cost (CAC)',
      accessor: (r) => r.cac,
      render: (val) => <span className="font-mono text-slate-200 text-xs font-bold">{formatCurrency(val)}</span>,
    },
    {
      key: 'roi',
      header: 'Marketing ROI',
      sortable: true,
      accessor: (r) => r.roi,
      render: (val) => <span className="font-mono text-emerald-400 font-bold text-xs">+{val}%</span>,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (r) => r.status,
      render: (val: string) => (val === 'active' ? <Badge variant="success" dot>Active</Badge> : <Badge variant="default">{val}</Badge>),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Marketing, Digital Campaigns & Social Media
            <Badge variant="info" size="sm" className="font-mono">GROWTH ENGINE</Badge>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            B2B client acquisition, cross-channel social media ads (LinkedIn, Instagram, Google, Facebook), and direct lead attribution.
          </p>
        </div>

        {activeTab === 'social' && (
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsNewPostModalOpen(true)}
          >
            Create Social Post
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Marketing Spend"
          value={formatCurrency(totalSpend)}
          subtitle="All active channels"
          icon={<DollarSign className="h-4 w-4" />}
          accentColor="purple"
        />
        <StatCard
          title="Social Ad Impressions"
          value={`${totalImpressions.toLocaleString()} Reach`}
          subtitle="LinkedIn & Instagram"
          icon={<Eye className="h-4 w-4" />}
          accentColor="blue"
        />
        <StatCard
          title="Qualified B2B Leads"
          value={`${totalLeads} Leads`}
          subtitle="Enterprise Inquiries"
          icon={<Users className="h-4 w-4" />}
          accentColor="emerald"
        />
        <StatCard
          title="Blended B2B ROI"
          value={averageRoi > 0 ? `+${averageRoi}%` : '0%'}
          subtitle="Conversion attribution"
          icon={<TrendingUp className="h-4 w-4" />}
          accentColor="emerald"
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'campaigns', label: 'B2B Enterprise Campaigns & ROI' },
          { id: 'social', label: `Social Media & Digital Promotions (${socialPosts.length})` },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ================= TAB 1: ENTERPRISE CAMPAIGNS ================= */}
      {activeTab === 'campaigns' && (
        <DataTable
          columns={campaignColumns}
          data={campaigns}
          isLoading={campaignsLoading}
          searchPlaceholder="Search campaigns, channels..."
        />
      )}

      {/* ================= TAB 2: SOCIAL MEDIA & DIGITAL PROMOTIONS ================= */}
      {activeTab === 'social' && (
        <div className="space-y-4">
          {socialPosts.length === 0 ? (
            <Card className="p-10 text-center border-slate-800 bg-slate-900/40">
              <Megaphone className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-white font-semibold text-sm">No Social Promotions Active</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
                No social media posts or digital promotions published yet. Click &quot;Create Social Post&quot; above to launch a campaign across LinkedIn, Google, Facebook, or Instagram.
              </p>
              <div className="mt-4">
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsNewPostModalOpen(true)}
                >
                  Create Social Post
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {socialPosts.map((post) => {
              const channelColors: Record<string, string> = {
                LinkedIn: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
                Instagram: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
                Google: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                Facebook: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30',
              };
              return (
                <Card key={post.id} className="p-5 border-slate-800 bg-slate-900/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${channelColors[post.channel] || ''}`}>
                          {post.channel}
                        </span>
                        <span className="font-semibold text-xs text-white">{post.campaignName}</span>
                      </div>
                      <Badge variant={post.status === 'published' ? 'success' : 'neutral'} size="xs">
                        {post.status.toUpperCase()}
                      </Badge>
                    </div>

                    {post.imageUrl && (
                      <div className="my-3 rounded-lg overflow-hidden h-40 border border-slate-800">
                        <img src={post.imageUrl} alt={post.campaignName} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <p className="text-xs text-slate-300 mt-3 line-clamp-3 leading-relaxed">
                      "{post.caption}"
                    </p>

                    <div className="mt-4 grid grid-cols-4 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Reach</span>
                        <span className="font-bold text-white font-mono">{post.reach.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Engagements</span>
                        <span className="font-bold text-cyan-400 font-mono">{post.engagements.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Leads</span>
                        <span className="font-bold text-emerald-400 font-mono">{post.leadsGenerated}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Ad Spend</span>
                        <span className="font-bold text-slate-200 font-mono">${post.spend}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 font-mono">
                    <span>Scheduled: {post.scheduledTime}</span>
                    <span className="text-emerald-400 font-semibold">{post.conversions} direct conversions</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* ================= MODAL: CREATE SOCIAL POST ================= */}
      <Modal
        isOpen={isNewPostModalOpen}
        onClose={() => setIsNewPostModalOpen(false)}
        title="Schedule Digital Ad / Social Campaign Post"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Ad Channel"
              value={newPost.channel}
              onChange={(e) => setNewPost({ ...newPost, channel: e.target.value as any })}
              options={[
                { label: 'LinkedIn B2B', value: 'LinkedIn' },
                { label: 'Instagram Ads', value: 'Instagram' },
                { label: 'Google Search Ads', value: 'Google' },
                { label: 'Facebook Commercial', value: 'Facebook' },
              ]}
            />
            <Input
              label="Campaign Budget ($)"
              type="number"
              value={newPost.spend}
              onChange={(e) => setNewPost({ ...newPost, spend: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Campaign Name"
            required
            value={newPost.campaignName}
            onChange={(e) => setNewPost({ ...newPost, campaignName: e.target.value })}
            placeholder="e.g. Express Parcel Same Day Service Launch"
          />

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Post Caption & Copy</label>
            <textarea
              required
              rows={4}
              value={newPost.caption}
              onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
              placeholder="Highlight key value proposition, hashtags, and CTA link..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsNewPostModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" icon={<Share2 className="h-4 w-4" />}>
              Publish & Launch Ad
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
