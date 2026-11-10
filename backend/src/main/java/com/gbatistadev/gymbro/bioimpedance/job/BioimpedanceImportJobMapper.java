package com.gbatistadev.gymbro.bioimpedance.job;

import com.gbatistadev.gymbro.bioimpedance.dto.ImportJobDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BioimpedanceImportJobMapper {

    ImportJobDto toDto(BioimpedanceImportJob job);
}
