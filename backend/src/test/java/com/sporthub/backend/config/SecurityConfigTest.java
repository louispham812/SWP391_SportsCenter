
package com.sporthub.backend.config;

import com.sporthub.backend.controller.PublicContentController;
import com.sporthub.backend.repository.AuthSessionRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.repository.PublicFacilityRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PublicContentController.class)
@Import(SecurityConfig.class)
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthSessionRepository sessionRepository;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private PublicSportRepository sportRepository;

    @MockitoBean
    private PublicFacilityRepository facilityRepository;

    @Test
    void publicSportsEndpointDoesNotRequireAuthentication() throws Exception {
        when(sportRepository.findByActiveTrueOrderBySportIdAsc())
                .thenReturn(java.util.List.of());

        mockMvc.perform(get("/api/v1/public/content/sports"))
                .andExpect(status().isOk());
    }

    @Test
    void publicFacilitiesEndpointDoesNotRequireAuthentication() throws Exception {
        when(facilityRepository.findByActiveTrueOrderByFacilityIdAsc())
                .thenReturn(java.util.List.of());

        mockMvc.perform(get("/api/v1/public/content/facilities"))
                .andExpect(status().isOk());
    }

    @Test
    void privateEndpointRejectsUnauthenticatedRequest() throws Exception {
        mockMvc.perform(get("/api/v1/manager/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    void optionsRequestIsPermitted() throws Exception {
        mockMvc.perform(options("/api/v1/public/content/sports")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        "Access-Control-Allow-Origin",
                        "http://localhost:5173"
                ));
    }
}
