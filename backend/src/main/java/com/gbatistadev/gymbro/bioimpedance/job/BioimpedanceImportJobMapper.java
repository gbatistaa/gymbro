package com.gbatistadev.gymbro.bioimpedance.job;

import com.gbatistadev.gymbro.bioimpedance.dto.CreateBioimpedanceRequest;
import com.gbatistadev.gymbro.bioimpedance.dto.ImportJobDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BioimpedanceImportJobMapper {

    ImportJobDto toDto(BioimpedanceImportJob job);

    default CreateBioimpedanceRequest toImportRequest(
        CreateBioimpedanceRequest request, String sourceFileHash
    ) {
        return new CreateBioimpedanceRequest(
            request.measuredAt(),
            request.bodyFatPercentage(),
            request.muscleMassKg(),
            request.visceralFat(),
            request.waterPercentage(),
            request.bodyWeightKg(),
            request.heightCm(),
            request.skeletalMuscleMassKg(),
            "IMPORT",
            sourceFileHash);
    }
}
