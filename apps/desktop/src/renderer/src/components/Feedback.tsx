/**
 * In-app Feedback Component
 *
 * Allows users to submit feedback (bugs, feature requests, etc.)
 * without leaving the app.
 */

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

type FeedbackCategory = "bug" | "feature" | "question" | "other";

interface FeedbackFormData {
  category: FeedbackCategory;
  description: string;
  email?: string;
}

const CATEGORIES: { value: FeedbackCategory; label: string; emoji: string }[] =
  [
    { value: "bug", label: "Bug Report", emoji: "🐛" },
    { value: "feature", label: "Feature Request", emoji: "💡" },
    { value: "question", label: "Question", emoji: "❓" },
    { value: "other", label: "Other", emoji: "💬" },
  ];

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [formData, setFormData] = useState<FeedbackFormData>({
    category: "bug",
    description: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Create mailto link with feedback
      const subject = encodeURIComponent(
        `[Homeschool Feedback] ${CATEGORIES.find((c) => c.value === formData.category)?.label}`,
      );
      const body = encodeURIComponent(
        `Category: ${formData.category}\n\n${formData.description}\n\n${formData.email ? `Reply to: ${formData.email}` : ""}`,
      );

      // Open email client
      window.open(`mailto:support@scoble.life?subject=${subject}&body=${body}`);

      setSubmitStatus("success");
      setFormData({ category: "bug", description: "", email: "" });

      // Close after a delay
      setTimeout(() => {
        onClose();
        setSubmitStatus("idle");
      }, 2000);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setSubmitStatus("idle");
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md bg-white rounded-xl shadow-xl">
              <div className="p-6">
                <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
                  Send Feedback
                </Dialog.Title>

                {submitStatus === "success" ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">✓</div>
                    <p className="text-gray-600">Thanks for your feedback!</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {CATEGORIES.map((category) => (
                          <button
                            key={category.value}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                category: category.value,
                              })
                            }
                            className={`p-3 rounded-lg border text-left transition-colors ${
                              formData.category === category.value
                                ? "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <span className="mr-2">{category.emoji}</span>
                            {category.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Description
                      </label>
                      <textarea
                        id="description"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent resize-none"
                        placeholder="Tell us what's on your mind..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email (optional)
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        We'll only use this to follow up if needed
                      </p>
                    </div>

                    {submitStatus === "error" && (
                      <p className="text-sm text-red-600">
                        Something went wrong. Please try again.
                      </p>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 transition-colors disabled:opacity-50"
                        disabled={isSubmitting || !formData.description.trim()}
                      >
                        {isSubmitting ? "Sending..." : "Send Feedback"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

/**
 * Feedback button that opens the modal
 */
interface FeedbackButtonProps {
  className?: string;
}

export function FeedbackButton({ className = "" }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        Send Feedback
      </button>

      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
