package com.gachisa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class GachisaApplication {

    public static void main(String[] args) {
        SpringApplication.run(GachisaApplication.class, args);
    }
}
