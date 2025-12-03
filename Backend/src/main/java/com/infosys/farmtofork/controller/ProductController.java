package com.infosys.farmtofork.controller;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.infosys.farmtofork.model.Product;
import com.infosys.farmtofork.service.ProductService;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<Product> list() {
        return productService.getAll();
    }

    @GetMapping("/{id}")
    public Product get(@PathVariable Long id) {
        return productService.get(id);
    }

    @PostMapping
    public Product create(@RequestBody Product p) {
        return productService.create(p);
    }
}
