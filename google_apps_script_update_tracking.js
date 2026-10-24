/**
 * Google Apps Script - Cập nhật tab "PROGRESS TRACKING" (Chuẩn theo Git & V2, 100% Hoàn thành)
 * Đồ án SWP391 Team 3 - Sports Center Management System
 * Hướng dẫn: Mở Tiện ích mở rộng (Extensions) -> Apps Script -> Dán code và bấm "Chạy" (Run)
 */
function updateProgressTrackingTab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Tìm tab PROGRESS TRACKING (hoặc tìm tab chứa chữ PROGRESS TRACKING)
  var sheet = ss.getSheetByName("PROGRESS TRACKING");
  if (!sheet) {
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName().toUpperCase().includes("PROGRESS TRACKING")) {
        sheet = sheets[i];
        break;
      }
    }
  }

  if (!sheet) {
    SpreadsheetApp.getUi().alert("Không tìm thấy tab 'PROGRESS TRACKING' trong trang tính!");
    return;
  }

  // 1. Dữ liệu chuẩn hóa 94 chức năng: [Độ phức tạp, In charge (FE/BE theo Git), Status]
  var auditData = [
  [
    "Medium",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa, Tô Trọng Tuấn",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Phạm Minh Hoàng / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng, Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều / BE: Tô Trọng Tuấn, Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều / BE: Tô Trọng Tuấn, Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Phạm Minh Hoàng, Võ Tấn Triều / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều / BE: Tô Trọng Tuấn, Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Nguyễn Anh Khoa, Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Nguyễn Anh Khoa, Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Phạm Minh Hoàng / BE: Tô Trọng Tuấn",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng, Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng, Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng, Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Phạm Minh Hoàng / BE: Tô Trọng Tuấn",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Tô Trọng Tuấn, Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Phạm Minh Hoàng / BE: Tô Trọng Tuấn",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Tô Trọng Tuấn",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều / BE: Tô Trọng Tuấn, Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Võ Tấn Triều / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Võ Tấn Triều / BE: Phạm Minh Hoàng, Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Tô Trọng Tuấn, Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa, Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Nguyễn Anh Khoa, Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Võ Tấn Triều, Phạm Minh Hoàng / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Simple",
    "FE: Võ Tấn Triều / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Tô Trọng Tuấn, Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Phạm Minh Hoàng / BE: Nguyễn Anh Khoa, Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Nguyễn Anh Khoa, Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Medium",
    "FE: Phạm Minh Hoàng / BE: Nguyễn Anh Khoa, Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Phạm Minh Hoàng / BE: Nguyễn Anh Khoa",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ],
  [
    "Complex",
    "FE: Phạm Minh Hoàng / BE: Phạm Minh Hoàng",
    "Đã xong"
  ]
];

  // 2. Điền tiêu đề cột H, I, J nếu chưa có
  sheet.getRange("H1:J1").setValues([["Độ phức tạp", "In charge", "Status"]]);

  // 3. Ghi dữ liệu vào cột H (cột 8), I (cột 9), J (cột 10) từ dòng 2 đến dòng 95
  sheet.getRange(2, 8, auditData.length, 3).setValues(auditData);

  // 4. Cài đặt độ rộng các cột chuẩn đẹp, dễ đọc
  sheet.setColumnWidth(1, 85);   // Mã chức năng
  sheet.setColumnWidth(2, 130);  // Vai trò
  sheet.setColumnWidth(3, 190);  // Luồng nghiệp vụ
  sheet.setColumnWidth(4, 180);  // Phân hệ
  sheet.setColumnWidth(5, 230);  // Tên chức năng
  sheet.setColumnWidth(6, 420);  // Mô tả nghiệp vụ
  sheet.setColumnWidth(7, 90);   // Tính chất
  sheet.setColumnWidth(8, 110);  // Độ phức tạp
  sheet.setColumnWidth(9, 360);  // In charge (FE / BE)
  sheet.setColumnWidth(10, 95);  // Status

  // 5. Định dạng dòng Tiêu đề (Header Row 1)
  var header = sheet.getRange("A1:J1");
  header.setBackground("#1E293B"); // Màu Slate 800 sang trọng
  header.setFontColor("#FFFFFF");
  header.setFontSize(10.5);
  header.setFontWeight("bold");
  header.setHorizontalAlignment("center");
  header.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1); // Cố định dòng 1 khi cuộn chuột

  // 6. Định dạng toàn bộ 94 dòng dữ liệu
  var totalRows = auditData.length;
  var allDataRange = sheet.getRange(2, 1, totalRows, 10);
  allDataRange.setFontFamily("Arial");
  allDataRange.setFontSize(9.5);
  allDataRange.setVerticalAlignment("middle");
  allDataRange.setBorder(true, true, true, true, true, true, "#CBD5E1", SpreadsheetApp.BorderStyle.SOLID);

  // Bật ngắt dòng (Wrap text) cho các cột nội dung dài
  sheet.getRange(2, 4, totalRows, 3).setWrap(true);
  sheet.getRange(2, 9, totalRows, 1).setWrap(true);

  // Căn lề từng cột
  sheet.getRange(2, 1, totalRows, 1).setHorizontalAlignment("center").setFontWeight("bold").setFontColor("#2563EB");
  sheet.getRange(2, 2, totalRows, 2).setHorizontalAlignment("center");
  sheet.getRange(2, 4, totalRows, 2).setHorizontalAlignment("left");
  sheet.getRange(2, 6, totalRows, 1).setHorizontalAlignment("left").setFontColor("#334155");
  sheet.getRange(2, 7, totalRows, 2).setHorizontalAlignment("center");
  sheet.getRange(2, 9, totalRows, 1).setHorizontalAlignment("left");
  sheet.getRange(2, 10, totalRows, 1).setHorizontalAlignment("center");

  // 7. Tô màu xen kẽ và gắn Badge màu cho Độ phức tạp & Trạng thái
  for (var i = 0; i < totalRows; i++) {
    var r = 2 + i;
    sheet.setRowHeight(r, 40);
    var bg = (r % 2 === 0) ? "#FFFFFF" : "#F8FAFC"; // Màu nền xen kẽ (Zebra)
    sheet.getRange(r, 1, 1, 10).setBackground(bg);

    // Badge Độ phức tạp (Cột H)
    var comp = auditData[i][0];
    var compCell = sheet.getRange(r, 8);
    if (comp === "Complex") {
      compCell.setBackground("#FFE4E6").setFontColor("#BE123C").setFontWeight("bold");
    } else if (comp === "Medium") {
      compCell.setBackground("#FEF9C3").setFontColor("#A16207").setFontWeight("bold");
    } else if (comp === "Simple") {
      compCell.setBackground("#E0F2FE").setFontColor("#0369A1").setFontWeight("bold");
    }

    // Badge Trạng thái Đã xong (Cột J) - Màu xanh lá thành công
    var statCell = sheet.getRange(r, 10);
    statCell.setBackground("#DCFCE7").setFontColor("#15803D").setFontWeight("bold");

    // Định dạng cột In charge
    sheet.getRange(r, 9).setFontStyle("normal").setFontColor("#0F172A");
  }

  // 8. Thông báo thành công
  ss.toast("Đã cập nhật thành công 94/94 chức năng (100% Đã xong) kèm Người phụ trách!", "Hoàn tất", 5);
}
