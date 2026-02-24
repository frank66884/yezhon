/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Calculator, RotateCcw, ChevronDown, ChevronUp, Clock as ClockIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}年${m}月${d}日 ${h}:${min}`;
  };

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">
      <ClockIcon className="w-3 h-3" />
      <span>{formatDate(time)}</span>
    </div>
  );
};

interface Row {
  id: string;
  totalWeight: string;
  tareWeight: string;
  unitPrice: string;
}

export default function App() {
  const [rows, setRows] = useState<Row[]>([
    { id: crypto.randomUUID(), totalWeight: '', tareWeight: '', unitPrice: '' }
  ]);
  const [shouldFocusNewRow, setShouldFocusNewRow] = useState(false);

  // Cumulative stats
  const [cumulativeNetWeight, setCumulativeNetWeight] = useState(0);
  const [cumulativeExpenditure, setCumulativeExpenditure] = useState(0);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);

  const addRow = () => {
    setRows([...rows, { id: crypto.randomUUID(), totalWeight: '', tareWeight: '', unitPrice: '' }]);
    setShouldFocusNewRow(true);
  };

  // Auto-focus the first input of the new row
  React.useEffect(() => {
    if (shouldFocusNewRow) {
      const inputs = document.querySelectorAll('input[type="number"]');
      const lastRowFirstInput = inputs[inputs.length - 3] as HTMLInputElement;
      if (lastRowFirstInput) {
        lastRowFirstInput.focus();
      }
      setShouldFocusNewRow(false);
    }
  }, [rows.length, shouldFocusNewRow]);

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    } else {
      // Reset the only row instead of removing it
      setRows([{ id: crypto.randomUUID(), totalWeight: '', tareWeight: '', unitPrice: '' }]);
    }
  };

  const updateRow = (id: string, field: keyof Omit<Row, 'id'>, value: string) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const resetAll = () => {
    // Calculate current session totals
    const sessionNetWeight = calculatedRows.reduce((sum, row) => sum + row.netWeight, 0);
    const sessionTotal = grandTotal;

    // Only update cumulative if there's actual data
    if (sessionNetWeight > 0 || sessionTotal > 0) {
      setCumulativeNetWeight(prev => prev + sessionNetWeight);
      setCumulativeExpenditure(prev => prev + sessionTotal);
      setDeliveryCount(prev => prev + 1);
    }

    setRows([{ id: crypto.randomUUID(), totalWeight: '', tareWeight: '', unitPrice: '' }]);
  };

  const clearCumulative = () => {
    if (confirm('确定要清除所有累计数据吗？')) {
      setCumulativeNetWeight(0);
      setCumulativeExpenditure(0);
      setDeliveryCount(0);
    }
  };

  const calculatedRows = useMemo(() => {
    let handledSixCount = 0;
    return rows.map(row => {
      const total = parseFloat(row.totalWeight) || 0;
      const tare = parseFloat(row.tareWeight) || 0;
      const price = parseFloat(row.unitPrice) || 0;
      const netWeight = Math.max(0, total - tare);
      const rawTotal = netWeight * price;
      
      const integerPart = Math.floor(rawTotal);
      const fractionalPart = Number((rawTotal - integerPart).toFixed(10));
      
      let rowTotal: number;
      if (fractionalPart >= 0.7) {
        rowTotal = integerPart + 1;
      } else if (fractionalPart < 0.6) {
        rowTotal = integerPart;
      } else {
        // 0.6 <= fractionalPart < 0.7
        handledSixCount++;
        if (handledSixCount % 2 === 0) {
          rowTotal = integerPart + 1;
        } else {
          rowTotal = integerPart;
        }
      }
      
      return { ...row, netWeight, rowTotal };
    });
  }, [rows]);

  const grandTotal = useMemo(() => {
    return calculatedRows.reduce((sum, row) => sum + row.rowTotal, 0);
  }, [calculatedRows]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, fieldIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputs = document.querySelectorAll('input[type="number"]');
      const currentIndex = rowIndex * 3 + fieldIndex;
      const nextInput = inputs[currentIndex + 1] as HTMLInputElement;
      
      if (nextInput) {
        nextInput.focus();
      } else {
        addRow();
      }
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <header className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Calculator className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">计算清单</h1>
          </div>
          <div className="flex items-center gap-3">
            <Clock />
            <button
              onClick={resetAll}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-all shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置全部
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 text-white rounded-2xl p-3 shadow-2xl flex flex-col items-center justify-center gap-0.5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(79,70,229,0.4)_0%,transparent_70%)]" />
          </div>
          
          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] relative z-10">总计金额</p>
          <div className="text-4xl font-black tracking-tighter font-mono relative z-10 flex items-baseline">
            <span className="text-indigo-400 mr-1.5 text-xl">¥</span>
            {grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-full backdrop-blur-sm relative z-10 mt-0.5">
            <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">共 {rows.length} 条记录</p>
          </div>
        </motion.div>

        {/* Cumulative Stats Section */}
        <div className="space-y-2">
          <button 
            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-100 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <span className="text-[9px] font-bold uppercase tracking-wider">累计统计数据</span>
            {isStatsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          
          <AnimatePresence>
            {isStatsExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-3 gap-3 pt-1 pb-2">
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">累计人数</p>
                    <p className="text-xl font-black text-slate-800 font-mono">{deliveryCount}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">累计净重</p>
                    <p className="text-xl font-black text-slate-800 font-mono">{cumulativeNetWeight.toFixed(2)}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center relative group">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">累计支出</p>
                    <p className="text-xl font-black text-indigo-600 font-mono">¥{cumulativeExpenditure.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <button 
                      onClick={clearCumulative}
                      className="absolute -top-2 -right-2 bg-red-50 text-red-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-red-100"
                      title="清除累计"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="space-y-3">
        <AnimatePresence mode="popLayout">
          {rows.map((row, index) => {
            const calc = calculatedRows[index];
            return (
              <motion.div
                key={row.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl p-2 shadow-sm border border-slate-200 flex flex-col md:grid md:grid-cols-12 gap-3 items-center group"
              >
                <div className="grid grid-cols-3 gap-2 w-full md:col-span-9">
                  <input
                    type="number"
                    placeholder="总重"
                    value={row.totalWeight}
                    onChange={(e) => updateRow(row.id, 'totalWeight', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index, 0)}
                    className="w-full bg-slate-50 border-none rounded-lg px-2 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
                  />
                  <input
                    type="number"
                    placeholder="皮重"
                    value={row.tareWeight}
                    onChange={(e) => updateRow(row.id, 'tareWeight', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index, 1)}
                    className="w-full bg-slate-50 border-none rounded-lg px-2 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
                  />
                  <input
                    type="number"
                    placeholder="单价"
                    value={row.unitPrice}
                    onChange={(e) => updateRow(row.id, 'unitPrice', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index, 2)}
                    className="w-full bg-slate-50 border-none rounded-lg px-2 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
                  />
                </div>
                <div className="flex items-center justify-between w-full md:col-span-3 md:justify-end gap-3 border-t border-slate-100 pt-2 md:border-none md:pt-0">
                  <div className="text-right">
                    <div className="text-base font-bold text-indigo-600 font-mono leading-none">
                      ¥{calc.rowTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                      净重: {calc.netWeight.toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeRow(row.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="删除行"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <button
          onClick={addRow}
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 group"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">添加新行</span>
        </button>
      </main>
    </div>
  );
}
