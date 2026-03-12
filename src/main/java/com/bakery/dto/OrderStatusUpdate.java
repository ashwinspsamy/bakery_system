package com.bakery.dto;

import com.bakery.model.OrderStatus;
import lombok.Data;

@Data
public class OrderStatusUpdate {
    private OrderStatus status;
}
