package com.infosys.farmtofork.controller;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.infosys.farmtofork.dto.OrderRequest;
import com.infosys.farmtofork.dto.OrderResponse;
import com.infosys.farmtofork.service.OrderService;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public OrderResponse create(@RequestBody OrderRequest request) {
        return orderService.createOrder(request);
    }

    @GetMapping
    public List<OrderResponse> all() {
        return orderService.getAllOrders();
    }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable Long id) {
        return orderService.getOrderById(id).orElseThrow(() -> new RuntimeException("Order not found"));
    }

    @GetMapping("/customer/{customerId}")
    public List<OrderResponse> byCustomer(@PathVariable Long customerId) {
        return orderService.getOrdersByCustomer(customerId);
    }

    @PutMapping("/{id}/status")
    public OrderResponse updateStatus(@PathVariable Long id, @RequestParam String status) {
        return orderService.updateOrderStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        orderService.deleteOrder(id);
    }
}
