/**
 * Type definitions for Window Manager
 */

import { ReactNode } from 'react';

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  icon: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  content: ReactNode;
}

export interface WindowProps {
  initialContent?: string;
  documentId?: string;
  [key: string]: any;
}

export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  component: React.ComponentType<any>;
  defaultSize: { width: number; height: number };
  defaultPosition?: { x: number; y: number };
}
