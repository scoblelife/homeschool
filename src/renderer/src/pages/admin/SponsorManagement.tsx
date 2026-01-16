/**
 * Sponsor Management Admin Page
 *
 * CRUD interface for managing sponsorship partners
 * Admin-only access for creating, editing, and deactivating sponsors
 */

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input, Textarea } from "../../components/ui/Input";
import { Checkbox } from "../../components/ui/Checkbox";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/layout/PageHeader";
import { PageContainer } from "../../components/layout/PageContainer";
import { IconBadge } from "../../components/dashboard/IconBadge";
import type {
  Sponsor,
  SponsorTier,
  CreateSponsor,
  UpdateSponsor,
} from "../../../../shared/types";

const TIER_OPTIONS: { value: SponsorTier; label: string; fee: number }[] = [
  { value: "basic", label: "Basic ($500/mo)", fee: 500 },
  { value: "premium", label: "Premium ($1,500/mo)", fee: 1500 },
  { value: "enterprise", label: "Enterprise ($2,500/mo)", fee: 2500 },
];

export default function SponsorManagement() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [formData, setFormData] = useState<Partial<CreateSponsor>>({
    name: "",
    tier: "basic",
    logoUrl: "",
    websiteUrl: "",
    description: "",
    monthlyFee: 500,
    contactName: "",
    contactEmail: "",
    githubUsername: "",
    isActive: true,
    contractSignedDate: "",
    billingStartDate: "",
    notes: "",
  });

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    setIsLoading(true);
    try {
      const data = await window.api.getSponsors();
      setSponsors(data);
    } catch (error) {
      console.error("Failed to load sponsors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contactEmail) return;

    try {
      if (editingSponsor) {
        await window.api.updateSponsor(
          editingSponsor.id,
          formData as UpdateSponsor,
        );
      } else {
        await window.api.createSponsor(formData as CreateSponsor);
      }
      await loadSponsors();
      closeModal();
    } catch (error) {
      console.error("Failed to save sponsor:", error);
      alert("Failed to save sponsor. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this sponsor? This will also delete all their sponsored resources.",
      )
    ) {
      return;
    }

    try {
      await window.api.deleteSponsor(id);
      await loadSponsors();
    } catch (error) {
      console.error("Failed to delete sponsor:", error);
      alert("Failed to delete sponsor. Please try again.");
    }
  };

  const openCreateModal = () => {
    setEditingSponsor(null);
    setFormData({
      name: "",
      tier: "basic",
      logoUrl: "",
      websiteUrl: "",
      description: "",
      monthlyFee: 500,
      contactName: "",
      contactEmail: "",
      githubUsername: "",
      isActive: true,
      contractSignedDate: "",
      billingStartDate: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setFormData({
      name: sponsor.name,
      tier: sponsor.tier,
      logoUrl: sponsor.logoUrl || "",
      websiteUrl: sponsor.websiteUrl || "",
      description: sponsor.description || "",
      monthlyFee: sponsor.monthlyFee,
      contactName: sponsor.contactName || "",
      contactEmail: sponsor.contactEmail,
      githubUsername: sponsor.githubUsername || "",
      isActive: sponsor.isActive,
      contractSignedDate: sponsor.contractSignedDate || "",
      billingStartDate: sponsor.billingStartDate || "",
      notes: sponsor.notes || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSponsor(null);
  };

  const handleTierChange = (tier: SponsorTier) => {
    const tierOption = TIER_OPTIONS.find((t) => t.value === tier);
    setFormData({
      ...formData,
      tier,
      monthlyFee: tierOption?.fee || 500,
    });
  };

  // Calculate MRR (Monthly Recurring Revenue)
  const activeMRR = sponsors
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + s.monthlyFee, 0);

  const activeSponsors = sponsors.filter((s) => s.isActive);
  const inactiveSponsors = sponsors.filter((s) => !s.isActive);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="text-center text-gray-500 py-8">
          Loading sponsors...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Sponsor Management"
        subtitle="Manage sponsorship partners and subscription tiers"
        action={
          <Button variant="primary" onClick={openCreateModal}>
            + Add Sponsor
          </Button>
        }
      />

      {/* MRR Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <IconBadge icon="💰" variant="success" size="lg" />
            <div>
              <div className="text-sm font-medium text-gray-500">
                Monthly Recurring Revenue
              </div>
              <div className="text-2xl font-bold text-status-success">
                ${activeMRR.toLocaleString()}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <IconBadge icon="🤝" variant="primary" size="lg" />
            <div>
              <div className="text-sm font-medium text-gray-500">
                Active Sponsors
              </div>
              <div className="text-2xl font-bold text-brand-primary">
                {activeSponsors.length}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <IconBadge icon="📊" variant="primary" size="lg" />
            <div>
              <div className="text-sm font-medium text-gray-500">
                Total Sponsors
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {sponsors.length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Sponsors */}
      {activeSponsors.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Sponsors
          </h2>
          <div className="space-y-4">
            {activeSponsors.map((sponsor) => (
              <SponsorCard
                key={sponsor.id}
                sponsor={sponsor}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Sponsors */}
      {inactiveSponsors.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-500 mb-4">
            Inactive Sponsors
          </h2>
          <div className="space-y-4 opacity-60">
            {inactiveSponsors.map((sponsor) => (
              <SponsorCard
                key={sponsor.id}
                sponsor={sponsor}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {sponsors.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4">🤝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Sponsors Yet
          </h3>
          <p className="text-gray-500 mb-4">
            Add your first sponsorship partner to start generating revenue.
          </p>
          <Button variant="primary" onClick={openCreateModal}>
            Add First Sponsor
          </Button>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingSponsor ? "Edit Sponsor" : "Add New Sponsor"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sponsor Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., IXL Learning"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tier *
              </label>
              <select
                value={formData.tier}
                onChange={(e) =>
                  handleTierChange(e.target.value as SponsorTier)
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                required
              >
                {TIER_OPTIONS.map((tier) => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Fee *
            </label>
            <Input
              type="number"
              value={formData.monthlyFee}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthlyFee: parseFloat(e.target.value),
                })
              }
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <Input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) =>
                  setFormData({ ...formData, websiteUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <Input
                type="url"
                value={formData.logoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, logoUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
              placeholder="Brief description of the sponsor..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <Input
                type="text"
                value={formData.contactName}
                onChange={(e) =>
                  setFormData({ ...formData, contactName: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email *
              </label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData({ ...formData, contactEmail: e.target.value })
                }
                placeholder="contact@sponsor.com"
                required
              />
            </div>
          </div>

          {formData.tier === "enterprise" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub Username (for PR access)
              </label>
              <Input
                type="text"
                value={formData.githubUsername}
                onChange={(e) =>
                  setFormData({ ...formData, githubUsername: e.target.value })
                }
                placeholder="github-username"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enterprise sponsors get PR write access to the private
                repository
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Signed Date
              </label>
              <Input
                type="date"
                value={formData.contractSignedDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contractSignedDate: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Start Date
              </label>
              <Input
                type="date"
                value={formData.billingStartDate}
                onChange={(e) =>
                  setFormData({ ...formData, billingStartDate: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Notes
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
              placeholder="Internal notes about this sponsor..."
            />
          </div>

          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            label="Active sponsor (currently paying)"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingSponsor ? "Save Changes" : "Create Sponsor"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

interface SponsorCardProps {
  sponsor: Sponsor;
  onEdit: (sponsor: Sponsor) => void;
  onDelete: (id: string) => void;
}

function SponsorCard({ sponsor, onEdit, onDelete }: SponsorCardProps) {
  const tierOption = TIER_OPTIONS.find((t) => t.value === sponsor.tier);

  return (
    <Card className={!sponsor.isActive ? "opacity-60" : ""}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {sponsor.name}
            </h3>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                sponsor.tier === "enterprise"
                  ? "bg-purple-100 text-purple-700"
                  : sponsor.tier === "premium"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              {tierOption?.label}
            </span>
            {!sponsor.isActive && (
              <Badge size="sm" variant="default">
                Inactive
              </Badge>
            )}
          </div>

          {sponsor.description && (
            <p className="text-sm text-gray-600 mb-2">{sponsor.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">Monthly Fee:</span> $
              {sponsor.monthlyFee.toLocaleString()}
            </div>
            {sponsor.contactEmail && (
              <div>
                <span className="font-medium">Contact:</span>{" "}
                {sponsor.contactEmail}
              </div>
            )}
            {sponsor.billingStartDate && (
              <div>
                <span className="font-medium">Billing Since:</span>{" "}
                {format(parseISO(sponsor.billingStartDate), "MMM d, yyyy")}
              </div>
            )}
            {sponsor.githubUsername && (
              <div>
                <span className="font-medium">GitHub:</span> @
                {sponsor.githubUsername}
              </div>
            )}
          </div>

          {sponsor.websiteUrl && (
            <div className="mt-2">
              <a
                href={sponsor.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-primary hover:text-brand-primaryDark"
              >
                Visit Website →
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button onClick={() => onEdit(sponsor)} variant="ghost" size="sm">
            Edit
          </Button>
          <Button
            onClick={() => onDelete(sponsor.id)}
            variant="ghost"
            size="sm"
            className="text-status-error hover:text-status-errorDark"
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
