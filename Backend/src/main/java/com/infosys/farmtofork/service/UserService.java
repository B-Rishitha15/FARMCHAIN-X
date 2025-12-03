package com.infosys.farmtofork.service;

import org.springframework.stereotype.Service;
import com.infosys.farmtofork.model.User;
import com.infosys.farmtofork.repository.UserRepository;
import com.infosys.farmtofork.dto.LoginRequest;
import com.infosys.farmtofork.dto.LoginResponse;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User create(User u) {
        return userRepository.save(u);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<User> list() { 
        return userRepository.findAll(); 
    }

    public LoginResponse login(LoginRequest request) {
        Optional<User> user = Optional.ofNullable(findByEmail(request.getEmail()));
        
        if (user.isEmpty()) {
            return LoginResponse.builder()
                    .message("User not found")
                    .build();
        }

        User foundUser = user.get();
        
        // Simple password check (in production, use BCrypt)
        if (!foundUser.getPassword().equals(request.getPassword())) {
            return LoginResponse.builder()
                    .message("Invalid password")
                    .build();
        }

        // Verify role matches
        if (!foundUser.getRole().equalsIgnoreCase(request.getRole())) {
            return LoginResponse.builder()
                    .message("Role mismatch")
                    .build();
        }

        // Login successful
        return LoginResponse.builder()
                .id(foundUser.getId())
                .name(foundUser.getName())
                .email(foundUser.getEmail())
                .role(foundUser.getRole())
                .token("Bearer " + generateToken(foundUser))
                .message("Login successful")
                .build();
    }

    private String generateToken(User user) {
        // Simple token generation (in production, use JWT)
        return java.util.Base64.getEncoder()
                .encodeToString((user.getId() + ":" + user.getEmail() + ":" + System.currentTimeMillis()).getBytes());
    }
}

