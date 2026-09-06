package com.insurtech.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Security configuration — fail-closed by default.
 *
 * Only explicitly public endpoints (health checks) are reachable without
 * authentication. Everything else requires authentication; until the
 * OAuth2/JWT resource-server module lands, that means business endpoints
 * return 401 — the safe failure mode (fail closed, not open).
 *
 * TODO(opsx authentication change): add oauth2ResourceServer JWT rules and
 * per-endpoint authorization once the auth module ships.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/health", "/actuator/health").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }

    /**
     * CORS source for the security filter chain.
     *
     * Exact origins only — no wildcard tenants. allowCredentials stays false
     * until cookie-based auth exists (see OWASP review 2026-09-06, A01).
     * This is the single source of truth for CORS; do not re-add an MVC
     * registry copy (WebConfig was removed to prevent drift).
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "http://localhost:5173",
            "https://www.chengxing.org",
            "https://insurtech-web-production-53c3.up.railway.app"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(false);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
