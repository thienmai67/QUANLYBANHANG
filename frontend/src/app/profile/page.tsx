'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { getAccessToken, getCurrentUser, clearTokens } from '@/lib/auth';
import { api } from '@/lib/api';
import './profile.css';

// SVGs and Icons
const IC = {
  bolt: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 5h16v11H4z" />
      <path d="M4 10h16M9 5v5" />
    </svg>
  ),
  cable: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  ),
  breaker: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M12 7v6M10 13l2 2 2-2" />
    </svg>
  ),
  plug: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 7V3M15 7V3M7 7h10v5a5 5 0 0 1-10 0V7zM12 17v4" />
    </svg>
  ),
  pipe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 17h9a4 4 0 0 0 4-4V4" />
      <path d="M4 17v3M4 20h3M13 4h3M16 4v3" />
    </svg>
  ),
  fitting: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 18V9a3 3 0 0 1 3-3h9" />
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
    </svg>
  ),
  glue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 3h4v4l3 4v9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-9l3-4V3z" />
      <path d="M7 14h10" />
    </svg>
  ),
  meter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="13" r="7" />
      <path d="M12 13l3.5-3.5M9 3h6" />
    </svg>
  ),
  chev: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2-5.6-3.2-5.6 3.2 1.3-6.2L3 9.5l6.3-.7z" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="4" y="10" width="16" height="10" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  card: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10.5h18M7 15.5h4" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  ),
  eyeOff: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  grip: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 4v6h6M20 20v-6h-6" />
      <path d="M20 9A8 8 0 0 0 5.6 5.6L4 7M4 15a8 8 0 0 0 14.4 3.4L20 17" />
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

interface AddressItem {
  tag: string;
  txt: string;
  name: string;
  phone: string;
  def: boolean;
}

interface OrderDisplayItem {
  icon: keyof typeof IC;
  name: string;
  spec: string;
  price: string;
  productId?: string;
  quantity?: number;
  unitPrice?: number;
}

interface OrderDisplay {
  code: string;
  date: string;
  st: 'shipping' | 'done' | 'packing' | 'pending';
  stText: string;
  active: number; // 0..3 step index
  dates: string[];
  total: string;
  items: OrderDisplayItem[];
  // Extended fields for popup modal
  estimatedDelivery?: string;
  deliveryTimeSlot?: string;
  deliveryNote?: string;
  recipientName?: string;
  recipientPhone?: string;
  shippingAddress?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  subtotal?: string;
  shippingFee?: string;
  discount?: string;
}

const DEFAULT_ADDRESSES: AddressItem[] = [
  {
    tag: 'Nhà riêng',
    txt: '128/45 Nguyễn Xí, P.26, Q.Bình Thạnh, TP.HCM',
    name: 'Nguyễn Văn Sáu',
    phone: '0903 456 789',
    def: true,
  },
  {
    tag: 'Công trình nhà anh Tư',
    txt: '45/12 Lê Văn Lương, P.Tân Hưng, Q.7, TP.HCM',
    name: 'Sáu Đen',
    phone: '0903 456 789',
    def: false,
  },
  {
    tag: 'Kho vật tư',
    txt: '210 Quốc lộ 13, P.Hiệp Bình Phước, TP.Thủ Đức, TP.HCM',
    name: 'Nguyễn Văn Sáu',
    phone: '0903 456 789',
    def: false,
  },
];

const DEFAULT_ORDERS: OrderDisplay[] = [
  {
    code: 'TDT-2026-0101',
    date: '12/10/2026',
    st: 'shipping',
    stText: 'Đang giao',
    active: 2,
    dates: ['12/10', '12/10', 'dự kiến 14/10', ''],
    total: '2.450.000đ',
    estimatedDelivery: 'Thứ Tư, 14/10/2026',
    deliveryTimeSlot: '08:30 - 11:30 (Sáng mai)',
    deliveryNote: 'Tài xế sẽ gọi trước 15-30 phút khi đến công trình. Vui lòng chuẩn bị người nhận bàn giao cuộn dây.',
    recipientName: 'Nguyễn Văn Sáu',
    recipientPhone: '0903 456 789',
    shippingAddress: '128/45 Nguyễn Xí, P.26, Q.Bình Thạnh, TP.HCM',
    paymentMethod: 'Chuyển khoản VietQR (MB Bank)',
    paymentStatus: 'Đã thanh toán',
    subtotal: '2.450.000đ',
    shippingFee: 'Miễn phí',
    discount: '0đ',
    items: [
      {
        icon: 'cable',
        name: 'Dây cáp điện đơn Cadivi CV 2.5mm²',
        spec: 'Cuộn 100m · 450/750V · ×2',
        price: '1.150.000đ',
        productId: 'cadivi-cv-25',
        quantity: 2,
        unitPrice: 575000,
      },
      {
        icon: 'breaker',
        name: 'Aptomat Schneider Easy9 1P 16A',
        spec: 'EZ9F34116 · 4.5kA · ×5',
        price: '925.000đ',
        productId: 'schneider-ez9-16a',
        quantity: 5,
        unitPrice: 185000,
      },
      {
        icon: 'plug',
        name: 'Ổ cắm đôi Panasonic Wide Series',
        spec: 'WEV15829 · 16A · ×10',
        price: '375.000đ',
        productId: 'panasonic-wev15829',
        quantity: 10,
        unitPrice: 37500,
      },
    ],
  },
  {
    code: 'TDT-2026-0098',
    date: '05/10/2026',
    st: 'done',
    stText: 'Đã giao',
    active: 3,
    dates: ['05/10', '05/10', '06/10', '07/10'],
    total: '1.180.000đ',
    estimatedDelivery: 'Thứ Tư, 07/10/2026',
    deliveryTimeSlot: 'Đã hoàn tất lúc 14:15, 07/10/2026',
    deliveryNote: 'Hàng đã giao thành công và có chữ ký xác nhận của đại diện công trình.',
    recipientName: 'Sáu Đen',
    recipientPhone: '0903 456 789',
    shippingAddress: '45/12 Lê Văn Lương, P.Tân Hưng, Q.7, TP.HCM',
    paymentMethod: 'Tiền mặt khi nhận hàng (COD)',
    paymentStatus: 'Đã thanh toán cho tài xế',
    subtotal: '1.180.000đ',
    shippingFee: 'Miễn phí',
    discount: '0đ',
    items: [
      {
        icon: 'pipe',
        name: 'Ống PVC Bình Minh phi 27',
        spec: 'Cây 4m · PN10 · ×20',
        price: '840.000đ',
        productId: 'binhminh-pvc-27',
        quantity: 20,
        unitPrice: 42000,
      },
      {
        icon: 'fitting',
        name: 'Co 90° PVC Bình Minh phi 27',
        spec: 'Phụ kiện nối · ×30',
        price: '240.000đ',
        productId: 'binhminh-co90-27',
        quantity: 30,
        unitPrice: 8000,
      },
      {
        icon: 'glue',
        name: 'Keo dán ống PVC Bình Minh',
        spec: 'Hộp 400g · ×4',
        price: '100.000đ',
        productId: 'binhminh-glue-400g',
        quantity: 4,
        unitPrice: 25000,
      },
    ],
  },
  {
    code: 'TDT-2026-0095',
    date: '28/09/2026',
    st: 'packing',
    stText: 'Đang đóng gói',
    active: 1,
    dates: ['28/09', 'dự kiến 30/09', '', ''],
    total: '980.000đ',
    estimatedDelivery: 'Thứ Tư, 30/09/2026',
    deliveryTimeSlot: '13:30 - 17:00 (Buổi chiều)',
    deliveryNote: 'Kho đang kiểm tra phụ kiện đồng thau và niêm phong hộp trước khi bàn giao xe trung chuyển.',
    recipientName: 'Nguyễn Văn Sáu',
    recipientPhone: '0903 456 789',
    shippingAddress: '210 Quốc lộ 13, P.Hiệp Bình Phước, TP.Thủ Đức, TP.HCM',
    paymentMethod: 'Chuyển khoản VietQR',
    paymentStatus: 'Đã thanh toán',
    subtotal: '980.000đ',
    shippingFee: 'Miễn phí',
    discount: '0đ',
    items: [
      {
        icon: 'meter',
        name: 'Đồng hồ nước Zenner DN20',
        spec: 'Ren 3/4" · cấp B · ×2',
        price: '900.000đ',
        productId: 'zenner-dn20',
        quantity: 2,
        unitPrice: 450000,
      },
      {
        icon: 'fitting',
        name: 'Rắc-co đồng thau 3/4"',
        spec: 'Ren trong · PN16 · ×4',
        price: '80.000đ',
        productId: 'rac-co-34',
        quantity: 4,
        unitPrice: 20000,
      },
    ],
  },
];

const STEPS = ['Đặt hàng', 'Đóng gói', 'Đang giao', 'Đã giao'];
const FILTERS = [
  ['all', 'Tất cả'],
  ['shipping', 'Đang giao'],
  ['packing', 'Đang đóng gói'],
  ['done', 'Đã giao'],
] as const;

export default function CustomerProfilePage() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, isAuthenticated, setAuth } = useAuthStore();
  const addItemToCart = useCartStore((state) => state.addItem);

  // Profile Basic State
  const [greeting, setGreeting] = useState('Chào bạn');
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'address' | 'account'>('overview');
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Form states
  const [fullNameInput, setFullNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordShake, setPasswordShake] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Address Ledger State
  const [addresses, setAddresses] = useState<AddressItem[]>(DEFAULT_ADDRESSES);
  const [addrFormOpen, setAddrFormOpen] = useState(false);
  const [editingAddrIdx, setEditingAddrIdx] = useState<number>(-1);
  const [addrTag, setAddrTag] = useState('');
  const [addrTxt, setAddrTxt] = useState('');
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrShake, setAddrShake] = useState(false);
  const [enteringIdx, setEnteringIdx] = useState<number | null>(null);
  const [lastDeletedAddr, setLastDeletedAddr] = useState<{ item: AddressItem; index: number } | null>(null);

  // Orders State & Search State
  const [curOrderFilter, setCurOrderFilter] = useState<'all' | 'shipping' | 'packing' | 'done'>('all');
  const [orders, setOrders] = useState<OrderDisplay[]>(DEFAULT_ORDERS);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderSearchOpen, setOrderSearchOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Draggable Order Detail Modal State
  const [detailModalOrder, setDetailModalOrder] = useState<OrderDisplay | null>(null);
  const [modalOffset, setModalOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const currentOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ startX: number; startY: number; initOffsetX: number; initOffsetY: number }>({
    startX: 0,
    startY: 0,
    initOffsetX: 0,
    initOffsetY: 0,
  });
  const modalDialogRef = useRef<HTMLDivElement>(null);

  const openOrderDetailModal = useCallback((ord: OrderDisplay) => {
    currentOffsetRef.current = { x: 0, y: 0 };
    setModalOffset({ x: 0, y: 0 });
    setDetailModalOrder(ord);
  }, []);

  const closeOrderDetailModal = useCallback(() => {
    setDetailModalOrder(null);
  }, []);

  const startDrag = useCallback((clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initOffsetX: currentOffsetRef.current.x,
      initOffsetY: currentOffsetRef.current.y,
    };
    document.body.style.userSelect = 'none';
  }, []);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    startDrag(e.clientX, e.clientY);
  };

  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    startDrag(e.clientX, e.clientY);
  };

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState('');
  const [toastShow, setToastShow] = useState(false);
  const [toastAction, setToastAction] = useState<{ label: string; onClick: () => void } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for indicators & cards
  const tabsInnerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const idCardRef = useRef<HTMLDivElement>(null);
  const mcardRef = useRef<HTMLDivElement>(null);
  const addrFormRef = useRef<HTMLDivElement>(null);

  // Trigger Toast helper
  const showToast = useCallback((msg: string, action?: { label: string; onClick: () => void }) => {
    setToastMsg(msg);
    setToastAction(action || null);
    setToastShow(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(
      () => {
        setToastShow(false);
      },
      action ? 5200 : 2800
    );
  }, []);

  // Sync initial user info
  useEffect(() => {
    setMounted(true);

    // Initial greeting
    const h = new Date().getHours();
    const w = h < 11 ? 'buổi sáng' : h < 13 ? 'buổi trưa' : h < 18 ? 'buổi chiều' : 'buổi tối';
    const displayName = user?.name ? user.name.split(' ').slice(-1)[0] : 'bạn';
    setGreeting(`Chào ${w}, ${displayName}`);

    // Populate inputs
    if (user) {
      setFullNameInput(user.name || 'Nguyễn Văn Sáu');
      setEmailInput(user.email || 'sau.den@gmail.com');
      // If phone stored in user or mock
      setPhoneInput('0903 456 789');
    } else {
      setFullNameInput('Nguyễn Văn Sáu');
      setEmailInput('sau.den@gmail.com');
      setPhoneInput('0903 456 789');
    }

    // Load addresses from LocalStorage
    try {
      const stored = localStorage.getItem('tdt_customer_addresses_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAddresses(parsed);
        }
      }
    } catch {
      // ignore
    }

    // Scroll listener for topbar
    const onScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [user]);

  // Fetch real orders from API if token exists, fallback to default
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    api
      .get<any[]>('/orders')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: OrderDisplay[] = data.map((ord: any) => {
            const rawStatus = (ord.status || 'PENDING').toUpperCase();
            let st: OrderDisplay['st'] = 'pending';
            let stText = 'Chờ xử lý';
            let active = 0;

            if (rawStatus === 'DELIVERED') {
              st = 'done';
              stText = 'Đã giao';
              active = 3;
            } else if (rawStatus === 'SHIPPING') {
              st = 'shipping';
              stText = 'Đang giao';
              active = 2;
            } else if (rawStatus === 'PACKING') {
              st = 'packing';
              stText = 'Đang đóng gói';
              active = 1;
            }

            const rawDate = ord.createdAt
              ? new Date(ord.createdAt).toLocaleDateString('vi-VN')
              : 'Gần đây';

            const items: OrderDisplayItem[] = Array.isArray(ord.items) && ord.items.length > 0
              ? ord.items.map((it: any) => ({
                  icon: 'cable',
                  name: it.productName || it.product?.name || `Vật tư (${it.productId?.slice(0, 8)})`,
                  spec: `SL: ${it.quantity} · SKU: ${it.sku || it.product?.sku || 'M&E'}`,
                  price: `${Number(it.unitPrice || 0).toLocaleString('vi-VN')}đ`,
                  productId: it.productId,
                  quantity: it.quantity,
                  unitPrice: it.unitPrice,
                }))
              : [
                  {
                    icon: 'box',
                    name: 'Đơn hàng vật tư tổng hợp',
                    spec: `Khách nhận: ${ord.customerName}`,
                    price: `${Number(ord.totalAmount || 0).toLocaleString('vi-VN')}đ`,
                  },
                ];

            const estDeliveryDate = ord.estimatedDeliveryDate
              ? new Date(ord.estimatedDeliveryDate).toLocaleDateString('vi-VN')
              : 'Dự kiến sau 1-2 ngày';

            const rawMethod = (ord.paymentMethod || '').toUpperCase();
            const paymentMethod =
              rawMethod.includes('BANK') || rawMethod.includes('TRANSFER')
                ? 'Chuyển khoản VietQR (Ngân hàng)'
                : rawMethod.includes('COD')
                ? 'Thanh toán khi nhận hàng (COD)'
                : ord.paymentMethod || 'Thanh toán khi nhận hàng (COD)';

            const rawPayStatus = (ord.paymentStatus || '').toUpperCase();
            const paymentStatus =
              rawPayStatus === 'PAID'
                ? 'Đã thanh toán'
                : rawPayStatus === 'UNPAID' || rawPayStatus === 'PENDING'
                ? 'Chưa thanh toán'
                : ord.paymentStatus || 'Chưa thanh toán';

            return {
              code: ord.orderNumber || `#${ord.id?.slice(0, 8)}`,
              date: rawDate,
              st,
              stText,
              active,
              dates: [rawDate, rawDate, estDeliveryDate, ''],
              total: `${Number(ord.totalAmount || 0).toLocaleString('vi-VN')}đ`,
              estimatedDelivery: estDeliveryDate,
              deliveryTimeSlot: '08:00 - 17:00 (Trong giờ hành chính)',
              deliveryNote: ord.notes || 'Tài xế sẽ gọi điện trước khi giao hàng 15-30 phút.',
              recipientName: ord.customerName || 'Khách hàng',
              recipientPhone: ord.customerPhone || '0903 456 789',
              shippingAddress: ord.shippingAddress || 'Địa chỉ đăng ký tài khoản',
              paymentMethod,
              paymentStatus,
              subtotal: `${Number(ord.totalAmount || 0).toLocaleString('vi-VN')}đ`,
              shippingFee: 'Miễn phí',
              discount: '0đ',
              items,
            };
          });
          setOrders(mapped);
        }
      })
      .catch(() => {
        // Keep default orders if api call fails
      });
  }, []);

  // Modal drag listeners and escape key handler
  useEffect(() => {
    if (!detailModalOrder) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleMove = (e: MouseEvent | PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;

      let clampedX = dragStartRef.current.initOffsetX + dx;
      let clampedY = dragStartRef.current.initOffsetY + dy;

      const modalEl = modalDialogRef.current;
      if (modalEl) {
        const maxOffsetX = Math.max(0, window.innerWidth / 2 - 40);
        const maxOffsetY = Math.max(0, window.innerHeight / 2 - 40);
        clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, clampedX));
        clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, clampedY));
      }

      currentOffsetRef.current = { x: clampedX, y: clampedY };
      setModalOffset({ x: clampedX, y: clampedY });
    };

    const handleUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.userSelect = '';
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeOrderDetailModal();
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.userSelect = '';
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [detailModalOrder, closeOrderDetailModal]);

  // Update sliding tab indicator
  const updateIndicator = useCallback(() => {
    if (!tabsInnerRef.current || !indicatorRef.current) return;
    const activeBtn = tabsInnerRef.current.querySelector<HTMLButtonElement>(
      `.profile-tab[data-tab="${activeTab}"]`
    );
    if (activeBtn) {
      indicatorRef.current.style.left = `${activeBtn.offsetLeft}px`;
      indicatorRef.current.style.width = `${activeBtn.offsetWidth}px`;
    }
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  // Card 3D Magnetic tilt effect
  useEffect(() => {
    const handleMove = (card: HTMLElement, maxDeg: number) => (e: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateY(${x * maxDeg}deg) rotateX(${-y * maxDeg}deg)`;
    };

    const handleLeave = (card: HTMLElement) => () => {
      card.style.transform = '';
    };

    const idCard = idCardRef.current;
    const mcard = mcardRef.current;

    const cleanupId = idCard ? {
      move: handleMove(idCard, 4),
      leave: handleLeave(idCard),
    } : null;
    const cleanupMcard = mcard ? {
      move: handleMove(mcard, 6),
      leave: handleLeave(mcard),
    } : null;

    if (idCard && cleanupId) {
      idCard.addEventListener('pointermove', cleanupId.move);
      idCard.addEventListener('pointerleave', cleanupId.leave);
    }
    if (mcard && cleanupMcard) {
      mcard.addEventListener('pointermove', cleanupMcard.move);
      mcard.addEventListener('pointerleave', cleanupMcard.leave);
    }

    return () => {
      if (idCard && cleanupId) {
        idCard.removeEventListener('pointermove', cleanupId.move);
        idCard.removeEventListener('pointerleave', cleanupId.leave);
      }
      if (mcard && cleanupMcard) {
        mcard.removeEventListener('pointermove', cleanupMcard.move);
        mcard.removeEventListener('pointerleave', cleanupMcard.leave);
      }
    };
  }, []);

  // Ripple effect on button clicks
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const b = e.currentTarget;
    const r = b.getBoundingClientRect();
    const s = Math.max(r.width, r.height);
    const x = e.clientX - r.left - s / 2;
    const y = e.clientY - r.top - s / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = `${s}px`;
    ripple.style.height = `${s}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    b.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 700);
  };

  // Password evaluation
  const pwCheck = {
    len: newPassword.length >= 8,
    cs: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    num: /\d/.test(newPassword),
    sym: /[^A-Za-z0-9]/.test(newPassword),
  };
  const pwScore = [pwCheck.len, pwCheck.cs, pwCheck.num, pwCheck.sym].filter(Boolean).length;
  const pwLabels = ['—', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];
  const pwColors = ['', 'var(--red)', 'var(--accent)', 'var(--blue)', 'var(--green)'];
  const pwInks = ['', 'var(--red-ink)', 'var(--accent-ink)', 'var(--blue-ink)', 'var(--green-ink)'];

  // Handle Save Personal Info
  const handleSaveProfile = (e: React.MouseEvent<HTMLButtonElement>) => {
    handleButtonClick(e);
    if (!fullNameInput.trim() || !phoneInput.trim() || !emailInput.trim()) {
      showToast('Điền đủ họ tên, SĐT và email đã nhé');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
      showToast('Email chưa đúng định dạng, kiểm tra lại giúp mình');
      return;
    }

    setSaveSuccess(true);
    if (user) {
      setAuth(
        getAccessToken() || '',
        {
          ...user,
          name: fullNameInput.trim(),
          email: emailInput.trim(),
        }
      );
    }
    showToast('Đã lưu thông tin cá nhân');
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2300);
  };

  // Handle Change Password
  const handleChangePassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    handleButtonClick(e);
    setPasswordError(null);

    if (!oldPassword) {
      setPasswordError('Nhập mật khẩu hiện tại đã nhé.');
      setPasswordShake(true);
      setTimeout(() => setPasswordShake(false), 500);
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Mật khẩu mới phải dài ít nhất 8 ký tự.');
      setPasswordShake(true);
      setTimeout(() => setPasswordShake(false), 500);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Hai ô mật khẩu mới không khớp — nhập lại giúp mình.');
      setPasswordShake(true);
      setTimeout(() => setPasswordShake(false), 500);
      return;
    }
    if (newPassword === oldPassword) {
      setPasswordError('Mật khẩu mới trùng mật khẩu cũ rồi.');
      setPasswordShake(true);
      setTimeout(() => setPasswordShake(false), 500);
      return;
    }

    setPasswordSuccess(true);
    showToast('Đổi mật khẩu thành công');
    setTimeout(() => {
      setPasswordSuccess(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 2300);
  };

  // Address Ledger Helpers
  const persistAddresses = (newAddrs: AddressItem[]) => {
    setAddresses(newAddrs);
    try {
      localStorage.setItem('tdt_customer_addresses_v3', JSON.stringify(newAddrs));
    } catch {
      // ignore
    }
  };

  const handleOpenAddAddr = () => {
    setEditingAddrIdx(-1);
    setAddrTag('');
    setAddrTxt('');
    setAddrName(fullNameInput || 'Nguyễn Văn Sáu');
    setAddrPhone(phoneInput || '0903 456 789');
    setAddrFormOpen(true);
    setTimeout(() => {
      addrFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  };

  const handleEditAddr = (idx: number) => {
    const item = addresses[idx];
    setEditingAddrIdx(idx);
    setAddrTag(item.tag);
    setAddrTxt(item.txt);
    setAddrName(item.name);
    setAddrPhone(item.phone);
    setAddrFormOpen(true);
    setTimeout(() => {
      addrFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  };

  const handleSaveAddr = (e: React.MouseEvent<HTMLButtonElement>) => {
    handleButtonClick(e);
    const tag = addrTag.trim();
    const txt = addrTxt.trim();
    const name = addrName.trim() || fullNameInput || 'Nguyễn Văn Sáu';
    const phone = addrPhone.trim() || phoneInput || '0903 456 789';

    if (!tag || !txt) {
      showToast('Nhập tên gợi nhớ và địa chỉ đã nhé');
      setAddrShake(true);
      setTimeout(() => setAddrShake(false), 500);
      return;
    }

    if (editingAddrIdx >= 0) {
      const updated = [...addresses];
      updated[editingAddrIdx] = {
        tag,
        txt,
        name,
        phone,
        def: addresses[editingAddrIdx].def,
      };
      persistAddresses(updated);
      setEnteringIdx(editingAddrIdx);
      showToast(`Đã cập nhật địa chỉ "${tag}"`);
    } else {
      const isDef = addresses.length === 0;
      const updated = [...addresses, { tag, txt, name, phone, def: isDef }];
      persistAddresses(updated);
      setEnteringIdx(updated.length - 1);
      showToast(`Đã ghi thêm "${tag}" vào sổ`);
    }

    setAddrFormOpen(false);
    setEditingAddrIdx(-1);
  };

  const handleDeleteAddr = (idx: number) => {
    const itemToDelete = addresses[idx];
    setLastDeletedAddr({ item: itemToDelete, index: idx });

    const updated = addresses.filter((_, i) => i !== idx);
    if (!updated.some((x) => x.def) && updated.length > 0) {
      updated[0].def = true;
    }
    persistAddresses(updated);

    showToast(`Đã xé trang "${itemToDelete.tag}" khỏi sổ`, {
      label: 'Hoàn tác',
      onClick: () => {
        const restored = [...updated];
        restored.splice(Math.min(idx, restored.length), 0, itemToDelete);
        persistAddresses(restored);
        setEnteringIdx(idx);
      },
    });
  };

  const handleSetDefaultAddr = (idx: number) => {
    const updated = addresses.map((a, i) => ({
      ...a,
      def: i === idx,
    }));
    persistAddresses(updated);
    showToast(`Đã đặt "${addresses[idx].tag}" làm địa chỉ mặc định`);
  };

  // Reorder Item handler
  const handleBuyAgain = (ord: OrderDisplay, e: React.MouseEvent<HTMLButtonElement>) => {
    handleButtonClick(e);
    ord.items.forEach((it) => {
      addItemToCart({
        id: it.productId || `prod-${Math.random().toString(36).substring(7)}`,
        name: it.name,
        price: it.price,
        unitPrice: it.unitPrice || 100000,
        sku: 'M&E',
        quantity: it.quantity || 1,
        image: '/images/products/day-cap-don-1.jpg',
      });
    });
    showToast(`Đã thêm ${ord.items.length} món của #${ord.code} vào giỏ hàng`);
  };

  const toggleOrderExpand = (code: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const normalizedSearchQuery = orderSearchQuery.trim().toLowerCase().replace(/^#/, '');

  const displayedOrders = orders.filter((o) => {
    // Status category check
    if (curOrderFilter !== 'all' && o.st !== curOrderFilter) {
      return false;
    }
    // Search query check
    if (normalizedSearchQuery) {
      const codeMatch = o.code.toLowerCase().replace(/^#/, '').includes(normalizedSearchQuery);
      const itemMatch = o.items.some(
        (it) =>
          it.name.toLowerCase().includes(normalizedSearchQuery) ||
          it.spec.toLowerCase().includes(normalizedSearchQuery)
      );
      const dateMatch = o.date.toLowerCase().includes(normalizedSearchQuery);
      return codeMatch || itemMatch || dateMatch;
    }
    return true;
  });

  const activeTheme = resolvedTheme || theme || 'dark';

  return (
    <div className="profile-root" data-theme={activeTheme}>
      <a className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 z-[400] bg-amber-500 text-black px-4 py-2 rounded-lg font-bold" href="#profileMain">
        Bỏ qua tới nội dung chính
      </a>

      {/* Background Ambience */}
      <div className="profile-bg" aria-hidden="true">
        <div className="profile-bg-grid" />
        <div className="profile-blob a" />
        <div className="profile-blob b" />
      </div>
      <div className="profile-grain" aria-hidden="true" />

      {/* TOPBAR */}
      <header className={`profile-topbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="profile-topbar-in">
          <Link href="/" className="profile-brand" aria-label="TDT M&E — về trang chủ">
            <span className="profile-brand-mark">{IC.bolt}</span>
            <span className="profile-brand-name">
              TDT M&amp;E<small>Vật tư điện nước</small>
            </span>
          </Link>

          <div className="profile-topbar-right">
            <span className="profile-greet">
              {greeting}, <b>{fullNameInput.split(' ').slice(-1)[0] || 'Khách hàng'}</b>
            </span>

            <span className="profile-tier-chip">
              <span className="dot" /> Thợ thân thiết
            </span>

            <Link href="/shop" className="profile-nav-link" title="Đến cửa hàng vật tư">
              <span className="w-4 h-4">{IC.bag}</span>
              <span className="hidden sm:inline">Cửa hàng</span>
            </Link>

            <button
              className="profile-theme-btn"
              onClick={() => setTheme(activeTheme === 'dark' ? 'light' : 'dark')}
              aria-label="Đổi giao diện sáng / tối"
              title="Đổi giao diện sáng / tối"
            >
              <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 13.5A8 8 0 0 1 10.5 4 6.5 6.5 0 1 0 20 13.5z" />
              </svg>
              <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4.2" />
                <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3L19 19M19 5l-1.7 1.7M6.7 17.3L5 19" />
              </svg>
            </button>

            <button
              className="profile-avatar-btn"
              onClick={() => setActiveTab('account')}
              aria-label="Mở tab tài khoản"
              title="Quản lý tài khoản"
            >
              {fullNameInput ? fullNameInput[0]?.toUpperCase() : 'S'}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="profile-wrap" id="profileMain">
        {/* TABS (Cụm cầu dao) */}
        <nav className="profile-tabs" aria-label="Mục tài khoản">
          <div className="profile-tabs-inner" ref={tabsInnerRef} role="tablist">
            <span className="profile-indicator" ref={indicatorRef} />

            <button
              className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
              data-tab="overview"
              role="tab"
              aria-selected={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
                <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
                <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
                <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
              </svg>
              Tổng quan
            </button>

            <button
              className={`profile-tab ${activeTab === 'orders' ? 'active' : ''}`}
              data-tab="orders"
              role="tab"
              aria-selected={activeTab === 'orders'}
              onClick={() => setActiveTab('orders')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 5h16v11H4z" />
                <path d="M4 10h16M9 5v5" />
              </svg>
              Đơn hàng
            </button>

            <button
              className={`profile-tab ${activeTab === 'address' ? 'active' : ''}`}
              data-tab="address"
              role="tab"
              aria-selected={activeTab === 'address'}
              onClick={() => setActiveTab('address')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h10" />
                <circle cx="19" cy="18" r="2.4" />
              </svg>
              Sổ địa chỉ
            </button>

            <button
              className={`profile-tab ${activeTab === 'account' ? 'active' : ''}`}
              data-tab="account"
              role="tab"
              aria-selected={activeTab === 'account'}
              onClick={() => setActiveTab('account')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="6" width="18" height="13" rx="2.5" />
                <path d="M3 10.5h18M7 15.5h4" />
              </svg>
              Tài khoản
            </button>
          </div>
        </nav>

        {/* TAB 1: TỔNG QUAN (BENTO) */}
        <section className={`profile-panel ${activeTab === 'overview' ? 'active' : ''}`} role="tabpanel">
          <div className="bento">
            {/* Identity Card */}
            <div className="cell cell-id anim" style={{ '--i': 0 } as any} ref={idCardRef}>
              <div className="ck">
                {IC.user} Chủ tài khoản
              </div>
              <div className="id-flex">
                <div className="avatar">
                  {fullNameInput ? fullNameInput[0]?.toUpperCase() : 'S'}
                  <span className="online" />
                </div>
                <div className="who">
                  <h1>{fullNameInput || 'Nguyễn Văn Sáu'}</h1>
                  <div className="sub">
                    <span className="inline-flex items-center gap-1.5">{IC.bolt} Thợ điện nước</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1.5">{IC.pin} Bình Thạnh, TP.HCM</span>
                  </div>
                  <div className="id-tags">
                    <span className="tag">
                      <span className="w-3 h-3 text-amber-500">{IC.check}</span> Đã xác thực SĐT
                    </span>
                    <span className="tag">
                      <span className="w-3 h-3 text-amber-500">+</span> Xuất hóa đơn VAT
                    </span>
                  </div>
                </div>
              </div>
              <div className="id-stats">
                <div>
                  <div className="k">Tham gia</div>
                  <div className="v">2023</div>
                </div>
                <div>
                  <div className="k">Đơn gần nhất</div>
                  <div className="v">#0101</div>
                </div>
                <div>
                  <div className="k">Chiết khấu hạng</div>
                  <div className="v">3%</div>
                </div>
              </div>
            </div>

            {/* Tier Mini Ring Card */}
            <div className="cell cell-tier anim" style={{ '--i': 1 } as any}>
              <div className="ck">
                {IC.bolt} Hạng
              </div>
              <div className="tier-ring-wrap">
                <svg className="tier-ring" viewBox="0 0 120 120" aria-hidden="true">
                  <circle className="tier-ring-bg" cx="60" cy="60" r="50" />
                  <circle
                    className="tier-ring-fg"
                    cx="60"
                    cy="60"
                    r="50"
                    style={{ strokeDashoffset: '72.2' }}
                  />
                </svg>
                <div className="tier-ring-label">
                  <b>77%</b>
                  <span>Thợ Vàng</span>
                </div>
              </div>
              <p className="tier-note">
                Còn <b>11,5 tr</b> nữa lên hạng
              </p>
            </div>

            {/* Points KPI Card */}
            <div className="cell cell-points anim" style={{ '--i': 2 } as any}>
              <div className="ck">
                {IC.star} Điểm
              </div>
              <div className="big-num">
                <span>1.250</span>
              </div>
              <div className="delta warn">320 điểm hết hạn 31/12</div>
            </div>

            {/* Orders KPI Card */}
            <div className="cell cell-orders anim" style={{ '--i': 3 } as any}>
              <div className="ck">
                {IC.box} Đơn hàng
              </div>
              <div className="big-num">
                <span>{orders.length > 3 ? orders.length : 47}</span>
              </div>
              <div className="delta up">▲ 6 đơn trong tháng 10</div>
            </div>

            {/* Spend KPI Card */}
            <div className="cell cell-spend anim" style={{ '--i': 4 } as any}>
              <div className="ck">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 3v18M7 7h10M7 17h10" />
                </svg>
                Chi tiêu
              </div>
              <div className="big-num">
                <span>38,5</span> <small>tr</small>
              </div>
              <div className="delta up">▲ 12,4% so với năm trước</div>
            </div>

            {/* Live Delivery Card */}
            <div className="cell cell-live anim" style={{ '--i': 5 } as any}>
              <div className="live-top">
                <span className="led">
                  <i /> Đang giao
                </span>
                <span className="live-code">
                  <span className="hash">#</span>TDT-2026-0101
                </span>
              </div>
              <div className="live-meta">
                Dây cáp Cadivi · aptomat Schneider · 10 ổ cắm Panasonic — qua kho Bình Thạnh
              </div>
              <div className="live-bar">
                <div className="row">
                  <span>Hành trình giao hàng</span>
                  <b>66%</b>
                </div>
                <div className="mini-track">
                  <i style={{ width: '66%' }} />
                </div>
              </div>
              <div className="live-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={(e) => {
                    handleButtonClick(e);
                    setActiveTab('orders');
                  }}
                >
                  <span className="w-4 h-4">{IC.truck}</span>
                  Theo dõi chi tiết
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => {
                    handleButtonClick(e);
                    handleBuyAgain(DEFAULT_ORDERS[0], e);
                  }}
                >
                  <span className="w-4 h-4">{IC.refresh}</span>
                  Mua lại
                </button>
              </div>
            </div>

            {/* Quick Shortcuts Card */}
            <div className="cell cell-quick anim" style={{ '--i': 6 } as any}>
              <div className="ck">
                {IC.bolt} Lối tắt
              </div>
              <button
                className="qrow"
                onClick={(e) => {
                  handleButtonClick(e);
                  setActiveTab('orders');
                }}
              >
                <span className="qic">{IC.box}</span>
                <span>
                  <b>Quản lý đơn hàng</b>
                  <span>Theo dõi · chi tiết · mua lại</span>
                </span>
                <span className="go">{IC.chev}</span>
              </button>

              <button
                className="qrow"
                onClick={(e) => {
                  handleButtonClick(e);
                  setActiveTab('address');
                  handleOpenAddAddr();
                }}
              >
                <span className="qic">{IC.pin}</span>
                <span>
                  <b>Thêm địa chỉ công trình</b>
                  <span>Lưu sẵn để đặt hàng nhanh</span>
                </span>
                <span className="go">{IC.chev}</span>
              </button>

              <button
                className="qrow"
                onClick={(e) => {
                  handleButtonClick(e);
                  setActiveTab('account');
                  setTimeout(() => {
                    document.getElementById('p-new')?.focus();
                  }, 350);
                }}
              >
                <span className="qic">{IC.lock}</span>
                <span>
                  <b>Đổi mật khẩu</b>
                  <span>Tăng bảo mật tài khoản</span>
                </span>
                <span className="go">{IC.chev}</span>
              </button>
            </div>
          </div>
        </section>

        {/* TAB 2: ĐƠN HÀNG (VÉ) */}
        <section className={`profile-panel ${activeTab === 'orders' ? 'active' : ''}`} role="tabpanel">
          <div className="orders-toolbar anim" style={{ '--i': 0 } as any}>
            <div className="chips" role="group" aria-label="Lọc đơn hàng">
              {FILTERS.map(([fKey, fLabel]) => {
                const count = fKey === 'all'
                  ? orders.length
                  : orders.filter((o) => o.st === fKey).length;
                return (
                  <button
                    key={fKey}
                    className={`chip ${curOrderFilter === fKey ? 'active' : ''}`}
                    onClick={() => setCurOrderFilter(fKey)}
                  >
                    {fLabel} <span className="n">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* EXPANDABLE SEARCH BOX (SLIDE OUT LEFT) */}
            <div
              className={`order-search-box ${orderSearchOpen || orderSearchQuery ? 'open' : ''}`}
              onMouseEnter={() => setOrderSearchOpen(true)}
              onMouseLeave={() => {
                if (!isSearchFocused && !orderSearchQuery) {
                  setOrderSearchOpen(false);
                }
              }}
            >
              <input
                ref={searchInputRef}
                type="text"
                className="order-search-input"
                placeholder="Tìm mã đơn (#ORD...), vật tư..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                onFocus={() => {
                  setIsSearchFocused(true);
                  setOrderSearchOpen(true);
                }}
                onBlur={() => {
                  setIsSearchFocused(false);
                  if (!orderSearchQuery) {
                    setOrderSearchOpen(false);
                  }
                }}
                aria-label="Tìm kiếm mã đơn hàng hoặc vật tư"
              />
              {orderSearchQuery && (
                <button
                  type="button"
                  className="order-search-clear"
                  onClick={() => {
                    setOrderSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  {IC.close}
                </button>
              )}
              <button
                type="button"
                className="order-search-trigger"
                onClick={() => {
                  setOrderSearchOpen(true);
                  searchInputRef.current?.focus();
                }}
                aria-label="Tìm kiếm đơn hàng"
              >
                {IC.search}
              </button>
            </div>
          </div>

          <div id="orderList">
            {displayedOrders.length === 0 ? (
              <div className="empty anim" style={{ '--i': 0 } as any}>
                <div className="eic">{IC.search}</div>
                <b>Không tìm thấy đơn hàng</b>
                <p>
                  {orderSearchQuery
                    ? `Không có đơn hàng nào khớp với "${orderSearchQuery}".`
                    : 'Thử chọn trạng thái lọc khác nhé.'}
                </p>
                {orderSearchQuery && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: '12px' }}
                    onClick={() => {
                      setOrderSearchQuery('');
                      setCurOrderFilter('all');
                    }}
                  >
                    Xóa tìm kiếm
                  </button>
                )}
              </div>
            ) : (
              displayedOrders.map((ord, idx) => {
                const isExpanded = !!expandedOrders[ord.code];
                return (
                  <article key={ord.code} className="ticket anim" style={{ '--i': idx } as any}>
                    <div className="t-main">
                      <div className="t-head">
                        <span className="t-code">
                          <span className="hash">#</span>
                          {ord.code}
                        </span>
                        <span className="t-date">đặt ngày {ord.date}</span>
                        <button
                          className="icon-btn t-toggle"
                          aria-label="Xem chi tiết đơn hàng"
                          onClick={() => toggleOrderExpand(ord.code)}
                        >
                          <span className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            {IC.chev}
                          </span>
                        </button>
                      </div>

                      <div className="t-body">
                        {/* Vertical Timeline */}
                        <ol className="vsteps">
                          {STEPS.map((s, i) => {
                            const isDone = i < ord.active;
                            const isActive = i === ord.active;
                            const cls = isDone ? 'done' : isActive ? 'active' : 'todo';
                            return (
                              <li key={s} className={`vstep ${cls}`}>
                                <span className="vdot">
                                  {isDone ? IC.check : <span>{i + 1}</span>}
                                </span>
                                <span className="vl">
                                  <b>{s}</b>
                                  <span>{ord.dates[i] || '···'}</span>
                                </span>
                              </li>
                            );
                          })}
                        </ol>

                        {/* Order Items Accordion */}
                        <div className={`t-items ${isExpanded ? 'open' : ''}`}>
                          {ord.items.map((it, itemIdx) => {
                            const iconSvg = IC[it.icon] || IC.box;
                            return (
                              <div key={`${ord.code}-${itemIdx}`} className="oi">
                                <div className="thumb">{iconSvg}</div>
                                <div className="nm">
                                  <b>{it.name}</b>
                                  <span>{it.spec}</span>
                                </div>
                                <div className="pr">{it.price}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Ticket Stub */}
                    <div className="t-stub">
                      <span className={`stamp ${ord.st}`}>{ord.stText}</span>
                      <div className="t-total">
                        <span>Tổng tiền</span>
                        <b>{ord.total}</b>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => handleBuyAgain(ord, e)}
                      >
                        Mua lại
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openOrderDetailModal(ord)}
                      >
                        Chi tiết
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* TAB 3: SỔ ĐỊA CHỈ (LEDGER) */}
        <section className={`profile-panel ${activeTab === 'address' ? 'active' : ''}`} role="tabpanel">
          <div className="profile-card anim" style={{ '--i': 0 } as any}>
            <h3>
              {IC.pin} Sổ địa chỉ
            </h3>
            <p className="desc">
              Địa chỉ mặc định tự điền khi đặt hàng. Xóa nhầm thì bấm nút hoàn tác trong vài giây.
            </p>

            <div id="addrWrap">
              {addresses.length === 0 ? (
                <div className="empty">
                  <div className="eic">{IC.pin}</div>
                  <b>Cuốn sổ đang trống</b>
                  <p>Thêm địa chỉ nhà hoặc công trình để đặt hàng nhanh hơn.</p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      handleButtonClick(e);
                      handleOpenAddAddr();
                    }}
                  >
                    Ghi địa chỉ đầu tiên
                  </button>
                </div>
              ) : (
                <div className="ledger" id="ledger">
                  {addresses.map((a, i) => {
                    const isEntered = enteringIdx === i;
                    const padNum = (i + 1 < 10 ? '0' : '') + (i + 1);
                    return (
                      <div
                        key={`${a.tag}-${i}`}
                        className={`lrow ${a.def ? 'is-default' : ''} ${isEntered ? 'entering' : ''}`}
                      >
                        <span className="lidx">{padNum}</span>
                        <div>
                          <div className="ltag">
                            {IC.pin} <span>{a.tag}</span>
                            {a.def && <span className="pill-default">Mặc định</span>}
                          </div>
                          <div className="ltxt">{a.txt}</div>
                          <div className="lphone">
                            {a.name} · {a.phone}
                          </div>
                        </div>

                        <div className="lact">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => {
                              handleButtonClick(e);
                              handleEditAddr(i);
                            }}
                          >
                            Sửa
                          </button>
                          {!a.def && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={(e) => {
                                handleButtonClick(e);
                                handleSetDefaultAddr(i);
                              }}
                            >
                              Đặt mặc định
                            </button>
                          )}
                          <button
                            className="btn btn-danger-ghost btn-sm"
                            onClick={(e) => {
                              handleButtonClick(e);
                              handleDeleteAddr(i);
                            }}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ marginTop: '18px' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => {
                    handleButtonClick(e);
                    if (addrFormOpen && editingAddrIdx === -1) {
                      setAddrFormOpen(false);
                    } else {
                      handleOpenAddAddr();
                    }
                  }}
                >
                  <span className="w-4 h-4 font-bold">+</span>
                  Thêm địa chỉ mới
                </button>
              </div>

              {/* Inline Address Form */}
              <div
                className={`addr-form ${addrFormOpen ? 'open' : ''} ${addrShake ? 'shake' : ''}`}
                ref={addrFormRef}
              >
                <div className="field">
                  <label htmlFor="a-tag">Tên gợi nhớ (vd: Nhà riêng, Công trình...)</label>
                  <input
                    id="a-tag"
                    value={addrTag}
                    onChange={(e) => setAddrTag(e.target.value)}
                    placeholder="Nhà riêng"
                  />
                </div>
                <div className="field">
                  <label htmlFor="a-txt">Địa chỉ chi tiết</label>
                  <input
                    id="a-txt"
                    value={addrTxt}
                    onChange={(e) => setAddrTxt(e.target.value)}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                  />
                </div>
                <div className="grid2">
                  <div className="field">
                    <label htmlFor="a-name">Người nhận</label>
                    <input
                      id="a-name"
                      value={addrName}
                      onChange={(e) => setAddrName(e.target.value)}
                      placeholder="Nguyễn Văn Sáu"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="a-phone">Số điện thoại</label>
                    <input
                      id="a-phone"
                      value={addrPhone}
                      onChange={(e) => setAddrPhone(e.target.value)}
                      placeholder="0903 456 789"
                      inputMode="tel"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveAddr}>
                    {editingAddrIdx >= 0 ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      handleButtonClick(e);
                      setAddrFormOpen(false);
                      setEditingAddrIdx(-1);
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TAB 4: TÀI KHOẢN (THẺ & BẢO MẬT & HỒ SƠ) */}
        <section className={`profile-panel ${activeTab === 'account' ? 'active' : ''}`} role="tabpanel">
          <div className="grid2" style={{ alignItems: 'start' }}>
            {/* Left column: 3D Gold Member card & Change Password */}
            <div className="anim" style={{ '--i': 0 } as any}>
              {/* Member Card */}
              <div className="mcard" ref={mcardRef} aria-label="Thẻ thành viên TDT M&E">
                <div className="mc-top">
                  <span className="mc-brand">
                    <span className="brand-mark">{IC.bolt}</span>
                    TDT M&amp;E
                  </span>
                  <span className="mc-tier">Thợ thân thiết</span>
                </div>
                <div className="mc-chip" />
                <div className="mc-num">TDT · 2026 · 0101</div>
                <div className="mc-bot">
                  <div>
                    <span>Chủ thẻ</span>
                    <b>{(fullNameInput || 'NGUYỄN VĂN SÁU').toUpperCase()}</b>
                  </div>
                  <div>
                    <span>Thành viên từ</span>
                    <b>2023</b>
                  </div>
                </div>
              </div>

              {/* Password Card */}
              <div className={`profile-card ${passwordShake ? 'shake' : ''}`} style={{ marginBottom: 0 }}>
                <h3>{IC.lock} Bảo mật</h3>
                <p className="desc">Đổi mật khẩu định kỳ giúp tài khoản an toàn hơn.</p>

                <div className="field">
                  <label htmlFor="p-old">Mật khẩu hiện tại</label>
                  <div className="in-wrap">
                    <input
                      type={showOldPw ? 'text' : 'password'}
                      id="p-old"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Nhập mật khẩu đang dùng"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="eye"
                      onClick={() => setShowOldPw(!showOldPw)}
                      aria-label={showOldPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showOldPw ? IC.eye : IC.eyeOff}
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="p-new">Mật khẩu mới</label>
                  <div className="in-wrap">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      id="p-new"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="eye"
                      onClick={() => setShowNewPw(!showNewPw)}
                      aria-label={showNewPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showNewPw ? IC.eye : IC.eyeOff}
                    </button>
                  </div>

                  {/* Strength Bar */}
                  <div className="strength" aria-hidden="true">
                    {[0, 1, 2, 3].map((idx) => {
                      const on = idx < pwScore;
                      return (
                        <i
                          key={idx}
                          className={on ? 'on' : ''}
                          style={{ background: on ? pwColors[pwScore] : undefined }}
                        />
                      );
                    })}
                  </div>
                  <div className="str-lbl">
                    Độ mạnh:{' '}
                    <b style={{ color: pwScore ? pwInks[pwScore] : 'var(--faint)' }}>
                      {pwLabels[pwScore]}
                    </b>
                  </div>

                  {/* Checklist */}
                  <ul className="checklist">
                    <li className={pwCheck.len ? 'ok' : ''}>
                      <span className="box">{IC.check}</span>
                      Ít nhất 8 ký tự
                    </li>
                    <li className={pwCheck.cs ? 'ok' : ''}>
                      <span className="box">{IC.check}</span>
                      Có cả chữ hoa và chữ thường
                    </li>
                    <li className={pwCheck.num ? 'ok' : ''}>
                      <span className="box">{IC.check}</span>
                      Có số
                    </li>
                    <li className={pwCheck.sym ? 'ok' : ''}>
                      <span className="box">{IC.check}</span>
                      Có ký tự đặc biệt (!@#...)
                    </li>
                  </ul>
                </div>

                <div className="field">
                  <label htmlFor="p-new2">Nhập lại mật khẩu mới</label>
                  <div className="in-wrap">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      id="p-new2"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại cho chắc"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="eye"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      aria-label={showConfirmPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showConfirmPw ? IC.eye : IC.eyeOff}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <div className="form-err show">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v6M12 16.5v.01" />
                    </svg>
                    <span>{passwordError}</span>
                  </div>
                )}

                <button
                  className={`btn btn-primary ${passwordSuccess ? 'success' : ''}`}
                  onClick={handleChangePassword}
                  disabled={passwordSuccess}
                >
                  <span className="btn-label flex items-center gap-2">
                    <span className="w-4 h-4">{IC.check}</span>
                    Cập nhật mật khẩu
                  </span>
                  <span className="btn-label-ok">Đã đổi xong</span>
                  <span className="check">{IC.check}</span>
                </button>
              </div>
            </div>

            {/* Right column: Personal Profile Info Card */}
            <div className="profile-card anim" style={{ '--i': 1 } as any}>
              <h3>{IC.user} Hồ sơ cá nhân</h3>
              <p className="desc">Dùng để liên hệ khi giao hàng và xuất hóa đơn VAT.</p>

              <div className="field">
                <label htmlFor="f-name">Họ và tên</label>
                <input
                  id="f-name"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div className="field">
                <label htmlFor="f-phone">Số điện thoại</label>
                <input
                  id="f-phone"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>

              <div className="field">
                <label htmlFor="f-email">Email</label>
                <input
                  id="f-email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  inputMode="email"
                  autoComplete="email"
                />
              </div>

              <div className="pt-2">
                <button
                  className={`btn btn-primary ${saveSuccess ? 'success' : ''}`}
                  onClick={handleSaveProfile}
                  disabled={saveSuccess}
                >
                  <span className="btn-label flex items-center gap-2">
                    <span className="w-4 h-4">{IC.check}</span>
                    Lưu thay đổi
                  </span>
                  <span className="btn-label-ok">Đã lưu</span>
                  <span className="check">{IC.check}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="profile-footer">
          <span className="fbrand">
            <span
              className="brand-mark"
              style={{
                width: '30px',
                height: '30px',
                flexBasis: '30px',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-deep))',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '15px', height: '15px', color: 'var(--on-accent)' }}>
                <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
              </svg>
            </span>
            TDT M&amp;E
          </span>
          <small>Vật tư điện nước · Hotline 1900 6368 · Hệ thống tài khoản TDT</small>
          <nav aria-label="Liên kết phụ">
            <Link href="/shop">Cửa hàng</Link>
            <Link href="/account">Trang đơn hàng cũ</Link>
            <button
              type="button"
              onClick={() => {
                clearTokens();
                window.location.href = '/login';
              }}
            >
              Đăng xuất
            </button>
          </nav>
        </footer>
      </main>

      {/* FLOATING TOAST NOTIFICATION */}
      <div className={`profile-toast ${toastShow ? 'show' : ''}`} role="status" aria-live="polite">
        <span className="tic">{IC.check}</span>
        <span id="toastMsg">{toastMsg}</span>
        {toastAction && (
          <button
            className="tact"
            onClick={() => {
              setToastShow(false);
              toastAction.onClick();
            }}
          >
            {toastAction.label}
          </button>
        )}
      </div>

      {/* DRAGGABLE ORDER DETAIL POPUP MODAL */}
      {detailModalOrder && (
        <div
          className="order-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeOrderDetailModal();
            }
          }}
        >
          <div
            ref={modalDialogRef}
            className="order-modal-dialog"
            style={{
              '--dx': `${modalOffset.x}px`,
              '--dy': `${modalOffset.y}px`,
              transform: `translate3d(${modalOffset.x}px, ${modalOffset.y}px, 0)`,
            } as React.CSSProperties}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
          >
            {/* Draggable Header */}
            <div
              className="order-modal-header"
              onMouseDown={handleHeaderMouseDown}
              onPointerDown={handleHeaderPointerDown}
            >
              <div className="order-modal-title" id="order-modal-title">
                <span className="order-modal-grip" title="Kéo thả để di chuyển">
                  {IC.grip}
                </span>
                <span className="order-modal-code">
                  <span style={{ color: 'var(--accent)' }}>#</span>
                  {detailModalOrder.code}
                </span>
                <span className={`stamp ${detailModalOrder.st}`}>
                  {detailModalOrder.stText}
                </span>
              </div>

              <button
                type="button"
                className="order-modal-close"
                onClick={closeOrderDetailModal}
                aria-label="Đóng bảng chi tiết"
              >
                {IC.close}
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="order-modal-body">
              {/* ESTIMATED DELIVERY HIGHLIGHT BANNER */}
              <div className="est-delivery-banner">
                <div className="est-delivery-icon">
                  {IC.truck}
                </div>
                <div className="est-delivery-content">
                  <div className="est-delivery-tag">Thời gian giao dự kiến</div>
                  <div className="est-delivery-time">
                    {detailModalOrder.estimatedDelivery || 'Dự kiến 1-2 ngày tới'}
                  </div>
                  {detailModalOrder.deliveryTimeSlot && (
                    <div className="est-delivery-slot">
                      {IC.clock}
                      <span>Khung giờ: {detailModalOrder.deliveryTimeSlot}</span>
                    </div>
                  )}
                  {detailModalOrder.deliveryNote && (
                    <div className="est-delivery-note">
                      {detailModalOrder.deliveryNote}
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Timeline */}
              <div className="order-modal-block">
                <div className="order-modal-block-title">
                  {IC.refresh} Tiến trình vận chuyển
                </div>
                <ol className="vsteps" style={{ marginBottom: 0 }}>
                  {STEPS.map((s, i) => {
                    const isDone = i < detailModalOrder.active;
                    const isActive = i === detailModalOrder.active;
                    const cls = isDone ? 'done' : isActive ? 'active' : 'todo';
                    return (
                      <li key={s} className={`vstep ${cls}`}>
                        <span className="vdot">
                          {isDone ? IC.check : <span>{i + 1}</span>}
                        </span>
                        <span className="vl">
                          <b>{s}</b>
                          <span>{detailModalOrder.dates[i] || '···'}</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Recipient & Address Info */}
              <div className="order-modal-block">
                <div className="order-modal-block-title">
                  {IC.pin} Thông tin nhận hàng
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 600 }}>
                    <span style={{ color: 'var(--faint)', width: '16px', height: '16px', display: 'inline-flex' }}>{IC.user}</span>
                    <span>{detailModalOrder.recipientName || 'Nguyễn Văn Sáu'}</span>
                    <span style={{ color: 'var(--muted)', fontWeight: 400 }}>·</span>
                    <span style={{ color: 'var(--faint)', width: '16px', height: '16px', display: 'inline-flex' }}>{IC.phone}</span>
                    <span>{detailModalOrder.recipientPhone || '0903 456 789'}</span>
                  </div>
                  <div style={{ color: 'var(--muted)', paddingLeft: '24px' }}>
                    {detailModalOrder.shippingAddress || '128/45 Nguyễn Xí, P.26, Q.Bình Thạnh, TP.HCM'}
                  </div>
                </div>
              </div>

              {/* Ordered Items Table */}
              <div className="order-modal-block">
                <div className="order-modal-block-title">
                  {IC.box} Danh sách vật tư ({detailModalOrder.items.length})
                </div>
                <div className="order-modal-items">
                  {detailModalOrder.items.map((it, idx) => {
                    const iconSvg = IC[it.icon] || IC.box;
                    return (
                      <div key={idx} className="order-modal-item">
                        <div className="order-modal-item-thumb">{iconSvg}</div>
                        <div className="order-modal-item-info">
                          <b>{it.name}</b>
                          <span>{it.spec}</span>
                        </div>
                        <div className="order-modal-item-pricing">
                          <b>{it.price}</b>
                          {it.quantity && (
                            <span>Số lượng: {it.quantity}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial & Payment Summary */}
              <div className="order-modal-block">
                <div className="order-modal-block-title">
                  {IC.card} Thanh toán & Hóa đơn
                </div>
                <div className="order-modal-summary">
                  <div className="order-modal-summary-row">
                    <span>Phương thức thanh toán</span>
                    <b style={{ color: 'var(--text)' }}>{detailModalOrder.paymentMethod || 'Chuyển khoản VietQR'}</b>
                  </div>
                  <div className="order-modal-summary-row">
                    <span>Trạng thái thanh toán</span>
                    <span className="pill-default" style={{ fontSize: '11px' }}>
                      {detailModalOrder.paymentStatus || 'Đã thanh toán'}
                    </span>
                  </div>
                  <div className="order-modal-summary-row">
                    <span>Tạm tính</span>
                    <b>{detailModalOrder.subtotal || detailModalOrder.total}</b>
                  </div>
                  <div className="order-modal-summary-row">
                    <span>Phí vận chuyển</span>
                    <b style={{ color: 'var(--green-ink)' }}>{detailModalOrder.shippingFee || 'Miễn phí'}</b>
                  </div>
                  <div className="order-modal-summary-row total">
                    <span>Tổng thanh toán</span>
                    <b>{detailModalOrder.total}</b>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="order-modal-footer">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={closeOrderDetailModal}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={(e) => {
                  handleBuyAgain(detailModalOrder, e);
                }}
              >
                <span className="w-4 h-4">{IC.refresh}</span>
                Mua lại đơn này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
