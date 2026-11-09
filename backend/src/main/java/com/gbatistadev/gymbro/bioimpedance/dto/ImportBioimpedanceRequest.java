package com.gbatistadev.gymbro.bioimpedance.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Items are validated one by one in the service so one bad item does not reject the batch.
 */
public record ImportBioimpedanceRequest(
    @NotEmpty(message = "items cannot be empty")
    List<CreateBioimpedanceRequest> items
) {}
