package com.infosys.farmtofork.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.infosys.farmtofork.model.User;
import com.infosys.farmtofork.model.Product;
import com.infosys.farmtofork.repository.UserRepository;
import com.infosys.farmtofork.repository.ProductRepository;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initializeData(UserRepository userRepository, ProductRepository productRepository) {
        return args -> {
            // Create sample users if they don't exist
            if (userRepository.count() == 0) {
                userRepository.save(User.builder()
                        .name("Farmer John")
                        .email("farmer@example.com")
                        .password("password123")
                        .role("Farmer")
                        .build());

                userRepository.save(User.builder()
                        .name("Retailer Bob")
                        .email("retailer@example.com")
                        .password("password123")
                        .role("Retailer")
                        .build());

                userRepository.save(User.builder()
                        .name("Consumer Alice")
                        .email("consumer@example.com")
                        .password("password123")
                        .role("Consumer")
                        .build());

                userRepository.save(User.builder()
                        .name("Distributor Charlie")
                        .email("distributor@example.com")
                        .password("password123")
                        .role("Distributor")
                        .build());

                System.out.println("✓ Sample users created");
            }

            // Create sample products if they don't exist
            if (productRepository.count() == 0) {
                productRepository.save(Product.builder()
                        .name("Rice")
                        .cropType("Grains")
                        .quantityKg(100.0)
                        .qualityGrade("A")
                        .harvestDate(java.time.LocalDate.now().minusMonths(1))
                        .location("Sample Farm")
                        .build());

                productRepository.save(Product.builder()
                        .name("Wheat")
                        .cropType("Grains")
                        .quantityKg(80.0)
                        .qualityGrade("A")
                        .harvestDate(java.time.LocalDate.now().minusMonths(2))
                        .location("Sample Farm")
                        .build());

                productRepository.save(Product.builder()
                        .name("Tomato")
                        .cropType("Vegetables")
                        .quantityKg(50.0)
                        .qualityGrade("A")
                        .harvestDate(java.time.LocalDate.now().minusWeeks(3))
                        .location("Sample Farm")
                        .build());

                productRepository.save(Product.builder()
                        .name("Potato")
                        .cropType("Vegetables")
                        .quantityKg(120.0)
                        .qualityGrade("B")
                        .harvestDate(java.time.LocalDate.now().minusWeeks(5))
                        .location("Sample Farm")
                        .build());

                productRepository.save(Product.builder()
                        .name("Milk")
                        .cropType("Dairy")
                        .quantityKg(200.0)
                        .qualityGrade("A")
                        .harvestDate(java.time.LocalDate.now().minusDays(7))
                        .location("Sample Farm")
                        .build());

                System.out.println("✓ Sample products created");
            }
        };
    }

    @Bean
    public CommandLineRunner ensureImageColumnSize(DataSource dataSource) {
        return args -> {
            try (Connection connection = dataSource.getConnection();
                 Statement statement = connection.createStatement()) {
                statement.execute("ALTER TABLE products MODIFY COLUMN image_url LONGTEXT");
                System.out.println("✓ Verified products.image_url is LONGTEXT");
            } catch (SQLException ex) {
                // Table may not exist on first boot; log only non-trivial errors
                if (!ex.getMessage().contains("doesn't exist")) {
                    System.err.println("⚠ Unable to resize products.image_url: " + ex.getMessage());
                }
            }
        };
    }
}
