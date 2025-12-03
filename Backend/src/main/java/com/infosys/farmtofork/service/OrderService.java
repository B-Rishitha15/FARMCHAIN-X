package com.infosys.farmtofork.service;

import org.springframework.stereotype.Service;
import com.infosys.farmtofork.model.Order;
import com.infosys.farmtofork.model.OrderItem;
import com.infosys.farmtofork.model.Product;
import com.infosys.farmtofork.model.User;
import com.infosys.farmtofork.repository.OrderRepository;
import com.infosys.farmtofork.repository.OrderItemRepository;
import com.infosys.farmtofork.repository.ProductRepository;
import com.infosys.farmtofork.repository.UserRepository;
import com.infosys.farmtofork.dto.OrderRequest;
import com.infosys.farmtofork.dto.OrderItemRequest;
import com.infosys.farmtofork.dto.OrderResponse;
import com.infosys.farmtofork.dto.OrderItemResponse;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public OrderService(OrderRepository orderRepository,
                       OrderItemRepository orderItemRepository,
                       ProductRepository productRepository,
                       UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public OrderResponse createOrder(OrderRequest request) {
        Optional<User> customer = userRepository.findById(request.getCustomerId());

        if (customer.isEmpty()) {
            throw new RuntimeException("Customer not found");
        }

        // Create order
        Order order = Order.builder()
                .customer(customer.get())
                .status("CREATED")
                .createdAt(new Date())
                .totalAmount(0.0)
                .build();

        order = orderRepository.save(order);

        // Add items to order
        double totalAmount = 0.0;
        for (OrderItemRequest itemRequest : request.getItems()) {
            Optional<Product> product = productRepository.findById(itemRequest.getProductId());

            if (product.isEmpty()) {
                throw new RuntimeException("Product not found: " + itemRequest.getProductId());
            }

            Product prod = product.get();
            // Product model no longer guarantees a price field — require price in request
            Double itemPrice = itemRequest.getPrice();
            if (itemPrice == null) {
                throw new RuntimeException("Price must be provided for product: " + prod.getId());
            }

                OrderItem item = OrderItem.builder()
                    .order(order)
                    .product(prod)
                    .quantity(itemRequest.getQuantity())
                    .price(itemPrice)
                    .build();

                OrderItem savedItem = orderItemRepository.save(item);
                // keep the in-memory relationship in sync so convertToResponse sees the items
                order.getItems().add(savedItem);
                totalAmount += itemPrice * itemRequest.getQuantity();
        }

        // Update order total amount
        order.setTotalAmount(totalAmount);
        order = orderRepository.save(order);

        return convertToResponse(order);
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public Optional<OrderResponse> getOrderById(Long id) {
        return orderRepository.findById(id)
                .map(this::convertToResponse);
    }

    public List<OrderResponse> getOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomerId(customerId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public OrderResponse updateOrderStatus(Long id, String status) {
        Optional<Order> order = orderRepository.findById(id);

        if (order.isEmpty()) {
            throw new RuntimeException("Order not found");
        }

        Order existingOrder = order.get();
        existingOrder.setStatus(status);
        existingOrder = orderRepository.save(existingOrder);

        return convertToResponse(existingOrder);
    }

    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }

    private OrderResponse convertToResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .build())
                .collect(Collectors.toList());

        SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        String formattedDate = order.getCreatedAt() != null ? formatter.format(order.getCreatedAt()) : null;

        return OrderResponse.builder()
                .id(order.getId())
                .customerId(order.getCustomer().getId())
                .customerName(order.getCustomer().getName())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .createdAt(formattedDate)
                .items(items)
                .build();
    }
}
