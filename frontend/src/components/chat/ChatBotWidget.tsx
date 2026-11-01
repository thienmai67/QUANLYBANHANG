"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  X,
  Minus,
  Trash2,
  Send,
  Sparkles,
  ShoppingCart,
  Bot,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import ChatMessageItem from './ChatMessageItem';
import { ChatMessage, ChatApiResponse, ProjectContext } from '@/types/chat';
import { useCartStore } from '@/store/useCartStore';

const INITIAL_QUICK_PROMPTS = [
  'Tư vấn vật tư điện nước nhà phố 3 tầng',
  'Bảng giá ống Bình Minh chiết khấu bao nhiêu?',
  'Dây Cadivi 2.5mm chịu tải được thiết bị nào?',
  'Tính danh mục vật tư ống uPVC cho công trình 100m²',
];

const STORAGE_KEY = 'tdt_chat_messages_v1';
const SESSION_REMINDER_KEY = 'tdt_cart_reminded_session';
export const PROJECT_CONTEXT_KEY = 'tdt_project_context_v1';

export function parseProjectContext(text: string): Partial<ProjectContext> | null {
  const lower = text.toLowerCase();
  let found = false;
  const res: Partial<ProjectContext> = {};

  // Diện tích: 100m2, 120 m², 80 mét vuông...
  const areaMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|m²|mét vuông|met vuong)/);
  if (areaMatch) {
    const val = parseFloat(areaMatch[1].replace(',', '.'));
    if (val > 0) {
      res.area = val;
      found = true;
    }
  }

  // Số tầng: 3 tầng, 2 lầu, 4 tang...
  const floorMatch = lower.match(/(\d+)\s*(?:tầng|tang|lầu|lau)/);
  if (floorMatch) {
    const val = parseInt(floorMatch[1], 10);
    if (val > 0) {
      res.floors = val;
      found = true;
    }
  }

  // Loại nhà: nhà phố, biệt thự, căn hộ, chung cư, nhà cấp 4
  if (/nhà phố|nha pho/.test(lower)) {
    res.houseType = 'Nhà phố';
    found = true;
  } else if (/biệt thự|biet thu/.test(lower)) {
    res.houseType = 'Biệt thự';
    found = true;
  } else if (/căn hộ|can ho|chung cư|chung cu/.test(lower)) {
    res.houseType = 'Căn hộ';
    found = true;
  } else if (/nhà cấp 4|nha cap 4/.test(lower)) {
    res.houseType = 'Nhà cấp 4';
    found = true;
  }

  return found ? res : null;
}

export default function ChatBotWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCartSummary, setShowCartSummary] = useState(false);
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cartItems = useCartStore((state) => state.items);
  const openCartDrawer = useCartStore((state) => state.setIsOpen);

  const totalCartItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartPrice = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  // Load project context from localStorage (Cải tiến 2)
  useEffect(() => {
    try {
      const savedContext = localStorage.getItem(PROJECT_CONTEXT_KEY);
      if (savedContext) {
        const parsed = JSON.parse(savedContext);
        if (parsed && typeof parsed === 'object') {
          setProjectContext(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Default initial greeting if no history (includes remembered project context if available)
    let greeting =
      'Xin chào! Tôi là Trợ lý M&E TDT Platform. Tôi có thể giúp bạn tra cứu bảng giá, chiết khấu vật tư thật từ kho và ước tính danh mục dây, ống, thiết bị đóng cắt.';

    try {
      const savedContext = localStorage.getItem(PROJECT_CONTEXT_KEY);
      if (savedContext) {
        const parsed: ProjectContext = JSON.parse(savedContext);
        if (parsed && (parsed.area || parsed.floors)) {
          greeting = `Xin chào! Tôi nhớ bạn đang tính toán cho công trình: ${parsed.area ? `${parsed.area}m²` : ''}${
            parsed.floors ? ` - ${parsed.floors} tầng` : ''
          }${parsed.houseType ? ` (${parsed.houseType})` : ''}. Bạn có muốn tiếp tục sử dụng thông số này để tính BOM không?`;
        }
      }
    } catch {
      // ignore
    }

    setMessages([
      {
        id: 'init-1',
        sender: 'bot',
        text: greeting,
        timestamp: new Date().toISOString(),
        quickReplies: INITIAL_QUICK_PROMPTS,
      },
    ]);
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch {
        // ignore
      }
    }
  }, [messages]);

  // Scroll to bottom when messages change or typing
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen, isMinimized, showCartSummary]);

  // Cải tiến 4: Nhắc giỏ dở đúng 1 lần mỗi phiên khi khách mở chat
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const alreadyReminded = sessionStorage.getItem(SESSION_REMINDER_KEY);
      if (!alreadyReminded) {
        if (totalCartItems > 0) {
          sessionStorage.setItem(SESSION_REMINDER_KEY, 'true');
          const reminderMsg: ChatMessage = {
            id: 'cart-reminder-' + Date.now(),
            sender: 'bot',
            text: `[Dữ liệu thật từ kho]\nGiỏ của bạn còn ${totalItemsCountLabel(totalCartItems)} chưa chốt, muốn xem lại không?`,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, reminderMsg]);
        }
      }
    }
  }, [isOpen, isMinimized, totalCartItems]);

  const totalItemsCountLabel = (count: number) => `${count} món`;

  const handleForgetProject = () => {
    try {
      localStorage.removeItem(PROJECT_CONTEXT_KEY);
    } catch {
      // ignore
    }
    setProjectContext(null);
    const forgetMsg: ChatMessage = {
      id: 'forget-' + Date.now(),
      sender: 'bot',
      text: '[Dữ liệu thật từ kho]\nĐã xóa sạch thông số công trình đã lưu. Quý khách có thể khai báo diện tích và số tầng mới bất cứ lúc nào.',
      timestamp: new Date().toISOString(),
      quickReplies: INITIAL_QUICK_PROMPTS,
    };
    setMessages((prev) => [...prev, forgetMsg]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputValue).trim();
    if (!text || isLoading) return;

    const lower = text.toLowerCase();

    // Check Cải tiến 2: Quên thông số công trình
    if (
      lower.includes('quên đi') ||
      lower.includes('quen di') ||
      lower.includes('xóa công trình') ||
      lower.includes('xoa cong trinh') ||
      lower.includes('xóa thông số') ||
      lower.includes('xoa thong so')
    ) {
      const userMessage: ChatMessage = {
        id: 'msg-user-' + Date.now(),
        sender: 'user',
        text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      handleForgetProject();
      return;
    }

    // Check Cải tiến 2: Khai báo hoặc cập nhật thông số công trình mới
    const detectedContext = parseProjectContext(text);
    let currentContext = projectContext;
    if (detectedContext) {
      currentContext = {
        ...projectContext,
        ...detectedContext,
        updatedAt: new Date().toISOString(),
      };
      setProjectContext(currentContext);
      try {
        localStorage.setItem(PROJECT_CONTEXT_KEY, JSON.stringify(currentContext));
      } catch {
        // ignore
      }
    }

    // Check Cải tiến 1: Lệnh hỏi hoặc chốt đơn trong chat
    if (
      lower.includes('chốt đơn') ||
      lower.includes('chot don') ||
      lower.includes('tóm tắt giỏ') ||
      lower.includes('tom tat gio') ||
      lower.includes('xem giỏ') ||
      lower.includes('xem gio')
    ) {
      setShowCartSummary(true);
      const userMessage: ChatMessage = {
        id: 'msg-user-' + Date.now(),
        sender: 'user',
        text,
        timestamp: new Date().toISOString(),
      };
      const botCartReply: ChatMessage = {
        id: 'msg-bot-cart-' + Date.now(),
        sender: 'bot',
        text:
          cartItems.length > 0
            ? `[Dữ liệu thật từ kho]\nGiỏ hàng của bạn đang có ${totalCartItems} món với tổng tiền là ${totalCartPrice.toLocaleString(
                'vi-VN'
              )} ₫. Bạn có thể xem tóm tắt giỏ phía trên và bấm "Chốt đơn" để tiến hành thanh toán.`
            : `[Dữ liệu thật từ kho]\nGiỏ hàng của bạn hiện đang trống. Hãy chọn sản phẩm từ các gợi ý hoặc tra cứu kho để thêm vào giỏ trước khi chốt đơn.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage, botCartReply]);
      setInputValue('');
      return;
    }

    const userMessage: ChatMessage = {
      id: 'msg-user-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-8).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          context: currentContext || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: ChatApiResponse = await res.json();

      const botMessage: ChatMessage = {
        id: 'msg-bot-' + Date.now(),
        sender: 'bot',
        text: data.reply,
        timestamp: new Date().toISOString(),
        products: data.products || [],
        quickReplies: data.quickReplies || INITIAL_QUICK_PROMPTS,
        mode: data.mode,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch {
      const errorMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        sender: 'bot',
        text: '[Chế độ tra cứu cơ bản (chưa có AI)]\nKhông thể kết nối đến máy chủ chatbot vào lúc này. Quý khách vui lòng thử lại sau giây lát hoặc tra cứu trực tiếp tại trang sản phẩm.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([
      {
        id: 'init-cleared-' + Date.now(),
        sender: 'bot',
        text: 'Lịch sử trò chuyện đã được xóa. Tôi có thể hỗ trợ gì cho bạn hôm nay?',
        timestamp: new Date().toISOString(),
        quickReplies: INITIAL_QUICK_PROMPTS,
      },
    ]);
  };

  // Check route visibility
  if (!pathname) return null;
  const isExcluded =
    pathname.startsWith('/manager') ||
    pathname.startsWith('/shipper') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/403';

  if (isExcluded) {
    return null;
  }

  const isCustomerPage =
    pathname === '/' ||
    pathname.startsWith('/shop') ||
    pathname.startsWith('/product') ||
    pathname.startsWith('/cong-trinh') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/account');

  if (!isCustomerPage) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Mở Trợ lý M&E Chatbot"
        >
          <div className="relative">
            <Bot className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="font-semibold text-sm tracking-wide pr-1 hidden sm:inline">
            TDT M&amp;E Copilot
          </span>
          {totalCartItems > 0 && (
            <span className="bg-amber-400 text-slate-900 font-bold text-xs px-2 py-0.5 rounded-full shadow-sm">
              {totalCartItems} món
            </span>
          )}
        </button>
      )}

      {/* Chat Drawer / Window */}
      {isOpen && (
        <div
          className={`flex flex-col bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl transition-all duration-300 w-[95vw] sm:w-[440px] ${
            isMinimized ? 'h-16' : 'h-[620px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                  TDT M&amp;E Copilot
                  <span className="text-[10px] font-normal px-1.5 py-0.2 bg-white/20 rounded text-white/90">
                    Live DB
                  </span>
                </h3>
                <p className="text-[11px] text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Tư vấn vật tư &amp; giá chiết khấu
                </p>
              </div>
            </div>

            {/* Header controls */}
            <div className="flex items-center gap-1">
              {/* Nút bật/tắt Tóm tắt giỏ hàng (Cải tiến 1) */}
              <button
                onClick={() => setShowCartSummary(!showCartSummary)}
                title="Tóm tắt giỏ hàng & Chốt đơn"
                className={`relative p-1.5 rounded-lg transition-colors ${
                  showCartSummary
                    ? 'bg-white/25 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow">
                    {totalCartItems}
                  </span>
                )}
              </button>

              <button
                onClick={handleClearHistory}
                title="Xóa lịch sử chat"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng chat"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body (only if not minimized) */}
          {!isMinimized && (
            <>
              {/* Banner Ngữ cảnh công trình đã lưu (Cải tiến 2) */}
              {projectContext && (projectContext.area || projectContext.floors) && (
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 text-[11px] text-blue-900 dark:text-blue-200">
                  <div className="flex items-center gap-1.5 truncate font-medium">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="truncate">
                      Công trình đã lưu:{' '}
                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                        {projectContext.area ? `${projectContext.area}m²` : ''}
                        {projectContext.floors ? ` - ${projectContext.floors} tầng` : ''}
                        {projectContext.houseType ? ` (${projectContext.houseType})` : ''}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() =>
                        handleSendMessage(
                          `Tính danh mục vật tư ống uPVC cho công trình ${projectContext.area || 100}m² ${
                            projectContext.floors || 1
                          } tầng`
                        )
                      }
                      className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-[10px] transition-colors"
                      title="Tính lại BOM theo thông số công trình này"
                    >
                      Tính lại BOM
                    </button>
                    <button
                      onClick={handleForgetProject}
                      title="Quên sạch thông số này"
                      className="px-1.5 py-0.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 text-[10px] transition-colors"
                    >
                      Quên đi
                    </button>
                  </div>
                </div>
              )}

              {/* Khối Tóm tắt giỏ hàng & Chốt đơn trong chat (Cải tiến 1) */}
              {showCartSummary && (
                <div className="p-3 bg-amber-50/90 dark:bg-slate-900/90 border-b border-amber-200/80 dark:border-slate-800 text-xs shadow-inner">
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100 mb-2">
                    <span className="flex items-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
                      Tóm tắt giỏ ({totalCartItems} món)
                    </span>
                    <span className="text-amber-700 dark:text-amber-400 font-mono text-sm">
                      {totalCartPrice.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>

                  {cartItems.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] py-1">
                      Giỏ hàng của bạn đang trống.
                    </p>
                  ) : (
                    <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 mb-2">
                      {cartItems.map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-800/80 p-1.5 rounded border border-slate-200/60 dark:border-slate-700/60"
                        >
                          <div className="truncate pr-2">
                            <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                              {it.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              SKU: {it.sku} &times; {it.quantity}
                            </div>
                          </div>
                          <div className="text-right font-mono font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                            {(it.unitPrice * it.quantity).toLocaleString('vi-VN')} ₫
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Nút Chốt đơn: mở CartDrawer sẵn có, nếu giỏ trống thì disabled */}
                  <button
                    disabled={cartItems.length === 0}
                    onClick={() => {
                      openCartDrawer(true);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {cartItems.length === 0 ? 'Giỏ hàng đang trống' : 'Chốt đơn (Mở giỏ hàng)'}
                  </button>
                </div>
              )}

              {/* Messages scroll area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50 dark:bg-[#070b14]/50">
                {messages.map((msg) => (
                  <ChatMessageItem key={msg.id} message={msg} />
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-1">
                    <div className="flex space-x-1.5 items-center bg-white dark:bg-[#0f172a] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <Bot className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Đang tra cứu catalog &amp; phân tích...
                      </span>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Bar (Section 6) */}
              <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0c1322]">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Gợi ý câu hỏi nhanh:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {INITIAL_QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      disabled={isLoading}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800/80 dark:hover:bg-blue-950/60 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer Input */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] rounded-b-2xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Hỏi giá dây Cadivi, ống Bình Minh, khai diện tích nhà..."
                    disabled={isLoading}
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95 flex-shrink-0"
                    title="Gửi câu hỏi"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
