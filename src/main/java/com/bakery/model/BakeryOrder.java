package com.bakery.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
public class BakeryOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String tableNumber;
    private LocalDateTime orderTime;
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    private String customerName;
    private String department;
    private String customerYear;
    private double totalPrice;
    private String paymentMethod;
    @Column(unique = true)
    private String screenshotHash;
    @Column(unique = true)
    private String upiReferenceId;
    @Column(unique = true)
    private String customOrderId;

    @OneToMany(mappedBy = "bakeryOrder", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<OrderItem> items = new ArrayList<>();
}
