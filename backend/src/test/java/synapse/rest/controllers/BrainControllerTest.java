package synapse.rest.controllers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import synapse.rest.dtos.BrainSuggestParamsDto;

/**
 * Tests for BrainController (suggest, preview when safe).
 */
@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class BrainControllerTest {

	@Autowired
	private MockMvc mockMvc;

	private final ObjectMapper mapper = new ObjectMapper();

	@Test
	public void testSuggest_EmptyContent_ReturnsDefaultSuggestion() throws Exception {
		BrainSuggestParamsDto params = new BrainSuggestParamsDto("");
		mockMvc.perform(post("/api/brain/suggest")
				.contentType(MediaType.APPLICATION_JSON)
				.content(mapper.writeValueAsBytes(params)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.type").value("nota"))
				.andExpect(jsonPath("$.title").value("Nota"))
				.andExpect(jsonPath("$.destination").value("apunte"))
				.andExpect(jsonPath("$.tags").isArray());
	}

	@Test
	public void testSuggest_NullContent_ReturnsDefaultSuggestion() throws Exception {
		BrainSuggestParamsDto params = new BrainSuggestParamsDto();
		params.setContent(null);
		mockMvc.perform(post("/api/brain/suggest")
				.contentType(MediaType.APPLICATION_JSON)
				.content(mapper.writeValueAsBytes(params)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.type").value("nota"));
	}
}
