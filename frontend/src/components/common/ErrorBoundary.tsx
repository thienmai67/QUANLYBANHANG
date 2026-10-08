'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  renderFallback?: (error: Error, reset: () => void) => ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.renderFallback && this.state.error) {
        return this.props.renderFallback(this.state.error, this.resetErrorBoundary);
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 my-6 mx-auto max-w-xl rounded-3xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 shadow-lg text-rose-900 dark:text-rose-100 backdrop-blur-sm animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold tracking-tight text-rose-950 dark:text-rose-200">
                Đã xảy ra sự cố không mong muốn
              </h3>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300/90 leading-relaxed">
                Hệ thống gặp lỗi khi hiển thị thành phần này. Dữ liệu của bạn không bị ảnh hưởng.
              </p>

              {this.state.error && (
                <div className="mt-3 p-2.5 rounded-xl bg-black/5 dark:bg-black/30 font-mono text-[11px] text-rose-800 dark:text-rose-300 break-words overflow-x-auto max-h-24">
                  {this.state.error.message || String(this.state.error)}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={this.resetErrorBoundary}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md shadow-rose-600/20"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Thử lại
                </button>

                <button
                  type="button"
                  onClick={this.handleReload}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Tải lại trang
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
