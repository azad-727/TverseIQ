package com.tverseIQ.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@EnableCaching
@SpringBootApplication
public class TverseIqApplication {

	public static void main(String[] args) {
		SpringApplication.run(TverseIqApplication.class, args);
	}

}
