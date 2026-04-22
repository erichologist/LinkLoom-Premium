export interface LinkPreview {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  loading: boolean;
  error?: boolean;
}

export interface AppSettings {
  format: 'html' | 'markdown';
  imageSize: 'sm' | 'md' | 'lg';
  showDescription: boolean;
}
