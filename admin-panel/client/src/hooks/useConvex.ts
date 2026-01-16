/**
 * Custom hooks for Convex queries and mutations
 */
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

// Type definitions matching Convex schema
export interface Sponsor {
  _id: Id<"sponsors">;
  name: string;
  tier: 'basic' | 'premium' | 'enterprise';
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
  monthlyFee: number;
  contactName?: string;
  contactEmail: string;
  githubUsername?: string;
  isActive: boolean;
  contractSignedDate?: string;
  billingStartDate?: string;
  notes?: string;
  _creationTime: number;
}

export interface SponsoredResource {
  _id: Id<"sponsoredResources">;
  sponsorId: Id<"sponsors">;
  tier: 'basic' | 'premium' | 'enterprise';
  name: string;
  description: string;
  icon?: string;
  url: string;
  subjects: string[];
  gradeLevels: string[];
  category?: string;
  pricingInfo?: string;
  displayPriority: number;
  isActive: boolean;
  contractStartDate: string;
  contractEndDate: string;
  _creationTime: number;
}

export interface SponsorAnalytics {
  sponsorId: Id<"sponsors">;
  sponsorName: string;
  tier: string;
  monthlyFee: number;
  totalClicks: number;
  clicksByLocation: Record<string, number>;
  clicksByResource: Array<{
    resourceId: Id<"sponsoredResources">;
    resourceName: string;
    clicks: number;
  }>;
}

// Sponsor hooks
export function useSponsors(activeOnly?: boolean) {
  return useQuery(api.sponsors.list, activeOnly !== undefined ? { activeOnly } : {});
}

export function useSponsor(id?: Id<"sponsors">) {
  return useQuery(api.sponsors.get, id ? { id } : 'skip');
}

export function useCreateSponsor() {
  return useMutation(api.sponsors.create);
}

export function useUpdateSponsor() {
  return useMutation(api.sponsors.update);
}

export function useDeleteSponsor() {
  return useMutation(api.sponsors.remove);
}

// Resource hooks
export function useResources(activeOnly?: boolean, sponsorId?: Id<"sponsors">) {
  const args: any = {};
  if (activeOnly !== undefined) args.activeOnly = activeOnly;
  if (sponsorId !== undefined) args.sponsorId = sponsorId;
  return useQuery(api.resources.list, args);
}

export function useResource(id?: Id<"sponsoredResources">) {
  return useQuery(api.resources.get, id ? { id } : 'skip');
}

export function useCreateResource() {
  return useMutation(api.resources.create);
}

export function useUpdateResource() {
  return useMutation(api.resources.update);
}

export function useDeleteResource() {
  return useMutation(api.resources.remove);
}

// Analytics hooks
export function useAnalyticsSummary(startDate?: number, endDate?: number) {
  const args: any = {};
  if (startDate !== undefined) args.startDate = startDate;
  if (endDate !== undefined) args.endDate = endDate;
  return useQuery(api.analytics.getSummary, args);
}

export function useAnalytics(startDate?: number, endDate?: number) {
  const args: any = {};
  if (startDate !== undefined) args.startDate = startDate;
  if (endDate !== undefined) args.endDate = endDate;
  return useQuery(api.analytics.getAnalytics, args);
}

// Click tracking hook
export function useTrackClick() {
  return useMutation(api.clicks.track);
}
