package com.infosys.farmtofork.controller;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.infosys.farmtofork.model.User;
import com.infosys.farmtofork.service.UserService;
import com.infosys.farmtofork.dto.LoginRequest;
import com.infosys.farmtofork.dto.LoginResponse;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public User register(@RequestBody User u) {
        // NOTE: password should be encoded in production
        return userService.create(u);
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return userService.login(request);
    }

    @GetMapping
    public List<User> list() {
        return userService.list();
    }
}
