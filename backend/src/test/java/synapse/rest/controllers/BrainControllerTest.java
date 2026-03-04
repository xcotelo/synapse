package synapse.rest.controllers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;

import synapse.model.entities.User;
import synapse.model.entities.UserDao;
import synapse.model.services.exceptions.IncorrectLoginException;
import synapse.rest.dtos.AuthenticatedUserDto;
import synapse.rest.dtos.BrainSuggestParamsDto;
import synapse.rest.dtos.LoginParamsDto;

/**
 * Tests for BrainController (suggestions endpoint).
 */
@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class BrainControllerTest {

	private final static String PASSWORD = "password";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private BCryptPasswordEncoder passwordEncoder;

	@Autowired
	private UserDao userDao;

	@Autowired
	private SessionController sessionController;

	private final ObjectMapper mapper = new ObjectMapper();

	private String getAuthToken() throws IncorrectLoginException {
		User user = new User("testuser", PASSWORD, "test@test.com");
		user.setPassword(passwordEncoder.encode(user.getPassword()));
		userDao.save(user);

		LoginParamsDto loginParams = new LoginParamsDto();
		loginParams.setUserName(user.getUserName());
		loginParams.setPassword(PASSWORD);

		AuthenticatedUserDto auth = sessionController.login(loginParams);
		return auth.getServiceToken();
	}

	@Test
	public void testSuggest_EmptyContent_ReturnsBadRequest() throws Exception {
		String token = getAuthToken();
		BrainSuggestParamsDto params = new BrainSuggestParamsDto("");
		mockMvc.perform(post("/api/brains/suggestions")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(mapper.writeValueAsBytes(params)))
				.andExpect(status().isBadRequest());
	}

	@Test
	public void testSuggest_NullContent_ReturnsBadRequest() throws Exception {
		String token = getAuthToken();
		BrainSuggestParamsDto params = new BrainSuggestParamsDto();
		params.setContent(null);
		mockMvc.perform(post("/api/brains/suggestions")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(mapper.writeValueAsBytes(params)))
				.andExpect(status().isBadRequest());
	}
}
