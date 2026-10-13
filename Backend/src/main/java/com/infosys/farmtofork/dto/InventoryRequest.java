
package com.infosys.farmtofork.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryRequest {

    private Long productId;
    private Long ownerId;
    private Long quantity;
    private String stage;

    // Farmer's base price
    private Double price;

    // Distributor's selling price
    private Double distributorPrice;

    // Retailer's final selling price
    private Double retailerPrice;
}
