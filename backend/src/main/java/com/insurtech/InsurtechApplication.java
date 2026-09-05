package com.insurtech;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.modulith.Modulith;

@SpringBootApplication
@Modulith(systemName = "Insurtech Platform", sharedModules = "com.insurtech.common")
public class InsurtechApplication {

    public static void main(String[] args) {
        SpringApplication.run(InsurtechApplication.class, args);
    }
}
