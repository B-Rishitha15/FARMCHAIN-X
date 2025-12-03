package com.infosys.farmtofork.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemRequest {
    private Long productId;
    private Long quantity;
    private Double price; // Optional - if not provided, will be fetched from product
}
