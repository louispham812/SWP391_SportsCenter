package com.sporthub.backend.repository;

import com.sporthub.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByEmailIgnoreCase(String email);

    @Query("""
            select user from User user
            where upper(trim(user.status)) = 'PENDING'
              and upper(trim(user.role)) in :roles
            order by user.createdAt asc
            """)
    List<User> findPendingStaffRegistrations(@Param("roles") List<String> roles);

    @Query("""
            select user from User user
            where upper(user.role) = 'MEMBER'
              and (:query is null or :query = ''
                   or lower(user.fullName) like lower(concat('%', :query, '%'))
                   or lower(user.email) like lower(concat('%', :query, '%'))
                   or user.phone like concat('%', :query, '%')
                   or cast(user.userId as string) like concat('%', :query, '%'))
            order by user.userId desc
            """)
    Page<User> searchMembers(@Param("query") String query, Pageable pageable);

    long countByRoleIgnoreCaseAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            String role, java.time.LocalDateTime start, java.time.LocalDateTime end);
}