package com.gbatistadev.gymbro.user.photo.dto;

/**
 * Foto de perfil do usuário. {@code url} é um link assinado e temporário: o cliente não deve
 * guardá-lo, e sim buscar a foto de novo quando precisar.
 */
public record ProfilePhotoDto(
    String url,
    String contentType,
    int sizeBytes
) {}
