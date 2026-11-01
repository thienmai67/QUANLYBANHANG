export interface ChatProductItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  basePrice: number;
  discountRate: number;
  finalPrice: number;
  priceStr: string;
  unit: string;
  image: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  products?: ChatProductItem[];
  quickReplies?: string[];
  mode?: 'ai' | 'basic';
}

export interface ChatApiResponse {
  reply: string;
  products: ChatProductItem[];
  quickReplies: string[];
  mode: 'ai' | 'basic';
}

export interface ProjectContext {
  area?: number;
  floors?: number;
  houseType?: string;
  updatedAt?: string;
}

export interface ChatRequestPayload {
  message: string;
  history?: { sender: string; text: string }[];
  context?: ProjectContext;
}
