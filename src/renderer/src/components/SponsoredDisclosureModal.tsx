/**
 * Sponsored Content Disclosure Modal
 *
 * First-time disclosure shown when user encounters sponsored content
 * Explains what it is and how privacy is protected
 */

import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

interface SponsoredDisclosureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SponsoredDisclosureModal({
  isOpen,
  onClose,
}: SponsoredDisclosureModalProps) {
  const handleAccept = () => {
    // Mark as seen in localStorage
    localStorage.setItem("hasSeenSponsoredDisclosure", "true");
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="About Our Educational Partners"
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-student-blue-50 border border-student-blue-200 rounded-lg">
          <div className="text-2xl">🤝</div>
          <div className="flex-1">
            <p className="text-sm text-student-blue-700">
              We partner with trusted educational companies to help fund ongoing
              development of this app. When you see "Sponsored" labels, it means
              that company is supporting our work.
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-xl">🔒</span>
            Your Privacy is Protected
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-status-success font-bold">✓</span>
              <span>
                We only track anonymous clicks (no student names, no personal
                information)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-status-success font-bold">✓</span>
              <span>Sponsors never receive your data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-status-success font-bold">✓</span>
              <span>All tracking is local to your device</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-status-success font-bold">✓</span>
              <span>No cookies, no pixels, no third-party analytics</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Our Standards</h4>
          <p className="text-sm text-gray-600">
            We only partner with trusted educational companies that provide
            genuine value to homeschooling families. All sponsored content is
            clearly labeled and relevant to your needs.
          </p>
        </div>

        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
          You can hide sponsored content anytime in Settings → Privacy &
          Sponsored Content.
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="primary" onClick={handleAccept}>
            Got it
          </Button>
        </div>
      </div>
    </Modal>
  );
}
