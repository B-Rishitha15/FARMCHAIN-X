
package com.infosys.farmtofork.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.infosys.farmtofork.dto.InventoryRequest;
import com.infosys.farmtofork.model.Inventory;
import com.infosys.farmtofork.model.Product;
import com.infosys.farmtofork.model.User;
import com.infosys.farmtofork.repository.InventoryRepository;
import com.infosys.farmtofork.repository.ProductRepository;
import com.infosys.farmtofork.repository.UserRepository;

@Service
@Transactional
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public InventoryService(
            InventoryRepository inventoryRepository,
            ProductRepository productRepository,
            UserRepository userRepository) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    public List<Inventory> getInventoryByOwner(Long ownerId) {
        return inventoryRepository.findByOwnerId(ownerId);
    }

    public Inventory addInventory(InventoryRequest request) {
        Inventory inventory = new Inventory();

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        User owner = userRepository.findById(request.getOwnerId())
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        inventory.setProduct(product);
        inventory.setOwner(owner);
        inventory.setQuantity(request.getQuantity());

        if (request.getStage() != null) {
            inventory.setStage(request.getStage());
        }

        updatePrices(product, request);
        productRepository.save(product);

        return inventoryRepository.save(inventory);
    }

    public Inventory updateInventory(Long id, InventoryRequest request) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        if (request.getQuantity() != null) {
            inventory.setQuantity(request.getQuantity());
        }

        if (request.getStage() != null) {
            inventory.setStage(request.getStage());
        }

        Product product = inventory.getProduct();

        if (product != null) {
            updatePrices(product, request);
            productRepository.save(product);
        }

        return inventoryRepository.save(inventory);
    }

    private void updatePrices(Product product, InventoryRequest request) {
        if (request.getPrice() != null) {
            validatePrice(request.getPrice(), "Farmer price");
            product.setPrice(request.getPrice());
        }

        if (request.getDistributorPrice() != null) {
            validatePrice(request.getDistributorPrice(), "Distributor price");
            product.setDistributorPrice(request.getDistributorPrice());
        }

        if (request.getRetailerPrice() != null) {
            validatePrice(request.getRetailerPrice(), "Retailer price");
            product.setRetailerPrice(request.getRetailerPrice());
        }
    }

    private void validatePrice(Double price, String fieldName) {
        if (price == null || !Double.isFinite(price) || price < 0) {
            throw new IllegalArgumentException(
                    fieldName + " must be a valid non-negative number");
        }
    }

    public void deleteInventory(Long id) {
        if (!inventoryRepository.existsById(id)) {
            throw new RuntimeException("Inventory not found");
        }

        inventoryRepository.deleteById(id);
    }
}
