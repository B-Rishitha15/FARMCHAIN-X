# Farm-to-Fork Backend (Spring Boot)

Generated scaffold to match the React frontend (farm-to-fork-ui).

## Features
- Entities: User, Product, Inventory, Order
- REST endpoints under `/api/*`
- MySQL configuration in `src/main/resources/application.properties`
- Spring Security starter included (basic config)

## Run
1. Update `application.properties` with your MySQL username/password and database.
2. Build & run:
   ```bash
   mvn clean package
   java -jar target/farm-to-fork-backend-0.0.1-SNAPSHOT.jar
   ```
3. API endpoints:
   - `GET /api/products`
   - `POST /api/products`
   - `POST /api/users/register`
   - `GET /api/inventory`
   - `POST /api/orders`

This is a scaffold — add validation, DTOs, password encoding, exception handling, and tests for production.
