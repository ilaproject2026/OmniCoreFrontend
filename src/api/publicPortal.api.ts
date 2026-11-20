import { apiClient } from './client';
import { TenantPublicCms } from '../types';

export interface PublicShipmentTracking {
  awbNumber: string;
  status: string;
  serviceType: string;
  senderCity: string;
  deliveryCity: string;
  expectedDelivery?: string | null;
  maskedReceiver: string;
  events: Array<{ status: string; timestamp: string; location: string; description: string }>;
}

export interface PublicBookingResult {
  success: boolean;
  bookingReference: string;
  bookingType: 'shipment' | 'trip_booking';
  awbNumber?: string;
  status: string;
  message: string;
}

const responseData = (response: any) => response.data?.data || response.data;

const normalizeCms = (raw: any): TenantPublicCms => {
  const pages = Array.isArray(raw.pages) ? raw.pages : [];
  const hero = pages
    .flatMap((page: any) => Array.isArray(page.sections) ? page.sections : [])
    .find((section: any) => String(section.section_type).toUpperCase() === 'HERO');
  const theme = raw.theme || {};

  return {
    tenantSlug: raw.subdomain || raw.slug || '',
    companyName: raw.company_name || raw.site_title || 'Logistics Workspace',
    isPublished: raw.is_published !== false,
    enabledVerticals: Array.isArray(raw.enabled_verticals) ? raw.enabled_verticals : [],
    phoneVerificationRequired: Boolean(raw.booking_config?.require_phone_verification),
    tagline: raw.tagline || '',
    logoUrl: raw.logo_url || undefined,
    primaryColor: theme.primaryColor || theme.primary_color || '#10b981',
    accentColor: theme.accentColor || theme.accent_color || '#3b82f6',
    contactEmail: raw.contact_email || '',
    contactPhone: raw.contact_phone || '',
    address: raw.address || '',
    heroHeadline: hero?.heading || raw.tagline || '',
    heroSubtitle: hero?.subheading || raw.about_text || '',
    enabledServices: (Array.isArray(raw.services) ? raw.services : [])
      .filter((service: any) => service.is_featured !== false)
      .map((service: any) => ({
        id: service.id,
        vertical: service.vertical,
        title: service.title,
        description: service.description,
        icon: service.icon || '',
      })),
    promotions: (Array.isArray(raw.promotions) ? raw.promotions : []).map((promotion: any) => ({
      code: promotion.code || promotion.promo_code || '',
      discountText: promotion.discountText || promotion.discount_text || '',
      validity: promotion.validity || promotion.validity_text || '',
    })),
    faqs: (Array.isArray(raw.faqs) ? raw.faqs : []).map((faq: any) => ({ question: faq.question, answer: faq.answer })),
  };
};

export const publicPortalApi = {
  getTenantCms: async (tenantSlug: string): Promise<TenantPublicCms> => {
    const response = await apiClient.get(`/public/${encodeURIComponent(tenantSlug)}/`);
    return normalizeCms(responseData(response));
  },

  trackShipmentPublic: async (awbNumber: string): Promise<PublicShipmentTracking | null> => {
    const response = await apiClient.get(`/public/tracking/${encodeURIComponent(awbNumber)}/`);
    const raw = responseData(response);
    if (!raw) return null;
    return {
      awbNumber: raw.awb_number,
      status: String(raw.status || '').toLowerCase(),
      serviceType: raw.service_type || '',
      senderCity: raw.sender_city || '',
      deliveryCity: raw.delivery_city || '',
      expectedDelivery: raw.expected_delivery || null,
      maskedReceiver: raw.masked_receiver || '',
      events: (Array.isArray(raw.events) ? raw.events : []).map((event: any) => ({
        status: String(event.status || '').toLowerCase(),
        timestamp: event.timestamp,
        location: event.location || '',
        description: event.description || '',
      })),
    };
  },

  submitPublicBooking: async (data: {
    tenantSlug: string;
    serviceType: string;
    senderName: string;
    senderPhone: string;
    senderAddress: string;
    senderCity: string;
    senderPostalCode: string;
    receiverName: string;
    receiverPhone: string;
    receiverAddress: string;
    receiverCity: string;
    receiverPostalCode: string;
    pickupTime?: string;
    estimatedWeightKg?: number;
    passengerCount?: number;
    cargoDescription?: string;
    temperatureRange?: string;
    couponCode?: string;
    notes?: string;
  }): Promise<PublicBookingResult> => {
    const response = await apiClient.post(`/public/${encodeURIComponent(data.tenantSlug)}/book/`, {
      service_type: data.serviceType,
      sender_name: data.senderName,
      sender_phone: data.senderPhone,
      sender_address: data.senderAddress,
      sender_city: data.senderCity,
      sender_postal_code: data.senderPostalCode,
      receiver_name: data.receiverName,
      receiver_phone: data.receiverPhone,
      delivery_address: data.receiverAddress,
      delivery_city: data.receiverCity,
      delivery_postal_code: data.receiverPostalCode,
      pickup_time: data.pickupTime ? new Date(data.pickupTime).toISOString() : null,
      estimated_weight_kg: data.estimatedWeightKg ?? 1,
      passenger_count: data.passengerCount ?? 1,
      cargo_description: data.cargoDescription || '',
      temperature_range: data.temperatureRange || '',
      coupon_code: data.couponCode || '',
      notes: data.notes || '',
    });
    const raw = responseData(response);
    return {
      success: Boolean(raw.success),
      bookingReference: raw.booking_reference,
      bookingType: raw.booking_type,
      awbNumber: raw.awb_number,
      status: String(raw.status || '').toLowerCase(),
      message: raw.message || 'Your request has been received.',
    };
  },
};
