package com.gbatistadev.gymbro;

import org.springframework.boot.SpringApplication;

public class TestGymbroApplication {

	public static void main(String[] args) {
		SpringApplication.from(GymbroApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
