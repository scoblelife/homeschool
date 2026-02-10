/**
 * Responsive Layouts
 *
 * Components for tablet optimization and responsive design.
 */

export { ResponsiveContainer } from "./ResponsiveContainer";
export { ResponsiveGrid, TwoColumnLayout } from "./ResponsiveGrid";
export { MasterDetailLayout, useMasterDetail } from "./MasterDetailLayout";
export { TabletSidebar } from "./TabletSidebar";

// Re-export device type hook for convenience
export { useDeviceType, getDeviceInfo } from "../hooks/useDeviceType";
export type {
  DeviceType,
  Orientation,
  DeviceInfo,
} from "../hooks/useDeviceType";
