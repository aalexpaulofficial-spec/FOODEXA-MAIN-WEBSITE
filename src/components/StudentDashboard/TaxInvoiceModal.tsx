import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Printer, Share2, CheckCircle2, Building2, MapPin, CreditCard, Hash, QrCode, Calendar } from 'lucide-react';
import type { Order } from '../../types';
import { formatINR, formatDateTime } from '../../lib/supabase-service';

interface TaxInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  institutionName: string;
}

export const TaxInvoiceModal: React.FC<TaxInvoiceModalProps> = ({ isOpen, onClose, order, institutionName }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const orderNumber = order.order_number
    ? `#FX-${String(order.order_number).padStart(4, '0')}`
    : order.order_id || '';
  const pickupCode = order.pickup_code || order.qr_pickup_code || null;
  const tokenNumber = order.token_number || order.pickup_token || null;
  const invoiceNumber = `INV-${(order.order_number ? String(order.order_number).slice(-8) : String(order.id).slice(-8)).toUpperCase()}`;
  const paymentMethod = order.payment_method === 'razorpay' ? 'UPI / Razorpay'
    : order.payment_method === 'cash' ? 'Cash at Counter'
    : order.payment_method === 'wallet' ? 'FOODEXA Wallet'
    : order.payment_method || 'N/A';

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const convenienceFee = 0;
  const discount = order.total_amount < subtotal ? subtotal - order.total_amount : 0;
  const grandTotal = order.total_amount;

  const handleDownloadPDF = () => {
    const content = invoiceRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>FOODEXA Invoice - ${invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: 900; color: #10b981; letter-spacing: -1px; }
          .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 2px; }
          .invoice-title { font-size: 18px; font-weight: 800; margin: 20px 0 5px; }
          .invoice-number { font-size: 12px; color: #64748b; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .info-label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
          .info-value { font-size: 13px; font-weight: 700; color: #0f172a; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
          .items-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .items-table .qty { font-weight: 700; color: #334155; }
          .items-table .price { font-weight: 700; color: #0f172a; text-align: right; }
          .totals { margin-top: 20px; border-top: 2px solid #e2e8f0; padding-top: 15px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569; }
          .total-row.grand { font-size: 18px; font-weight: 900; color: #0f172a; border-top: 2px solid #10b981; padding-top: 10px; margin-top: 5px; }
          .footer { margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; }
          .footer-text { font-size: 11px; color: #94a3b8; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">FOODEXA</div>
          <div class="subtitle">Campus Food Ordering Platform</div>
        </div>
        <div class="invoice-title">TAX INVOICE</div>
        <div class="invoice-number">${invoiceNumber}</div>
        <div class="grid">
          <div class="info-box">
            <div class="info-label">Order Number</div>
            <div class="info-value">${orderNumber}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Status</div>
            <div class="info-value"><span class="status-badge">${order.status.toUpperCase()}</span></div>
          </div>
          <div class="info-box">
            <div class="info-label">Institution</div>
            <div class="info-value">${institutionName}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Canteen / Counter</div>
            <div class="info-value">${order.counter || 'N/A'}</div>
          </div>
          ${pickupCode ? `<div class="info-box"><div class="info-label">Pickup Code</div><div class="info-value">${pickupCode}</div></div>` : ''}
          ${tokenNumber ? `<div class="info-box"><div class="info-label">Token Number</div><div class="info-value">${tokenNumber}</div></div>` : ''}
          <div class="info-box">
            <div class="info-label">Payment Method</div>
            <div class="info-value">${paymentMethod}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Completion Time</div>
            <div class="info-value">${order.completed_at ? formatDateTime(order.completed_at) : formatDateTime(order.created_at)}</div>
          </div>
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Price</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td style="font-weight:600">${item.name}</td>
                <td class="qty" style="text-align:center">${item.quantity}</td>
                <td class="price" style="text-align:right">${formatINR(item.price)}</td>
                <td class="price" style="text-align:right">${formatINR(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <div class="total-row"><span>Subtotal</span><span>${formatINR(subtotal)}</span></div>
          <div class="total-row"><span>Convenience Fee</span><span>${formatINR(convenienceFee)}</span></div>
          ${discount > 0 ? `<div class="total-row" style="color:#059669"><span>Discount</span><span>-${formatINR(discount)}</span></div>` : ''}
          <div class="total-row grand"><span>Grand Total</span><span>${formatINR(grandTotal)}</span></div>
        </div>
        <div class="footer">
          <div class="footer-text">Thank you for ordering with FOODEXA!</div>
          <div class="footer-text" style="margin-top:4px">This is a computer-generated invoice.</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrint = () => {
    handleDownloadPDF();
  };

  const handleShare = async () => {
    const shareData = {
      title: `FOODEXA Invoice ${invoiceNumber}`,
      text: `Order ${orderNumber} from ${institutionName} - Total: ${formatINR(grandTotal)}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white w-full sm:max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900">Tax Invoice</h2>
            <p className="text-xs text-slate-500 font-medium">{invoiceNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Content */}
        <div className="flex-1 overflow-y-auto">
          <div ref={invoiceRef} className="px-5 py-4 space-y-5">
            {/* FOODEXA Branding */}
            <div className="text-center pb-4 border-b-2 border-emerald-500">
              <h1 className="text-3xl font-black text-emerald-600 tracking-tight">FOODEXA</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[3px] mt-1">Campus Food Ordering Platform</p>
            </div>

            {/* Invoice Header */}
            <div className="text-center">
              <h2 className="text-lg font-black text-slate-900">TAX INVOICE</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{invoiceNumber}</p>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Order Number</p>
                <p className="text-sm font-bold text-slate-900">{orderNumber}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100">
                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Status</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="flex items-center gap-1 mb-0.5">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Institution</p>
                </div>
                <p className="text-sm font-bold text-slate-900 truncate">{institutionName}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="flex items-center gap-1 mb-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Canteen</p>
                </div>
                <p className="text-sm font-bold text-slate-900 truncate">{order.counter || 'N/A'}</p>
              </div>
              {pickupCode && (
                <div className="rounded-xl bg-blue-50 p-3 border border-blue-100">
                  <div className="flex items-center gap-1 mb-0.5">
                    <QrCode className="w-3 h-3 text-blue-400" />
                    <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Pickup Code</p>
                  </div>
                  <p className="text-sm font-black text-blue-700">{pickupCode}</p>
                </div>
              )}
              {tokenNumber && (
                <div className="rounded-xl bg-amber-50 p-3 border border-amber-100">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Hash className="w-3 h-3 text-amber-400" />
                    <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Token Number</p>
                  </div>
                  <p className="text-sm font-black text-amber-700">{tokenNumber}</p>
                </div>
              )}
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="flex items-center gap-1 mb-0.5">
                  <CreditCard className="w-3 h-3 text-slate-400" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</p>
                </div>
                <p className="text-sm font-bold text-slate-900">{paymentMethod}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="flex items-center gap-1 mb-0.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Completion Time</p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {order.completed_at ? formatDateTime(order.completed_at) : formatDateTime(order.created_at)}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5">
                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-sm font-bold text-slate-700">{item.quantity}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-sm text-slate-600">{formatINR(item.price)}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-sm font-bold text-slate-900">{formatINR(item.price * item.quantity)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pricing */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Convenience Fee</span>
                <span className="font-bold text-slate-900">{formatINR(convenienceFee)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span>
                  <span className="font-bold">-{formatINR(discount)}</span>
                </div>
              )}
              <div className="border-t-2 border-slate-900 pt-2.5 flex justify-between">
                <span className="text-base font-bold text-slate-900">Grand Total</span>
                <span className="text-xl font-black text-slate-900">{formatINR(grandTotal)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-slate-200">
              <p className="text-[11px] text-slate-400 font-semibold">Thank you for ordering with FOODEXA!</p>
              <p className="text-[10px] text-slate-300 mt-0.5">This is a computer-generated invoice.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-4 border-t border-slate-100 bg-white shrink-0">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Download
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
