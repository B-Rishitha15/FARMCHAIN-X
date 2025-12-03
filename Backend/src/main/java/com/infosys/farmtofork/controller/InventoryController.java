package com.infosys.farmtofork.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;
import com.infosys.farmtofork.model.Inventory;
import com.infosys.farmtofork.dto.InventoryRequest;
import com.infosys.farmtofork.dto.InventoryResponse;
import com.infosys.farmtofork.dto.ProductResponse;
import com.infosys.farmtofork.dto.UserResponse;
import com.infosys.farmtofork.service.InventoryService;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public List<InventoryResponse> all() {
        return inventoryService.getAllInventory().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @GetMapping("/owner/{ownerId}")
    public List<InventoryResponse> byOwner(@PathVariable Long ownerId) {
        return inventoryService.getInventoryByOwner(ownerId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<InventoryResponse> add(@RequestBody InventoryRequest request) {
        Inventory saved = inventoryService.addInventory(request);
        return ResponseEntity.ok(toResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryResponse> update(@PathVariable Long id, @RequestBody InventoryRequest request) {
        Inventory updated = inventoryService.updateInventory(id, request);
        return ResponseEntity.ok(toResponse(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        inventoryService.deleteInventory(id);
        return ResponseEntity.noContent().build();
    }

    private InventoryResponse toResponse(Inventory it) {
        ProductResponse p = null;
        if (it.getProduct() != null) {
            // map new Product fields to DTO; keep `category` for UI compatibility
            p = ProductResponse.builder()
                .id(it.getProduct().getId())
                .name(it.getProduct().getName())
                .cropType(it.getProduct().getCropType())
                .category(it.getProduct().getCropType())
                .quantityKg(it.getProduct().getQuantityKg())
                .qualityGrade(it.getProduct().getQualityGrade())
                .harvestDate(it.getProduct().getHarvestDate() != null ? it.getProduct().getHarvestDate().toString() : null)
                .location(it.getProduct().getLocation())
                .status(it.getProduct().getStatus() != null ? it.getProduct().getStatus().name() : null)
                .imageUrl(it.getProduct().getImageUrl())
                .aiScore(it.getProduct().getAiScore())
                .aiVerdict(it.getProduct().getAiVerdict())
                .price(it.getProduct().getPrice())
                .build();
        }

        UserResponse u = null;
        if (it.getOwner() != null) {
            u = UserResponse.builder()
                .id(it.getOwner().getId())
                .name(it.getOwner().getName())
                .email(it.getOwner().getEmail())
                .role(it.getOwner().getRole())
                .build();
        }

        return InventoryResponse.builder()
            .id(it.getId())
            .quantity(it.getQuantity())
            .product(p)
            .owner(u)
            .stage(it.getStage())
            .build();
    }
}

