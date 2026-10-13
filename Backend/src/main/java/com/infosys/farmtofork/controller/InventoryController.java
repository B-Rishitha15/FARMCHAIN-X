
package com.infosys.farmtofork.controller;

import com.infosys.farmtofork.dto.InventoryRequest;
import com.infosys.farmtofork.dto.InventoryResponse;
import com.infosys.farmtofork.dto.ProductResponse;
import com.infosys.farmtofork.dto.UserResponse;
import com.infosys.farmtofork.model.Inventory;
import com.infosys.farmtofork.service.InventoryService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public List<InventoryResponse> all() {
        return inventoryService.getAllInventory()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/owner/{ownerId}")
    public List<InventoryResponse> byOwner(@PathVariable Long ownerId) {
        return inventoryService.getInventoryByOwner(ownerId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<InventoryResponse> add(
            @RequestBody InventoryRequest request) {
        Inventory saved = inventoryService.addInventory(request);
        return ResponseEntity.ok(toResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryResponse> update(
            @PathVariable Long id,
            @RequestBody InventoryRequest request) {
        Inventory updated = inventoryService.updateInventory(id, request);
        return ResponseEntity.ok(toResponse(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        inventoryService.deleteInventory(id);
        return ResponseEntity.noContent().build();
    }

    private InventoryResponse toResponse(Inventory inventory) {
        ProductResponse productResponse = null;

        if (inventory.getProduct() != null) {
            var product = inventory.getProduct();

            productResponse = ProductResponse.builder()
                    .id(product.getId())
                    .name(product.getName())
                    .cropType(product.getCropType())
                    .category(product.getCropType())
                    .quantityKg(product.getQuantityKg())
                    .qualityGrade(product.getQualityGrade())
                    .harvestDate(product.getHarvestDate() != null
                            ? product.getHarvestDate().toString()
                            : null)
                    .location(product.getLocation())
                    .status(product.getStatus() != null
                            ? product.getStatus().name()
                            : null)
                    .imageUrl(product.getImageUrl())
                    .aiScore(product.getAiScore())
                    .aiVerdict(product.getAiVerdict())
                    .price(product.getPrice())
                    .distributorPrice(product.getDistributorPrice())
                    .retailerPrice(product.getRetailerPrice())
                    .build();
        }

        UserResponse userResponse = null;

        if (inventory.getOwner() != null) {
            var owner = inventory.getOwner();

            userResponse = UserResponse.builder()
                    .id(owner.getId())
                    .name(owner.getName())
                    .email(owner.getEmail())
                    .role(owner.getRole())
                    .build();
        }

        return InventoryResponse.builder()
                .id(inventory.getId())
                .quantity(inventory.getQuantity())
                .product(productResponse)
                .owner(userResponse)
                .stage(inventory.getStage())
                .build();
    }
}
