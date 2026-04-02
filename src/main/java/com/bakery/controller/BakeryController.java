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
import com.bakery.service.ClaudeVisionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.lang.NonNull;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class BakeryController {

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UpiSettingsRepository upiRepository;

    @Autowired
    private ClaudeVisionService claudeService;

    @GetMapping("/menu")
    public List<MenuItem> getMenu() {
        return menuItemRepository.findAll();
    }

    @PostMapping("/menu")
    public MenuItem addMenuItem(@NonNull @RequestBody MenuItem menuItem) {
        return menuItemRepository.save(menuItem);
    }

    @PostMapping("/orders/verify-screenshot")
    public ResponseEntity<?> verifyScreenshot(
            @RequestParam("screenshot") MultipartFile file,
            @RequestParam("orderId") String orderId,
            @RequestParam("expectedAmount") String expectedAmount) {

        // Use Claude Vision to extract details
        Map<String, Object> aiResult = claudeService.verifyScreenshot(file, expectedAmount);
        
        if (!(boolean) aiResult.get("success")) {
            return ResponseEntity.badRequest().body(aiResult);
        }

        String txnId = (String) aiResult.get("transactionId");
        String amt = (String) aiResult.get("amount");
        String status = (String) aiResult.get("status");

        // Duplicate Check for Transaction ID
        if (orderRepository.existsByUpiReferenceId(txnId)) {
            Map<String, String> err = new HashMap<>();
            err.put("success", "false");
            err.put("errorType", "DUPLICATE");
            err.put("message", "This payment has already been used.");
            return ResponseEntity.badRequest().body(err);
        }

        // Logic check: Amount and Status
        boolean amountMatches = Double.parseDouble(amt) >= Double.parseDouble(expectedAmount);
        boolean isSuccess = "Success".equalsIgnoreCase(status);

        if (amountMatches && isSuccess) {
            aiResult.put("success", true);
            return ResponseEntity.ok(aiResult);
        } else {
            aiResult.put("success", false);
            aiResult.put("message", "Payment verification failed. Amount: ₹" + amt + " Status: " + status);
            return ResponseEntity.badRequest().body(aiResult);
        }
    }

    @PostMapping("/orders")
    public ResponseEntity<?> placeOrder(@RequestBody OrderRequest orderRequest) {
        BakeryOrder order = new BakeryOrder();
        order.setCustomOrderId(orderRequest.getCustomOrderId());
        order.setTableNumber(orderRequest.getTableNumber());
        order.setCustomerName(orderRequest.getCustomerName());
        order.setDepartment(orderRequest.getDepartment());
        order.setCustomerYear(orderRequest.getCustomerYear());
        order.setPaymentMethod(orderRequest.getPaymentMethod());
        order.setTotalPrice(orderRequest.getTotalPrice());
        order.setOrderTime(LocalDateTime.now());
        
        // Initial status: PENDING for UPI orders (automatically set to PENDING after verification on frontend flow)
        order.setStatus(OrderStatus.PENDING);

        for (OrderItemRequest itemReq : orderRequest.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new RuntimeException("Menu item not found"));

            OrderItem orderItem = new OrderItem();
            orderItem.setBakeryOrder(order);
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setPrice(menuItem.getPrice());
            order.getItems().add(orderItem);
        }

        return ResponseEntity.ok(orderRepository.save(order));
    }

    @GetMapping("/orders")
    public List<BakeryOrder> getAllOrders() {
        return orderRepository.findAll();
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<BakeryOrder> updateOrderStatus(
            @NonNull @PathVariable(name = "id") Long id,
            @RequestBody OrderStatusUpdate statusUpdate) {

        return orderRepository.findById(id).map(order -> {
            order.setStatus(statusUpdate.getStatus());
            return ResponseEntity.ok(orderRepository.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/settings/upi")
    public ResponseEntity<UpiSettings> getUpiSettings() {
        return upiRepository.findFirstByOrderByIdAsc()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/settings/upi")
    public ResponseEntity<UpiSettings> updateUpiSettings(@RequestBody UpiSettings newSettings) {
        UpiSettings settings = upiRepository.findFirstByOrderByIdAsc()
                .orElse(new UpiSettings());
        
        settings.setUpiId(newSettings.getUpiId());
        settings.setRecipientName(newSettings.getRecipientName());
        settings.setMerchantName(newSettings.getMerchantName());
        
        return ResponseEntity.ok(upiRepository.save(settings));
    }
}
