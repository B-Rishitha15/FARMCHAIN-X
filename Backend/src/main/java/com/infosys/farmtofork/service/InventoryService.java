package com.infosys.farmtofork.service;

import org.springframework.stereotype.Service;
import com.infosys.farmtofork.model.Inventory;
import com.infosys.farmtofork.model.Product;
import com.infosys.farmtofork.model.User;
import com.infosys.farmtofork.repository.InventoryRepository;
import com.infosys.farmtofork.repository.ProductRepository;
import com.infosys.farmtofork.repository.UserRepository;
import com.infosys.farmtofork.dto.InventoryRequest;
import java.util.List;
import java.util.Optional;

@Service
public class InventoryService {
    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public InventoryService(InventoryRepository inventoryRepository, 
                          ProductRepository productRepository,
                          UserRepository userRepository) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public Inventory addInventory(InventoryRequest request) {
        Optional<Product> product = productRepository.findById(request.getProductId());
        Optional<User> owner = userRepository.findById(request.getOwnerId());

        if (product.isEmpty() || owner.isEmpty()) {
            throw new RuntimeException("Product or Owner not found");
        }

        Inventory inventory = Inventory.builder()
                .product(product.get())
                .owner(owner.get())
                .quantity(request.getQuantity())
                .stage(request.getStage() != null ? request.getStage() : "harvested")
                .build();

        return inventoryRepository.save(inventory);
    }

    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    public List<Inventory> getInventoryByOwner(Long ownerId) {
        return inventoryRepository.findByOwnerId(ownerId);
    }

    public Inventory updateInventory(Long id, InventoryRequest request) {
        Optional<Inventory> existingInventory = inventoryRepository.findById(id);
        
        if (existingInventory.isEmpty()) {
            throw new RuntimeException("Inventory not found");
        }

        Inventory inventory = existingInventory.get();
        
        if (request.getProductId() != null) {
            Optional<Product> product = productRepository.findById(request.getProductId());
            product.ifPresent(inventory::setProduct);
        }

        if (request.getOwnerId() != null) {
            Optional<User> owner = userRepository.findById(request.getOwnerId());
            owner.ifPresent(inventory::setOwner);
        }

        if (request.getQuantity() != null) {
            inventory.setQuantity(request.getQuantity());
        }

        if (request.getStage() != null) {
            inventory.setStage(request.getStage());
        }

        return inventoryRepository.save(inventory);
    }

    public void deleteInventory(Long id) {
        inventoryRepository.deleteById(id);
    }
}
