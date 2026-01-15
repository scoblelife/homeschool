/**
 * UI Component Library
 *
 * Consistent design system for the homeschool app.
 * Import components from this index for a unified API.
 */

// Button
export {
  Button,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from "./Button";

// Card
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardProps,
  type CardPadding,
} from "./Card";

// Badge
export {
  Badge,
  StudentBadge,
  type BadgeProps,
  type BadgeVariant,
  type BadgeSize,
  type StudentBadgeProps,
  type StudentColor,
} from "./Badge";

// Input
export {
  Input,
  Textarea,
  Label,
  FormField,
  type InputProps,
  type TextareaProps,
  type LabelProps,
  type FormFieldProps,
  type InputSize,
} from "./Input";

// Empty State
export {
  EmptyState,
  NoStudentsEmpty,
  NoActivitiesEmpty,
  NoResultsEmpty,
  type EmptyStateProps,
} from "./EmptyState";

// Progress
export {
  ProgressBar,
  CircularProgress,
  type ProgressBarProps,
  type CircularProgressProps,
  type ProgressVariant,
  type ProgressSize,
} from "./ProgressBar";

// Modal
export {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalActions,
  type ModalProps,
  type ModalSize,
} from "./Modal";

// Alert
export {
  Alert,
  type AlertProps,
  type AlertVariant,
  type AlertStyle,
} from "./Alert";
