package com.gbatistadev.gymbro.common.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
public class LoggingAspect {

    @Around("@annotation(logging))")
	public Object logAudit(ProceedingJoinPoint pjp, Logging logging) throws Throwable {
		log.info("Ação {} bateu aqui no aspect", logging.action());

		Object result = pjp.proceed();

		log.info("Ação {} executada com sucesso", logging.action());

		return result;
	}
}
