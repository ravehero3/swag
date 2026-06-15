export interface Beat {
  id: number;
  title: string;
  artist?: string;
  bpm: number;
  key: string;
  price: number;
  preview_url: string;
  artwork_url: string;
  tags?: string[];
  is_highlighted?: boolean;
  waveform_data?: number[] | null;
  play_count?: number;
  product_type?: "beat" | "sound_kit";
  order_index?: number;
}

export interface LicenseOption {
  id: string;
  name: string;
  format: string;
  price: number | "NEGOTIATE";
}
