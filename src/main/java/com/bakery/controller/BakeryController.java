package com.bakery.controller;

import com.bakery.dto.OrderItemRequest;
import com.bakery.dto.OrderRequest;
import com.bakery.dto.OrderStatusUpdate;
import com.bakery.model.BakeryOrder;
import com.bakery.model.MenuItem;
import com.bakery.model.OrderItem;
import com.bakery.model.OrderStatus;
import com.bakery.repository.MenuItemRepository;
import com.bakery.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.lang.NonNull;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Allow any origin for simple development
public class BakeryController {

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OrderRepository orderRepository;

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
    public BakeryOrder placeOrder(@RequestBody OrderRequest orderRequest) {
        BakeryOrder order = new BakeryOrder();
        order.setTableNumber(orderRequest.getTableNumber());
        order.setCustomerName(orderRequest.getCustomerName());
        order.setDepartment(orderRequest.getDepartment());
        order.setCustomerYear(orderRequest.getCustomerYear());
        order.setOrderTime(LocalDateTime.now());
        order.setStatus(OrderStatus.PENDING);

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
        return orderRepository.save(order);
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
}
