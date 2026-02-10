import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalActions,
} from "./Modal";
import { Button } from "../Button";
import { Input, Textarea } from "../Input";

const meta = {
  title: "UI/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to handle modal state
function ModalWrapper({ children, ...props }: any) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal {...props} open={isOpen} onClose={() => setIsOpen(false)}>
        {children}
      </Modal>
    </>
  );
}

export const Default = {
  render: () => (
    <ModalWrapper title="Default Modal">
      <p className="text-gray-600">
        This is a default modal with a title. Click outside or press ESC to
        close.
      </p>
    </ModalWrapper>
  ),
  parameters: { docs: { disable: false } },
};

export const SmallSize = {
  render: () => (
    <ModalWrapper title="Small Modal" size="sm">
      <p className="text-sm text-gray-600">This is a small modal.</p>
    </ModalWrapper>
  ),
};

export const MediumSize = {
  render: () => (
    <ModalWrapper title="Medium Modal" size="md">
      <p className="text-gray-600">This is a medium modal (default size).</p>
    </ModalWrapper>
  ),
};

export const LargeSize = {
  render: () => (
    <ModalWrapper title="Large Modal" size="lg">
      <p className="text-gray-600">
        This is a large modal with more content space. You can fit longer text
        and more complex layouts here.
      </p>
    </ModalWrapper>
  ),
};

export const ExtraLargeSize = {
  render: () => (
    <ModalWrapper title="Extra Large Modal" size="xl">
      <div className="space-y-4">
        <p className="text-gray-600">
          This is an extra large modal suitable for complex forms or detailed
          content.
        </p>
        <p className="text-gray-600">
          It provides plenty of horizontal space while maintaining good
          readability.
        </p>
      </div>
    </ModalWrapper>
  ),
};

export const FullWidth = {
  render: () => (
    <ModalWrapper title="Full Width Modal" size="full">
      <div className="space-y-4">
        <p className="text-gray-600">
          This modal takes up nearly the full width of the screen, useful for
          wide tables or dashboards.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-100 p-4 rounded">Column 1</div>
          <div className="bg-gray-100 p-4 rounded">Column 2</div>
          <div className="bg-gray-100 p-4 rounded">Column 3</div>
        </div>
      </div>
    </ModalWrapper>
  ),
};

export const WithoutTitle = {
  render: () => (
    <ModalWrapper>
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Custom Header</h3>
        <p className="text-gray-600">
          This modal doesn't use the title prop and has custom content.
        </p>
      </div>
    </ModalWrapper>
  ),
};

export const WithComposedSections = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Composed Modal</Button>
        <Modal open={isOpen} onClose={() => setIsOpen(false)}>
          <ModalHeader>Composed Modal</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-gray-600">
                This modal uses ModalHeader, ModalBody, and ModalFooter
                components for better control over layout.
              </p>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input type="email" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <Textarea rows={3} placeholder="Your message..." />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Send Message
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  },
};

export const ConfirmationDialog = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Delete Item
        </Button>
        <Modal open={isOpen} onClose={() => setIsOpen(false)} size="sm">
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalBody>
            <p className="text-gray-600">
              Are you sure you want to delete this item? This action cannot be
              undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setIsOpen(false)}>
              Delete
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  },
};

export const FormModal = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Add Student</Button>
        <Modal
          open={isOpen}
          onClose={() => setIsOpen(false)}
          title="Add New Student"
        >
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name
              </label>
              <Input type="text" placeholder="Enter name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade Level
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option>Pre-K</option>
                <option>Kindergarten</option>
                <option>1st Grade</option>
                <option>2nd Grade</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-8 h-8 rounded-full bg-student-fuchsia-500 ring-2 ring-offset-2 ring-student-fuchsia-500 p-0"
                >
                  <span className="sr-only">Fuchsia</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-8 h-8 rounded-full bg-student-teal-500 p-0"
                >
                  <span className="sr-only">Teal</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-8 h-8 rounded-full bg-student-blue-500 p-0"
                >
                  <span className="sr-only">Blue</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-8 h-8 rounded-full bg-student-orange-500 p-0"
                >
                  <span className="sr-only">Orange</span>
                </Button>
              </div>
            </div>
            <ModalActions>
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsOpen(false)}>
                Add Student
              </Button>
            </ModalActions>
          </form>
        </Modal>
      </>
    );
  },
};

export const PreventCloseOnOverlayClick = {
  render: () => (
    <ModalWrapper title="Cannot Close on Overlay" closeOnOverlayClick={false}>
      <p className="text-gray-600">
        This modal cannot be closed by clicking the overlay. You must use a
        button or press ESC.
      </p>
      <ModalActions>
        <Button variant="primary">Close</Button>
      </ModalActions>
    </ModalWrapper>
  ),
};
