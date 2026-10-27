/**
 * Utility xuất dữ liệu bảng sang định dạng CSV (hỗ trợ tiếng Việt UTF-8 BOM cho Excel)
 */
export function exportToCsv(filename, rows) {
  const processRow = (row) =>
    row
      .map((val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',');

  // Thêm ký tự BOM (\uFEFF) để Microsoft Excel nhận diện chuẩn UTF-8 tiếng Việt
  const csvContent = '\uFEFF' + rows.map(processRow).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
