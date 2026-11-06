package com.gbatistadev.gymbro.common.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.hibernate.annotations.Audited;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class LoggingAspect {

	private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

	@Around("@annotation(logging))")
	public Object logAudit(ProceedingJoinPoint pjp, Logging logging) throws Throwable {
		log.info("Ação {} bateu aqui no aspect", logging.action());

		try {
			Object result = pjp.proceed();

			log.info("Ação {} executada com sucesso", logging.action());

			return result;
		} catch (Throwable e) {
			throw new RuntimeException(e);
		}
	}
}
