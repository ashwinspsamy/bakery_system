package com.bakery.dto;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequest {
    private String tableNumber;
    private String customerName;
    private String department;
    private String customerYear;
    private List<OrderItemRequest> items;
    private String paymentMethod;
    /** SHA-256 hex hash of the uploaded payment screenshot (for duplicate detection) */
    private String screenshotHash;
    /** ISO-8601 timestamp extracted from screenshot EXIF (for recency check) */
    private String screenshotTimestamp;
}
