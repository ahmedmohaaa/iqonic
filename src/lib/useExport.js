// src/lib/useExport.js
import { useState, useCallback } from 'react';

export const EXPORT_STATUS = {
  IDLE: 'idle', PREPARING: 'preparing', RENDERING: 'rendering', DONE: 'done', ERROR: 'error',
};

// تحويل الصفوف + الأعمدة إلى مصفوفة مصفوفات (رأس + جسم)
function toMatrix(rows, columns) {
  const head = columns.map((c) => c.label);
  const body = rows.map((r) =>
    columns.map((c) => {
      let v = c.get ? c.get(r) : c.key != null ? r[c.key] : '';
      if (v === null || v === undefined) v = '';
      if (typeof v === 'boolean') v = v ? 'نعم' : 'لا';
      return String(v);
    })
  );
  return [head, ...body];
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const colValue = (c, r) => {
  let v = c.get ? c.get(r) : c.key != null ? r[c.key] : '';
  if (v === null || v === undefined) v = '';
  if (typeof v === 'boolean') v = v ? 'نعم' : 'لا';
  return String(v);
};

export function useExport() {
  const [status, setStatus] = useState(EXPORT_STATUS.IDLE);
  const [progress, setProgress] = useState(0);
  const [lastFormat, setLastFormat] = useState(null);

  const run = useCallback(async (format, fn) => {
    setLastFormat(format);
    setStatus(EXPORT_STATUS.PREPARING);
    setProgress(10);
    try {
      await new Promise((r) => setTimeout(r, 140)); // إحساس «تجهيز»
      setStatus(EXPORT_STATUS.RENDERING);
      setProgress(50);
      await fn();
      setProgress(100);
      setStatus(EXPORT_STATUS.DONE);
      setTimeout(() => { setStatus(EXPORT_STATUS.IDLE); setProgress(0); }, 1500);
    } catch (e) {
      console.error('[export]', e);
      setStatus(EXPORT_STATUS.ERROR);
      setTimeout(() => setStatus(EXPORT_STATUS.IDLE), 2600);
    }
  }, []);

  const exportCSV = useCallback(
    (rows, columns, filename) =>
      run('csv', async () => {
        const matrix = toMatrix(rows, columns);
        const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
        const csv = matrix.map((r) => r.map(esc).join(',')).join('\n');
        downloadBlob(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }), filename + '.csv');
      }),
    [run]
  );

  const exportJSON = useCallback(
    (rows, filename) =>
      run('json', async () => {
        downloadBlob(new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }), filename + '.json');
      }),
    [run]
  );

  const exportXLSX = useCallback(
    (rows, columns, filename) =>
      run('xlsx', async () => {
        const XLSX = await import('xlsx');
        const matrix = toMatrix(rows, columns);
        const ws = XLSX.utils.aoa_to_sheet(matrix);
        ws['!cols'] = columns.map((c) => ({ wch: c.width || 18 }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        downloadBlob(new Blob([out], { type: 'application/octet-stream' }), filename + '.xlsx');
      }),
    [run]
  );

  const exportPDF = useCallback(
    (rows, columns, filename, title) =>
      run('pdf', async () => {
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
          import('jspdf'),
          import('jspdf-autotable'),
        ]);
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        doc.setFontSize(15);
        doc.setTextColor(15, 23, 42);
        doc.text(title || filename, 40, 38);
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text('Generated ' + new Date().toLocaleString(), 40, 54);
        autoTable(doc, {
          head: [columns.map((c) => c.label)],
          body: rows.map((r) => columns.map((c) => colValue(c, r))),
          startY: 66,
          styles: { fontSize: 8, cellPadding: 4 },
          headStyles: { fillColor: [15, 23, 42], textColor: 255 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: 40, right: 40 },
        });
        doc.save(filename + '.pdf');
      }),
    [run]
  );

  return { status, progress, lastFormat, exportCSV, exportJSON, exportXLSX, exportPDF };
}