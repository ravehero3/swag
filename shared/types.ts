export interface User {
  id: number;
  email: string;
  password: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface Beat {
  id: number;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  price: number;
  previewUrl: string;
  fileUrl: string;
  artworkUrl: string;
  isPublished: boolean;
  createdAt: Date;
}

export interface SoundKit {
  id: number;
  title: string;
  description: string;
  type: 'drum_kit' | 'one_shot_kit' | 'loop_kit' | 'one_shot_bundle' | 'drum_kit_bundle';
  price: number;
  isFree: boolean;
  numberOfSounds: number;
  tags: string[];
  previewUrl: string;
  fileUrl: string;
  artworkUrl: string;
  legalInfo: string;
  authorInfo: string;
  isPublished: boolean;
  createdAt: Date;
}

export interface Order {
  id: number;
  userId: number;
  email: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'paid' | 'delivered';
  createdAt: Date;
}

export interface OrderItem {
  productId: number;
  productType: 'beat' | 'sound_kit';
  title: string;
  price: number;
}

export interface CartItem {
  productId: number;
  productType: 'beat' | 'sound_kit';
  title: string;
  price: number;
  artworkUrl: string;
}
