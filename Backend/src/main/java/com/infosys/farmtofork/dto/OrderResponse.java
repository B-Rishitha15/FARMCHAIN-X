package com.infosys.farmtofork.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private Double totalAmount;
    private String status;
    private String createdAt;
    private List<OrderItemResponse> items;
}
