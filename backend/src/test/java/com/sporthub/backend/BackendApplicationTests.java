package com.sporthub.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(TestMailConfig.class)
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
