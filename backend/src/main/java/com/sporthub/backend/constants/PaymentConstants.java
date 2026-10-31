package com.sporthub.backend.constants;

/**
 * Payment constants để centralize magic strings
 * Giữ backward compatible với code hiện tại
 */
public final class PaymentConstants {
    
    // Payment Methods
    public static final String METHOD_VIETQR = "VIETQR";
    public static final String METHOD_QR = "QR"; // Alias
    public static final String METHOD_CASH_COUNTER = "CASH_COUNTER";
    public static final String METHOD_CASH = "CASH"; // Alias
    
    // Payment Status (PaymentTransaction)
    public static final String PAYMENT_STATUS_PENDING = "PENDING";
    public static final String PAYMENT_STATUS_PAID = "PAID";
    public static final String PAYMENT_STATUS_FAILED = "FAILED";
    public static final String PAYMENT_STATUS_REFUNDED = "REFUNDED";
    
    // Booking Status
    public static final String BOOKING_STATUS_PENDING = "PENDING";
    public static final String BOOKING_STATUS_BOOKED = "BOOKED";
    public static final String BOOKING_STATUS_CONFIRMED = "CONFIRMED";
    public static final String BOOKING_STATUS_CANCELLED = "CANCELLED";
    
    // Booking Types
    public static final String BOOKING_TYPE_CLASS = "CLASS";
    public static final String BOOKING_TYPE_COURT = "COURT";
    public static final String BOOKING_TYPE_MEMBERSHIP = "MEMBERSHIP_PACKAGE";
    
    // Membership Status
    public static final String MEMBERSHIP_STATUS_PENDING_APPROVAL = "PENDING_APPROVAL";
    public static final String MEMBERSHIP_STATUS_ACTIVE = "ACTIVE";
    public static final String MEMBERSHIP_STATUS_EXPIRED = "EXPIRED";
    public static final String MEMBERSHIP_STATUS_CANCELLED = "CANCELLED";
    
    private PaymentConstants() {
        // Prevent instantiation
    }
}
