package com.gbatistadev.gymbro.bioimpedance;

import com.gbatistadev.gymbro.bioimpedance.dto.BioimpedanceDto;
import com.gbatistadev.gymbro.bioimpedance.dto.BioimpedanceLogDto;
import com.gbatistadev.gymbro.bioimpedance.dto.CreateBioimpedanceRequest;
import com.gbatistadev.gymbro.bioimpedance.dto.UpdateBioimpedanceRequest;
import com.gbatistadev.gymbro.bioimpedance_logs.BioimpedanceLog;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface BioimpedanceMapper {

    BioimpedanceDto toDto(Bioimpedance bioimpedance);

    BioimpedanceLogDto toDto(BioimpedanceLog log);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "source", defaultValue = "MANUAL")
    Bioimpedance toEntity(CreateBioimpedanceRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    void updateEntity(UpdateBioimpedanceRequest request, @MappingTarget Bioimpedance bioimpedance);
}
