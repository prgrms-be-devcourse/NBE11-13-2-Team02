package com.gachisa.global.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI openApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("같이사 API")
                        .description("""
                                공동구매 이커머스 서비스 API 문서입니다.
                                로그인/재발급 응답으로 받은 accessToken을 우측 상단 Authorize 버튼에 'Bearer {accessToken}' 형식으로 입력하면
                                인증이 필요한 API도 바로 테스트할 수 있습니다.
                                """)
                        .version("v1"))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME_NAME))
                .components(new Components().addSecuritySchemes(BEARER_SCHEME_NAME,
                        new SecurityScheme()
                                .name(BEARER_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
