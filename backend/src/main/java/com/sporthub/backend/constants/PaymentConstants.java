package com.sporthub.backend.constants;

/**
 * Payment constants để centralize magic strings
 * Giữ backward compatible với code hiện tại
 */
public final class PaymentConstants {
    
    // Payment Methods
    public static final String METHOD_VNPAY = "VNPAY";
    public static final String METHOD_CASH_COUNTER = "CASH_COUNTER";
    public static final String METHOD_MEMBERSHIP_QUOTA = "MEMBERSHIP_QUOTA"; // For quota bookings (0đ)
    
    // Payment Status (PaymentTransaction)
    public static final String PAYMENT_STATUS_PENDING = "PENDING";
    public static final String PAYMENT_STATUS_PAID = "PAID";
    public static final String PAYMENT_STATUS_REFUNDED = "REFUNDED";
    
    // Booking Types
    public static final String BOOKING_TYPE_CLASS = "CLASS";
    public static final String BOOKING_TYPE_COURT = "COURT";
    public static final String BOOKING_TYPE_MEMBERSHIP = "MEMBERSHIP_PACKAGE";
    
    private PaymentConstants() {
        // Prevent instantiation
    }
}
