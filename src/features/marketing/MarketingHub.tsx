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
import { MarketingCampaign, SocialPost, VerticalType } from '../../types';
import {
  Megaphone,
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Calendar,
  Pause,
  Check,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

const dateOnly = (date: Date) => date.toISOString().slice(0, 10);
const localDateTime = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};
const getErrorMessage = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: unknown }).message || 'Request failed. Please try again.')
    : 'Request failed. Please try again.';

export const MarketingHub: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'social'>('campaigns');
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [metricsCampaign, setMetricsCampaign] = useState<MarketingCampaign | null>(null);
  const today = dateOnly(new Date());
  const [newCampaign, setNewCampaign] = useState({
    name: '', channel: 'LinkedIn B2B' as MarketingCampaign['channel'],
    verticalTarget: 'freight_logistics' as VerticalType, startDate: today,
    endDate: dateOnly(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), budget: 0,
  });

  const [newPost, setNewPost] = useState({
    socialAccountId: '',
    caption: '',
    scheduledTime: localDateTime(new Date(Date.now() + 60 * 60 * 1000)),
  });

  const [newAccount, setNewAccount] = useState({
    platform: 'LinkedIn' as SocialPost['channel'],
    accountName: '',
    accountId: '',
  });
  const [campaignMetrics, setCampaignMetrics] = useState({
    impressions: 0, clicks: 0, leadsGenerated: 0, conversions: 0, spend: 0, attributedRevenue: 0,
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => marketingApi.getCampaigns(),
  });

  const { data: socialPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['socialPosts'],
    queryFn: () => marketingApi.getSocialPosts(),
  });

  const { data: socialAccounts = [] } = useQuery({
    queryKey: ['marketingSocialAccounts'],
    queryFn: () => marketingApi.getSocialAccounts(),
  });

  const createCampaignMutation = useMutation({
    mutationFn: () => marketingApi.createCampaign(newCampaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setIsNewCampaignModalOpen(false);
      setNewCampaign({ name: '', channel: 'LinkedIn B2B', verticalTarget: 'freight_logistics', startDate: today,
        endDate: dateOnly(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), budget: 0 });
    },
  });

  const updateCampaignStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MarketingCampaign['status'] }) => marketingApi.updateCampaignStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const updateMetricsMutation = useMutation({
    mutationFn: () => {
      if (!metricsCampaign) throw new Error('Select a campaign to update.');
      return marketingApi.updateCampaignMetrics(metricsCampaign.id, campaignMetrics);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setMetricsCampaign(null);
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: () => marketingApi.createSocialAccount(newAccount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketingSocialAccounts'] });
      setIsNewAccountModalOpen(false);
      setNewAccount({ platform: 'LinkedIn', accountName: '', accountId: '' });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: () => marketingApi.createSocialPost(newPost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
      setIsNewPostModalOpen(false);
      setNewPost({ socialAccountId: '', caption: '', scheduledTime: localDateTime(new Date(Date.now() + 60 * 60 * 1000)) });
    },
  });

  const updatePostStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SocialPost['status'] }) => marketingApi.updateSocialPostStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['socialPosts'] }),
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    createPostMutation.mutate();
  };

  const totalSpend =
    campaigns.reduce((acc, c) => acc + (c.spend || 0), 0) +
    socialPosts.reduce((acc, p) => acc + (p.spend || 0), 0);

  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0) + socialPosts.reduce((acc, p) => acc + (p.reach || 0), 0);
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
      render: (val: string) => (val === 'active' ? <Badge variant="success" dot>Active</Badge> : <Badge variant={val === 'completed' ? 'neutral' : 'default'}>{val}</Badge>),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <Button size="xs" variant="outline" onClick={() => {
            setMetricsCampaign(row);
            setCampaignMetrics({
              impressions: row.impressions || 0, clicks: row.clicks || 0, leadsGenerated: row.leadsGenerated, conversions: row.conversions,
              spend: row.spend, attributedRevenue: row.attributedRevenue || 0,
            });
          }}>
            Log results
          </Button>
          {row.status !== 'completed' && (
            <Button size="xs" variant="outline" isLoading={updateCampaignStatusMutation.isPending}
              onClick={() => updateCampaignStatusMutation.mutate({ id: row.id, status: row.status === 'active' ? 'paused' : 'active' })}>
              {row.status === 'active' ? <Pause className="h-3 w-3" /> : <Check className="h-3 w-3" />}
              {row.status === 'active' ? 'Pause' : 'Activate'}
            </Button>
          )}
          {row.status !== 'completed' && (
            <Button size="xs" variant="ghost" isLoading={updateCampaignStatusMutation.isPending}
              onClick={() => updateCampaignStatusMutation.mutate({ id: row.id, status: 'completed' })}>
              Complete
            </Button>
          )}
        </div>
      ),
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
            Manage campaign budgets and results, then schedule social content for registered accounts.
          </p>
        </div>

        {activeTab === 'campaigns' ? (
          <Button size="sm" variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsNewCampaignModalOpen(true)}>
            New Campaign
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsNewAccountModalOpen(true)}>
              Add Social Account
            </Button>
            <Button size="sm" variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsNewPostModalOpen(true)}>
              Schedule Post
            </Button>
          </div>
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
          subtitle="Registered social accounts"
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
        onChange={(id) => setActiveTab(id as 'campaigns' | 'social')}
      />

      {/* ================= TAB 1: ENTERPRISE CAMPAIGNS ================= */}
      {activeTab === 'campaigns' && (
        <div className="space-y-3">
          {(updateCampaignStatusMutation.isError || updateMetricsMutation.isError) && (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {getErrorMessage(updateCampaignStatusMutation.error || updateMetricsMutation.error)}
            </p>
          )}
          <DataTable columns={campaignColumns} data={campaigns} isLoading={campaignsLoading} searchPlaceholder="Search campaigns, channels..." />
        </div>
      )}

      {/* ================= TAB 2: SOCIAL MEDIA & DIGITAL PROMOTIONS ================= */}
      {activeTab === 'social' && (
        <div className="space-y-4">
          {createPostMutation.isError || updatePostStatusMutation.isError ? (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {getErrorMessage(createPostMutation.error || updatePostStatusMutation.error)}
            </p>
          ) : null}
          {socialPosts.length === 0 ? (
            <Card className="p-10 text-center border-slate-800 bg-slate-900/40">
              <Megaphone className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-white font-semibold text-sm">No Social Promotions Active</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
                Add a social account, then schedule posts here. Publishing is recorded manually; this workspace does not connect to external ad platforms.
              </p>
              <div className="mt-4">
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => socialAccounts.length ? setIsNewPostModalOpen(true) : setIsNewAccountModalOpen(true)}
                >
                  {socialAccounts.length ? 'Schedule Post' : 'Add Social Account'}
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
                      <Badge variant={post.status === 'published' ? 'success' : post.status === 'scheduled' ? 'info' : 'neutral'} size="xs">
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

                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center gap-3 text-xs text-slate-500 font-mono">
                    <span>Scheduled: {post.scheduledTime ? new Date(post.scheduledTime).toLocaleString() : 'No time set'}</span>
                    {post.status === 'scheduled' && (
                      <Button size="xs" variant="outline" isLoading={updatePostStatusMutation.isPending}
                        onClick={() => updatePostStatusMutation.mutate({ id: post.id, status: 'published' })}>
                        Mark published
                      </Button>
                    )}
                    {post.status === 'draft' && (
                      <Button size="xs" variant="outline" isLoading={updatePostStatusMutation.isPending}
                        onClick={() => updatePostStatusMutation.mutate({ id: post.id, status: 'scheduled' })}>
                        Schedule
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    )}

      <Modal isOpen={isNewCampaignModalOpen} onClose={() => setIsNewCampaignModalOpen(false)} title="Create Marketing Campaign"
        description="Set the campaign channel, audience, dates, and budget." size="md">
        <form onSubmit={(event) => { event.preventDefault(); createCampaignMutation.mutate(); }} className="space-y-4 text-xs">
          {createCampaignMutation.isError && <p role="alert" className="text-red-300">{getErrorMessage(createCampaignMutation.error)}</p>}
          <Input label="Campaign Name" required value={newCampaign.name}
            onChange={(event) => setNewCampaign({ ...newCampaign, name: event.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Acquisition Channel" required value={newCampaign.channel}
              onChange={(event) => setNewCampaign({ ...newCampaign, channel: event.target.value as MarketingCampaign['channel'] })}
              options={[
                { value: 'LinkedIn B2B', label: 'LinkedIn B2B' },
                { value: 'Google Ads', label: 'Google Ads' },
                { value: 'Industry Expo', label: 'Industry Expo' },
                { value: 'Cold Outreach', label: 'Cold Outreach' },
                { value: 'Referral', label: 'Referral' },
              ]} />
            <Select label="Target Vertical" required value={newCampaign.verticalTarget}
              onChange={(event) => setNewCampaign({ ...newCampaign, verticalTarget: event.target.value as VerticalType })}
              options={[
                { value: 'freight_logistics', label: 'Freight Logistics' },
                { value: 'cold_chain', label: 'Cold Chain' },
                { value: 'last_mile', label: 'Last Mile' },
                { value: 'bulk_fleet', label: 'Bulk Fleet' },
                { value: 'corporate_shuttle', label: 'Corporate Shuttle' },
                { value: 'b2b_contract', label: 'B2B Contracts' },
              ]} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Start Date" type="date" required value={newCampaign.startDate}
              onChange={(event) => setNewCampaign({ ...newCampaign, startDate: event.target.value })} />
            <Input label="End Date" type="date" min={newCampaign.startDate} required value={newCampaign.endDate}
              onChange={(event) => setNewCampaign({ ...newCampaign, endDate: event.target.value })} />
            <Input label="Budget" type="number" min={0} step={1} required value={newCampaign.budget}
              onChange={(event) => setNewCampaign({ ...newCampaign, budget: Number(event.target.value) })} />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" size="sm" variant="outline" onClick={() => setIsNewCampaignModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!newCampaign.name.trim() || newCampaign.budget < 0 || createCampaignMutation.isPending}
              isLoading={createCampaignMutation.isPending}>Create Campaign</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(metricsCampaign)} onClose={() => setMetricsCampaign(null)} title="Log Campaign Results"
        description={metricsCampaign?.name || ''} size="md">
        {metricsCampaign && (
          <form onSubmit={(event) => { event.preventDefault(); updateMetricsMutation.mutate(); }} className="space-y-4 text-xs">
            {updateMetricsMutation.isError && <p role="alert" className="text-red-300">{getErrorMessage(updateMetricsMutation.error)}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Impressions" type="number" min={0} step={1} value={campaignMetrics.impressions}
                onChange={(event) => setCampaignMetrics({ ...campaignMetrics, impressions: Number(event.target.value) })} />
              <Input label="Clicks" type="number" min={0} step={1} value={campaignMetrics.clicks}
                onChange={(event) => setCampaignMetrics({ ...campaignMetrics, clicks: Number(event.target.value) })} />
              <Input label="Leads" type="number" min={0} step={1} value={campaignMetrics.leadsGenerated}
                onChange={(event) => setCampaignMetrics({ ...campaignMetrics, leadsGenerated: Number(event.target.value) })} />
              <Input label="Conversions" type="number" min={0} step={1} value={campaignMetrics.conversions}
                onChange={(event) => setCampaignMetrics({ ...campaignMetrics, conversions: Number(event.target.value) })} />
              <Input label="Spend" type="number" min={0} step={1} value={campaignMetrics.spend}
                onChange={(event) => setCampaignMetrics({ ...campaignMetrics, spend: Number(event.target.value) })} />
              <Input label="Attributed Revenue" type="number" min={0} step={1} value={campaignMetrics.attributedRevenue}
                onChange={(event) => setCampaignMetrics({ ...campaignMetrics, attributedRevenue: Number(event.target.value) })} />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <Button type="button" size="sm" variant="outline" onClick={() => setMetricsCampaign(null)}>Cancel</Button>
              <Button type="submit" size="sm" isLoading={updateMetricsMutation.isPending}>Save Results</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={isNewAccountModalOpen} onClose={() => setIsNewAccountModalOpen(false)} title="Register Social Account"
        description="Add an account reference for scheduling content. External publishing is not configured in this workspace." size="sm">
        <form onSubmit={(event) => { event.preventDefault(); createAccountMutation.mutate(); }} className="space-y-4 text-xs">
          {createAccountMutation.isError && <p role="alert" className="text-red-300">{getErrorMessage(createAccountMutation.error)}</p>}
          <Select label="Platform" required value={newAccount.platform}
            onChange={(event) => setNewAccount({ ...newAccount, platform: event.target.value as SocialPost['channel'] })}
            options={[
              { value: 'LinkedIn', label: 'LinkedIn' }, { value: 'Instagram', label: 'Instagram' },
              { value: 'Google', label: 'Google Ads' }, { value: 'Facebook', label: 'Facebook' },
            ]} />
          <Input label="Account Name" required value={newAccount.accountName}
            onChange={(event) => setNewAccount({ ...newAccount, accountName: event.target.value })} />
          <Input label="Account ID / Handle" required value={newAccount.accountId}
            onChange={(event) => setNewAccount({ ...newAccount, accountId: event.target.value })} />
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" size="sm" variant="outline" onClick={() => setIsNewAccountModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createAccountMutation.isPending}>Save Account</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isNewPostModalOpen} onClose={() => setIsNewPostModalOpen(false)} title="Schedule Social Post"
        description="Save post copy and a planned time for a registered social account. Publishing is recorded manually." size="md">
        <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
          {createPostMutation.isError && <p role="alert" className="text-red-300">{getErrorMessage(createPostMutation.error)}</p>}
          {!socialAccounts.length && <p className="text-amber-300">Add a social account before scheduling a post.</p>}
          <Select label="Social Account" required value={newPost.socialAccountId}
            onChange={(event) => setNewPost({ ...newPost, socialAccountId: event.target.value })}
            options={[
              { value: '', label: 'Select an account', disabled: true },
              ...socialAccounts.filter((account) => account.isConnected).map((account) => ({
                value: account.id, label: `${account.accountName} · ${account.platform}`,
              })),
            ]} />
          <Input label="Scheduled Time" type="datetime-local" min={localDateTime(new Date())} value={newPost.scheduledTime}
            onChange={(event) => setNewPost({ ...newPost, scheduledTime: event.target.value })} />
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Post Caption & Copy</label>
            <textarea required rows={5} value={newPost.caption}
              onChange={(event) => setNewPost({ ...newPost, caption: event.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
              placeholder="Write the post content..." />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsNewPostModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" disabled={!newPost.socialAccountId || createPostMutation.isPending}
              isLoading={createPostMutation.isPending} leftIcon={<Calendar className="h-4 w-4" />}>Schedule Post</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
