package com.gbatistadev.gymbro.common.mapper;

import com.gbatistadev.gymbro.common.dto.PageDto;
import org.mapstruct.Mapper;
import org.springframework.data.domain.Page;

@Mapper(componentModel = "spring")
public interface PageMapper {

    default <T> PageDto<T> toDto(Page<T> page) {
        return new PageDto<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages());
    }
}
