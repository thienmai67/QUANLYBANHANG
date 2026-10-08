/**
 * Helper utilities for SHIPPER role:
 * - Phone number normalization for `tel:` links
 * - Google Maps driving navigation URLs with coordinates or address
 * - Client-side Canvas image resizer for POD (Proof of Delivery)
 * - WCAG Luminance & Contrast ratio mathematical calculator (for verifying >= 7:1 outdoor contrast)
 */

/**
 * Normalizes phone number by retaining digits and optional leading plus.
 */
export function normalizePhone(rawPhone?: string | null): string {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  const trimmed = rawPhone.trim();
  const hasLeadingPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  return hasLeadingPlus ? `+${digits}` : digits;
}

/**
 * Resolves contact phone for an order: prefers siteContact.phone, falls back to customerPhone.
 */
export function getOrderContactPhone(order: {
  siteContact?: { phone: string };
  customerPhone?: string;
}): string {
  return normalizePhone(order.siteContact?.phone || order.customerPhone || '');
}

/**
 * Generates RFC 3966 `tel:` URL for 1-tap phone calls.
 */
export function getTelUrl(order: {
  siteContact?: { phone: string };
  customerPhone?: string;
}): string {
  const phone = getOrderContactPhone(order);
  return phone ? `tel:${phone}` : '';
}

/**
 * Generates Google Maps driving navigation URL.
 * Prefers destination coordinates (lat,lng) if provided; otherwise falls back to URL-encoded address.
 */
export function getGoogleMapsUrl(order: {
  deliveryCoords?: { lat: number; lng: number };
  shippingAddress?: string;
}): string {
  if (
    order.deliveryCoords &&
    typeof order.deliveryCoords.lat === 'number' &&
    typeof order.deliveryCoords.lng === 'number'
  ) {
    return `https://www.google.com/maps/dir/?api=1&destination=${order.deliveryCoords.lat},${order.deliveryCoords.lng}&travelmode=driving`;
  }

  const encodedAddress = encodeURIComponent(
    order.shippingAddress?.trim() || 'Hồ Chí Minh, Việt Nam'
  );
  return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
}

/**
 * Resizes an image file to max dimension (default 800px) and quality (default 0.7 JPEG)
 * using HTML5 Canvas to conserve localStorage space and stay well within quotas.
 */
export async function resizeImageCanvas(
  file: File,
  maxDimension: number = 800,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 10MB file limit guard
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Kích thước ảnh gốc vượt quá giới hạn 10MB'));
      return;
    }

    if (typeof window === 'undefined') {
      resolve(`data:image/jpeg;base64,mock_${file.name}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context không khả dụng'));
          return;
        }

        // White background for transparent PNG to JPEG conversion
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('Không thể tải hoặc xử lý file ảnh'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Không thể đọc file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Parses Hex color code (#fff or #ffffff) to RGB components.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace(/^#/, '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

/**
 * Calculates WCAG 2.1 relative luminance for an sRGB component.
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Computes WCAG 2.1 Contrast Ratio between two hex colors.
 * Standard requirement: >= 4.5:1 for normal text (AA), >= 7:1 for High Contrast (AAA).
 */
export function calculateContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;

  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  const ratio = (brightest + 0.05) / (darkest + 0.05);
  return Math.round(ratio * 100) / 100;
}
