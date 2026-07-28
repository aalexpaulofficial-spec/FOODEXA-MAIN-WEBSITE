import type { HeroStat, PartnerUniversity, PricingPlan, FaqItem, PlatformFeature, Banner } from '../types';
import {
  fetchHeroStats,
  fetchPartnerUniversities,
  fetchPricingPlans,
  fetchFaqItems,
  fetchPlatformFeatures,
  fetchBanners,
  fetchLiveStats,
  fetchAnnouncements,
  fetchMenuItems,
  fetchMenuCategories,
  fetchCampusFeatures,
  fetchImpactStats,
} from '../lib/supabase-service';

export async function getHeroStats(): Promise<HeroStat[]> {
  try {
    const stats = await fetchHeroStats();
    if (stats.length > 0) return stats;
    const liveStats = await fetchLiveStats();
    return liveStats.map((s, i) => ({ id: `live-${i}`, value: s.value, label: s.label, is_active: true, order: i }));
  } catch { return []; }
}

export async function getPartnerUniversities(): Promise<PartnerUniversity[]> {
  try {
    const unis = await fetchPartnerUniversities();
    if (unis.length > 0) return unis;
    return [{ id: 'fallback', name: 'CHRIST (Deemed to be University)', campus: 'Kengeri Campus', location: 'Bengaluru', short_name: 'CHRIST', logo_url: null, is_active: true, order: 0 }];
  } catch { return []; }
}

export async function getPricingPlans(): Promise<PricingPlan[]> {
  try {
    const plans = await fetchPricingPlans();
    if (plans.length > 0) return plans;
    return [];
  } catch { return []; }
}

export async function getFaqItems(): Promise<FaqItem[]> {
  try {
    const items = await fetchFaqItems();
    if (items.length > 0) return items;
    return [];
  } catch { return []; }
}

export async function getPlatformFeatures(): Promise<PlatformFeature[]> {
  try {
    const features = await fetchPlatformFeatures();
    if (features.length > 0) return features;
    return [];
  } catch { return []; }
}

export async function getBanners(): Promise<Banner[]> {
  try {
    const banners = await fetchBanners();
    if (banners.length > 0) return banners;
    return [];
  } catch { return []; }
}

export async function getAnnouncements() {
  return fetchAnnouncements();
}

export async function getMenuItems(params?: { institution_id?: string }) {
  return fetchMenuItems(params);
}

export async function getMenuCategories(params?: { institution_id?: string }) {
  return fetchMenuCategories(params);
}

export async function getCampusFeatures() {
  return fetchCampusFeatures();
}

export async function getImpactStats() {
  return fetchImpactStats();
}

export { fetchLiveStats };