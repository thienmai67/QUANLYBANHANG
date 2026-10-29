"use client";

import React, { useState } from 'react';
import { ChatMessage, ChatProductItem } from '@/types/chat';
import { useCartStore } from '@/store/useCartStore';
import { getAccessToken } from '@/lib/auth';
import { useToast } from '@/hooks/useToast';
import { ShoppingCart, Check, Database, AlertTriangle, Info, Tag, Package } from 'lucide-react';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export default function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.sender === 'user';
  const addItem = useCartStore((state) => state.addItem);
  const toast = useToast();
  const [addedSkuMap, setAddedSkuMap] = useState<Record<string, boolean>>({});

  const handleAddToCart = (prod: ChatProductItem) => {
    if (typeof window !== 'undefined' && !getAccessToken()) {
      toast.warning('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      return;
    }
    const formattedPrice = `${Math.round(prod.finalPrice).toLocaleString('vi-VN')} ₫`;
    addItem(
      {
        id: prod.id,
        sku: prod.sku,
        name: prod.name,
        price: formattedPrice,
        unitPrice: prod.finalPrice,
        image: prod.image || '/images/products/day-cap-don-1.jpg',
        quantity: 1,
      },
      true // opens CartDrawer without redirect
    );

    setAddedSkuMap((prev) => ({ ...prev, [prod.sku]: true }));
    setTimeout(() => {
      setAddedSkuMap((prev) => ({ ...prev, [prod.sku]: false }));
    }, 2000);
  };

  // Extract special system labels
  const rawText = message.text;
  let cleanText = rawText;
  const labels: Array<{ text: string; type: 'db' | 'calc' | 'basic' }> = [];

  if (cleanText.includes('[Dữ liệu thật từ kho]')) {
    labels.push({ text: 'Dữ liệu thật từ kho', type: 'db' });
    cleanText = cleanText.replace(/\[Dữ liệu thật từ kho\]\n?/g, '');
  }
  if (cleanText.includes('[Ước tính — cần thợ điện nước xác nhận]')) {
    labels.push({ text: 'Ước tính — cần thợ điện nước xác nhận', type: 'calc' });
    cleanText = cleanText.replace(/\[Ước tính — cần thợ điện nước xác nhận\]\n?/g, '');
  }
  if (cleanText.includes('[Chế độ tra cứu cơ bản (chưa có AI)]')) {
    labels.push({ text: 'Chế độ tra cứu cơ bản (chưa có AI)', type: 'basic' });
    cleanText = cleanText.replace(/\[Chế độ tra cứu cơ bản \(chưa có AI\)\]\n?/g, '');
  }

  cleanText = cleanText.trim();

  // Render markdown lines (tables, bullets, bold, formulas)
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];

    const flushTable = (keyPrefix: string) => {
      if (tableBuffer.length === 0) return;
      const rows = tableBuffer
        .filter((row) => row.trim().startsWith('|') && !row.includes('---'))
        .map((row) =>
          row
            .split('|')
            .map((c) => c.trim())
            .filter((c, idx, arr) => idx > 0 && idx < arr.length)
        );

      if (rows.length > 0) {
        elements.push(
          <div key={`${keyPrefix}-table`} className="my-2.5 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold">
                <tr>
                  {rows[0].map((header, colIdx) => (
                    <th key={colIdx} className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.slice(1).map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-3 py-2 text-slate-600 dark:text-slate-300">
                        {renderInlineFormatting(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableBuffer = [];
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|')) {
        tableBuffer.push(trimmed);
        return;
      }
      flushTable(`line-${idx}`);

      if (trimmed === '') {
        elements.push(<div key={`spacer-${idx}`} className="h-1.5" />);
        return;
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={`h3-${idx}`} className="font-bold text-sm text-slate-900 dark:text-white mt-2 mb-1">
            {renderInlineFormatting(trimmed.slice(4))}
          </h4>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h3 key={`h2-${idx}`} className="font-bold text-base text-slate-900 dark:text-white mt-2.5 mb-1.5">
            {renderInlineFormatting(trimmed.slice(3))}
          </h3>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <div key={`bullet-${idx}`} className="flex items-start gap-2 text-xs leading-relaxed my-0.5">
            <span className="text-blue-500 font-bold mt-0.5">•</span>
            <div className="flex-1">{renderInlineFormatting(trimmed.slice(2))}</div>
          </div>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        const numMatch = trimmed.match(/^(\d+\.)\s(.*)$/);
        elements.push(
          <div key={`num-${idx}`} className="flex items-start gap-2 text-xs leading-relaxed my-0.5">
            <span className="font-semibold text-blue-500">{numMatch ? numMatch[1] : '•'}</span>
            <div className="flex-1">{renderInlineFormatting(numMatch ? numMatch[2] : trimmed)}</div>
          </div>
        );
      } else {
        elements.push(
          <p key={`p-${idx}`} className="text-xs leading-relaxed my-1">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      }
    });

    flushTable('end');
    return elements;
  };

  const renderInlineFormatting = (text: string) => {
    // Bold: **text**
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded text-[11px] font-mono font-medium">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[88%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* User / Bot Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-tl-none'
          }`}
        >
          {/* Badges for Bot message */}
          {!isUser && labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              {labels.map((lb, idx) => {
                if (lb.type === 'db') {
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    >
                      <Database className="w-3 h-3 text-emerald-500" />
                      {lb.text}
                    </span>
                  );
                }
                if (lb.type === 'calc') {
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      {lb.text}
                    </span>
                  );
                }
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    <Info className="w-3 h-3 text-blue-500" />
                    {lb.text}
                  </span>
                );
              })}
            </div>
          )}

          {/* Body Content */}
          <div className="space-y-1">{renderFormattedText(cleanText)}</div>
        </div>

        {/* Product Cards Grid if Bot message has products */}
        {!isUser && message.products && message.products.length > 0 && (
          <div className="mt-3 w-full space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 px-1">
              <Package className="w-3.5 h-3.5 text-blue-500" />
              Sản phẩm đề xuất trong kho ({message.products.length}):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
              {message.products.map((prod) => {
                const isAdded = !!addedSkuMap[prod.sku];
                return (
                  <div
                    key={prod.sku}
                    className="flex flex-col justify-between p-3 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="flex gap-2.5 items-start">
                      <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                        <img
                          src={prod.image || '/images/products/day-cap-don-1.jpg'}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            {prod.brand}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                            {prod.sku}
                          </span>
                        </div>
                        <h5 className="font-semibold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                          {prod.name}
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">Đơn vị: {prod.unit || 'Cái'}</p>
                      </div>
                    </div>

                    {/* Price and Add button */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                            {Math.round(prod.finalPrice).toLocaleString('vi-VN')} ₫
                          </span>
                          {prod.discountRate > 0 && (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1 rounded">
                              -{prod.discountRate}%
                            </span>
                          )}
                        </div>
                        {prod.discountRate > 0 && (
                          <div className="text-[9px] text-slate-400 line-through">
                            {prod.priceStr || `${Math.round(prod.basePrice).toLocaleString('vi-VN')} ₫`}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(prod)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:scale-95'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã thêm</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Thêm vào giỏ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-slate-400 mt-1 px-1">
          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
      </div>
    </div>
  );
}
