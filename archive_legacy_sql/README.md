# Kho Lưu Trữ Các Bản SQL Cũ (Legacy Database Scripts)

Các tệp SQL trong thư mục này là các phiên bản cũ / di chuyển trung gian trước đây (`databaseSWP391.sql`, `SportsCenterDB_Database.sql`, `CONSOLIDATED_MIGRATION.sql`, `fix_font_encoding.sql`), được lưu trữ lại để phục vụ đối chiếu lịch sử khi cần thiết.

> **QUY CHUẨN DUY NHẤT (Single Source of Truth)**:
> - Tệp database chuẩn hóa duy nhất của toàn bộ hệ thống là: `[DATABASEchuan.sql](file:///C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/DATABASEchuan.sql)` (tại thư mục gốc dự án).
> - Đã được chuẩn hóa UTF-8 without BOM, nạp đầy đủ 31 bảng và 10 môn thể thao, 21 cơ sở đồng bộ chuẩn với backend Spring Boot.
