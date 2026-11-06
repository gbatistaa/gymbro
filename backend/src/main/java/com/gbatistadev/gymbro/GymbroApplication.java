package com.gbatistadev.gymbro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class GymbroApplication {

	public static void main(String[] args) {
		SpringApplication.run(GymbroApplication.class, args);
	}

}
