package com.gachisa.category.controller;

import com.gachisa.category.dto.CategoryCreateRequest;
import com.gachisa.category.dto.CategoryResponse;
import com.gachisa.category.dto.CategoryUpdateRequest;
import com.gachisa.category.service.CategoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public List<CategoryResponse> getCategories() {
        return categoryService.getCategories();
    }

    @GetMapping("/{categoryId}")
    public CategoryResponse getCategory(@PathVariable Long categoryId) {
        return categoryService.getCategory(categoryId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryResponse createCategory(@RequestBody CategoryCreateRequest request) {
        return categoryService.createCategory(request.name(), request.parentId());
    }

    @PatchMapping("/{categoryId}")
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryResponse updateCategory(@PathVariable Long categoryId, @RequestBody CategoryUpdateRequest request) {
        return categoryService.updateCategory(categoryId, request.name());
    }

    @DeleteMapping("/{categoryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCategory(@PathVariable Long categoryId) {
        categoryService.deleteCategory(categoryId);
    }
}
