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
}
