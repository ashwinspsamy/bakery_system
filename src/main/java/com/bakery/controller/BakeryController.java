package com.bakery.controller;

import com.bakery.dto.OrderItemRequest;
import com.bakery.dto.OrderRequest;
import com.bakery.dto.OrderStatusUpdate;
import com.bakery.model.BakeryOrder;
import com.bakery.model.MenuItem;
import com.bakery.model.OrderItem;
import com.bakery.model.OrderStatus;
import com.bakery.model.UpiSettings;
import com.bakery.repository.MenuItemRepository;
import com.bakery.repository.OrderRepository;
import com.bakery.repository.UpiSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.lang.NonNull;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Allow any origin for simple development
public class BakeryController {

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UpiSettingsRepository upiRepository;

    @GetMapping("/menu")
    public List<MenuItem> getMenu() {
        return menuItemRepository.findAll();
    }

    @PostMapping("/menu")
    public MenuItem addMenuItem(@NonNull @RequestBody MenuItem menuItem) {
        return menuItemRepository.save(menuItem);
    }

    @PutMapping("/menu/{id}")
    public ResponseEntity<MenuItem> updateMenuItem(@NonNull @PathVariable(name = "id") Long id, @RequestBody MenuItem updatedItem) {
        return menuItemRepository.findById(id).map(item -> {
            item.setName(updatedItem.getName());
            item.setDescription(updatedItem.getDescription());
            item.setPrice(updatedItem.getPrice());
            item.setImageUrl(updatedItem.getImageUrl());
            item.setCategory(updatedItem.getCategory());
            item.setAvailable(updatedItem.isAvailable());
            return ResponseEntity.ok(menuItemRepository.save(item));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/menu/{id}")
    public ResponseEntity<Void> deleteMenuItem(@NonNull @PathVariable(name = "id") Long id) {
        if (menuItemRepository.existsById(id)) {
            menuItemRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/orders")
    public ResponseEntity<?> placeOrder(@RequestBody OrderRequest orderRequest) {
        // ── Server-side Screenshot Security Checks (UPI only) ────────────────────────
        if ("STORE_QR".equals(orderRequest.getPaymentMethod())) {

            // 1. Reject if screenshot hash is already used in a prior order
            if (orderRequest.getScreenshotHash() != null && !orderRequest.getScreenshotHash().isBlank()) {
                boolean hashExists = orderRepository.existsByScreenshotHash(orderRequest.getScreenshotHash());
                if (hashExists) {
                    return ResponseEntity.badRequest().body(
                        java.util.Map.of("error", "DUPLICATE_SCREENSHOT",
                            "message", "This payment screenshot has already been used for a previous order. Please take a new screenshot."));
                }
            }

            // 2. Validate screenshot timestamp from EXIF is within 10 minutes
            if (orderRequest.getScreenshotTimestamp() != null && !orderRequest.getScreenshotTimestamp().isBlank()) {
                try {
                    Instant screenshotTime = Instant.parse(orderRequest.getScreenshotTimestamp());
                    long ageMinutes = Duration.between(screenshotTime, Instant.now()).toMinutes();
                    if (ageMinutes > 10 || ageMinutes < -1) { // allow 1 min clock skew
                        return ResponseEntity.badRequest().body(
                            java.util.Map.of("error", "SCREENSHOT_TOO_OLD",
                                "message", "Payment screenshot is too old (" + ageMinutes + " minutes). Please take a fresh screenshot within 10 minutes of payment."));
                    }
                } catch (Exception e) {
                    // If we can't parse the timestamp, log and continue (frontend validated already)
                    System.err.println("Could not parse screenshotTimestamp: " + orderRequest.getScreenshotTimestamp());
                }
            }
        }
        // ─────────────────────────────────────────────────────────────────────────────

        BakeryOrder order = new BakeryOrder();
        order.setTableNumber(orderRequest.getTableNumber());
        order.setCustomerName(orderRequest.getCustomerName());
        order.setDepartment(orderRequest.getDepartment());
        order.setCustomerYear(orderRequest.getCustomerYear());
        order.setPaymentMethod(orderRequest.getPaymentMethod());
        order.setOrderTime(LocalDateTime.now());
        order.setStatus(OrderStatus.PAYMENT_PENDING);

        // Store the screenshot hash for future duplicate detection
        if (orderRequest.getScreenshotHash() != null && !orderRequest.getScreenshotHash().isBlank()) {
            order.setScreenshotHash(orderRequest.getScreenshotHash());
        }

        double total = 0;
        for (OrderItemRequest itemReq : orderRequest.getItems()) {
            Long queryId = itemReq.getMenuItemId();
            @SuppressWarnings("null")
            MenuItem menuItem = menuItemRepository.findById(queryId)
                    .orElseThrow(() -> new RuntimeException("Menu item not found"));

            OrderItem orderItem = new OrderItem();
            orderItem.setBakeryOrder(order);
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setPrice(menuItem.getPrice());

            total += (menuItem.getPrice() * itemReq.getQuantity());
            order.getItems().add(orderItem);
        }

        order.setTotalPrice(total);
        return ResponseEntity.ok(orderRepository.save(order));
    }

    @GetMapping("/orders")
    public List<BakeryOrder> getAllOrders() {
        return orderRepository.findAll();
    }

    @GetMapping("/orders/table/{tableNumber}")
    public List<BakeryOrder> getOrdersByTable(@PathVariable(name = "tableNumber") String tableNumber) {
        return orderRepository.findByTableNumberOrderByOrderTimeDesc(tableNumber);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<BakeryOrder> updateOrderStatus(
            @NonNull @PathVariable(name = "id") Long id,
            @RequestBody OrderStatusUpdate statusUpdate) {

        return orderRepository.findById(id).map(order -> {
            order.setStatus(statusUpdate.getStatus());
            BakeryOrder saved = orderRepository.save(order);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/orders/{id}/confirm-payment")
    public ResponseEntity<BakeryOrder> confirmPayment(@NonNull @PathVariable(name = "id") Long id) {
        return orderRepository.findById(id).map(order -> {
            if (order.getStatus() == OrderStatus.PAYMENT_PENDING) {
                order.setStatus(OrderStatus.PENDING);
                BakeryOrder saved = orderRepository.save(order);
                return ResponseEntity.ok(saved);
            }
            return ResponseEntity.ok(order);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/settings/upi")
    public ResponseEntity<UpiSettings> getUpiSettings() {
        return upiRepository.findFirstByOrderByIdAsc()
                .map(s -> ResponseEntity.ok(s))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/settings/upi")
    public ResponseEntity<UpiSettings> updateUpiSettings(@RequestBody UpiSettings updatedSettings) {
        return upiRepository.findFirstByOrderByIdAsc()
                .map(settings -> {
                    settings.setUpiId(updatedSettings.getUpiId());
                    settings.setRecipientName(updatedSettings.getRecipientName());
                    settings.setMerchantName(updatedSettings.getMerchantName());
                    UpiSettings saved = upiRepository.save(settings);
                    return ResponseEntity.<UpiSettings>ok(saved);
                })
                .orElseGet(() -> ResponseEntity.ok(upiRepository.save(updatedSettings)));
    }
}
