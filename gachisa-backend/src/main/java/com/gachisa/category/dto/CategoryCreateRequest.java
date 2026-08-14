package com.gachisa.category.dto;

public record CategoryCreateRequest(
    String name,
    Long parentId
) {}
