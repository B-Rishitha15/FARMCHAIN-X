package com.infosys.farmtofork.service;

import org.springframework.stereotype.Service;
import java.util.List;
import com.infosys.farmtofork.dto.AiScoreResult;
import com.infosys.farmtofork.model.Product;
import com.infosys.farmtofork.repository.ProductRepository;

@Service
public class ProductService {
    private final ProductRepository productRepository;
    private final AiScoreService aiScoreService;

    public ProductService(ProductRepository productRepository, AiScoreService aiScoreService) {
        this.productRepository = productRepository;
        this.aiScoreService = aiScoreService;
    }

    public List<Product> getAll() {
        return productRepository.findAll();
    }

    public Product get(Long id) {
        return productRepository.findById(id).orElse(null);
    }

    public Product create(Product p) {
        // If frontend already provided an AI score (from QualityScore mapping),
        // keep that value and don't override it with the image-based model.
        if (p.getAiScore() == null) {
            aiScoreService.scoreImage(p.getImageUrl())
                .ifPresent(result -> applyScore(p, result));
        } else {
            // Derive a simple verdict from the provided score if none is set
            if (p.getAiVerdict() == null) {
                double score = p.getAiScore();
                String verdict = score >= 80 ? "Good Quality" : "Average Quality";
                p.setAiVerdict(verdict);
            }
        }

        return productRepository.save(p);
    }

    private void applyScore(Product product, AiScoreResult result) {
        product.setAiScore(result.getAiScore());
        product.setAiVerdict(result.getQualityLabel());
    }
}
