export interface WatermarkSettings {
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  width: number;
  height: number;
  paddingX: number;
  paddingY: number;
  opacity?: number;
  rotation?: number;
}

export interface FooterSettings {
  opacity: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation?: number;
}

export interface ShadowSettings {
  color: string;
  opacity: number;
  offsetX: number;
  offsetY: number;
  blur: number;
}

export type ShadowTarget = 'none' | 'footer' | 'whole-image';

export interface ImageData {
  file: File;
  url: string;
  useGlobalSettings: boolean;
  individualLogoSettings?: WatermarkSettings;
  individualFooterSettings?: FooterSettings;
  individualShadowSettings?: ShadowSettings;
  individualLogo?: string | null;
  individualFooter?: string | null;
  metadata?: {
    originalWidth: number;
    originalHeight: number;
    fileSize: number;
    processedAt?: Date;
  };
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  logo: string | null;
  footer: string | null;
  logoSettings: WatermarkSettings;
  footerSettings: FooterSettings;
  shadowSettings: ShadowSettings;
  shadowTarget: ShadowTarget;
  createdAt: Date;
  thumbnail?: string;
}

export interface ExportOptions {
  format: 'png' | 'jpg' | 'webp';
  quality: number;
  scale: number;
  includeMetadata: boolean;
  compression: 'none' | 'low' | 'medium' | 'high';
}
