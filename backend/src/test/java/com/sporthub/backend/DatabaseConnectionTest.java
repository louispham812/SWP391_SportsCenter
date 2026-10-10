package com.sporthub.backend;

import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class DatabaseConnectionTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MembershipPackageRepository packageRepository;

    @Test
    @DisplayName("Kiểm tra kết nối trực tiếp tới SQL Server qua DataSource")
    void testDataSourceConnection() throws Exception {
        assertNotNull(dataSource, "DataSource không được null");

        try (Connection connection = dataSource.getConnection()) {
            assertNotNull(connection, "Connection không được null");
            assertFalse(connection.isClosed(), "Kết nối phải đang mở");

            DatabaseMetaData metaData = connection.getMetaData();
            System.out.println("========== THÔNG TIN KẾT NỐI DATABASE ==========");
            System.out.println("Database Product Name: " + metaData.getDatabaseProductName());
            System.out.println("Database Product Version: " + metaData.getDatabaseProductVersion());
            System.out.println("Database URL: " + metaData.getURL());
            System.out.println("Database User: " + metaData.getUserName());
            System.out.println("Current Catalog/Database: " + connection.getCatalog());
            System.out.println("================================================");

            assertEquals("SportsCenterDB", connection.getCatalog(), "Tên database phải là SportsCenterDB");

            // Test truy vấn raw SQL
            try (Statement stmt = connection.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT COUNT(*) AS total_tables FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'")) {
                assertTrue(rs.next());
                int tableCount = rs.getInt("total_tables");
                System.out.println("Tổng số bảng trong database: " + tableCount);
                assertTrue(tableCount > 0, "Database phải có ít nhất 1 bảng");
            }
        }
    }

    @Test
    @DisplayName("Kiểm tra truy vấn JPA Repository trên bảng users")
    void testUserRepositoryQuery() {
        List<User> users = userRepository.findAll();
        assertNotNull(users, "Danh sách users không được null");
        System.out.println("========== DANH SÁCH USER TRONG DATABASE ==========");
        System.out.println("Tổng số user tìm thấy: " + users.size());
        for (User u : users) {
            System.out.println("ID: " + u.getUserId() + " | Email: " + u.getEmail() + " | Tên: " + u.getFullName() + " | Role: " + u.getRole() + " | Status: " + u.getStatus());
        }
        System.out.println("====================================================");
        assertFalse(users.isEmpty(), "Bảng users phải có dữ liệu");
    }

    @Test
    @DisplayName("Kiểm tra truy vấn JPA Repository trên bảng membership_packages")
    void testPackageRepositoryQuery() {
        List<MembershipPackage> packages = packageRepository.findAll();
        assertNotNull(packages, "Danh sách gói tập không được null");
        System.out.println("========== DANH SÁCH GÓI TẬP TRONG DATABASE ==========");
        System.out.println("Tổng số gói tập tìm thấy: " + packages.size());
        for (MembershipPackage p : packages) {
            System.out.println("ID: " + p.getPackageId() + " | Tên: " + p.getName() + " | Giá: " + p.getPrice() + " | Trạng thái: " + p.getStatus());
        }
        System.out.println("======================================================");
    }
}
