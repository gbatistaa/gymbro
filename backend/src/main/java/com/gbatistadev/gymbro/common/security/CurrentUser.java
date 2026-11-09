package com.gbatistadev.gymbro.common.security;

import com.gbatistadev.gymbro.errors.exceptions.UnauthorizedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CurrentUser {

    public UUID id() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UUID id)) {
            throw new UnauthorizedException("Authentication required");
        }
        return id;
    }
}
