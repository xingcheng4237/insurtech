package com.insurtech.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    // allowedOriginPatterns (not allowedOrigins) is required for
                    // wildcard domains like *.up.railway.app and works with
                    // allowCredentials(true).
                    .allowedOriginPatterns(
                        "http://localhost:3000",
                        "http://localhost:5173",
                        "https://www.chengxing.org",
                        "https://*.up.railway.app"
                    )
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
