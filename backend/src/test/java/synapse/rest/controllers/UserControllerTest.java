package synapse.rest.controllers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

import synapse.model.entities.Users;
import synapse.model.entities.UserDao;
import synapse.model.services.exceptions.IncorrectLoginException;

import synapse.rest.dtos.AuthenticatedUserDto;
import synapse.rest.dtos.LoginParamsDto;
import synapse.rest.dtos.ChangePasswordParamsDto;
import synapse.rest.dtos.UserDto;

/**
 * The Class UserControllerTest.
 */
@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class UserControllerTest {

	/** The Constant PASSWORD. */
	private final static String PASSWORD = "password";

	/** The mock mvc. */
	@Autowired
	private MockMvc mockMvc;

	/** The password encoder. */
	@Autowired
	private BCryptPasswordEncoder passwordEncoder;

	/** The user dao. */
	@Autowired
	UserDao userDao;

	/** The user controller. */
	@Autowired
	private UserController userController;

	private AuthenticatedUserDto createAuthenticatedUser(String userName)
			throws IncorrectLoginException {

		Users user = new Users(userName, PASSWORD, "user@test.com");

		user.setPassword(passwordEncoder.encode(user.getPassword()));

		userDao.save(user);

		LoginParamsDto loginParams = new LoginParamsDto();
		loginParams.setUserName(user.getUserName());
		loginParams.setPassword(PASSWORD);

		return userController.login(loginParams);

	}

	/**
	 * Test post login ok.
	 *
	 * @throws Exception the exception
	 */
	@Test
	public void testPostLogin_Ok() throws Exception {

		AuthenticatedUserDto user = createAuthenticatedUser("admin");

		LoginParamsDto loginParams = new LoginParamsDto();
		loginParams.setUserName(user.getUserDto().getUserName());
		loginParams.setPassword(PASSWORD);

		ObjectMapper mapper = new ObjectMapper();

		mockMvc.perform(post("/api/users/login").header("Authorization", "Bearer " + user.getServiceToken())
				.contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsBytes(loginParams)))
				.andExpect(status().isOk());

	}

	@Test
	public void testPostLogin_IncorrectLogin() throws Exception {

		LoginParamsDto loginParams = new LoginParamsDto();
		loginParams.setUserName("user");
		loginParams.setPassword("incorrect");

		ObjectMapper mapper = new ObjectMapper();

		mockMvc.perform(post("/api/users/login")
				.contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsBytes(loginParams)))
				.andExpect(status().isNotFound());

	}

	@Test
	public void testPostSignUp_Ok() throws Exception {

		UserDto user = new UserDto();
		user.setUserName("user");
		user.setPassword(PASSWORD);
		user.setEmail("user@test.com");

		ObjectMapper mapper = new ObjectMapper();

		mockMvc.perform(post("/api/users/signUp")
				.contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsBytes(user)))
				.andExpect(status().isCreated());

	}

	@Test
	public void testPostSignUp_DuplicateInstance() throws Exception {

		UserDto user = new UserDto();
		user.setUserName("user");
		user.setPassword(PASSWORD);
		user.setEmail("user@test.com");

		ObjectMapper mapper = new ObjectMapper();

		mockMvc.perform(post("/api/users/signUp")
				.contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsBytes(user)));

		mockMvc.perform(post("/api/users/signUp")
				.contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsBytes(user)))
				.andExpect(status().isBadRequest());

	}

	@Test
	public void testLoginFromServiceToken_Ok() throws Exception {

		AuthenticatedUserDto authenticatedUser = createAuthenticatedUser("user");

		String serviceToken = authenticatedUser.getServiceToken();
		Long userId = authenticatedUser.getUserDto().getId();

		mockMvc.perform(post("/api/users/loginFromServiceToken")
				.requestAttr("userId", userId)
				.requestAttr("serviceToken", serviceToken)
				.contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isOk());

	}

	@Test
	public void testLoginFromServiceToken_InstanceNotFound() throws Exception {

		AuthenticatedUserDto user = createAuthenticatedUser("user");

		Long nonExistentUserId = Long.valueOf(-1);
		String serviceToken = user.getServiceToken();

		mockMvc.perform(post("/api/users/loginFromServiceToken")
				.requestAttr("userId", nonExistentUserId)
				.requestAttr("serviceToken", serviceToken)
				.contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isNotFound());

	}

	@Test
	public void testUpdateProfile_Ok() throws Exception {

		AuthenticatedUserDto authenticatedUser = createAuthenticatedUser("user");
		Long userId = authenticatedUser.getUserDto().getId();

		UserDto user = new UserDto();
		user.setUserName("user");
		user.setPassword(PASSWORD);
		user.setEmail("user@test.com");

		ObjectMapper mapper = new ObjectMapper();

		mockMvc.perform(put("/api/users/{userId}", userId)
				.header("Authorization", "Bearer " + authenticatedUser.getServiceToken())
				.contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsBytes(user)))
				.andExpect(status().isOk());
	}

	@Test
	public void testUpdateProfile_NotPermission() throws Exception {

		Users user1 = new Users("user1", "password", "user1@user1.com");

		AuthenticatedUserDto user2 = createAuthenticatedUser("user2");

		mockMvc.perform(put("/api/users/{userId}", user1.getId())
				.requestAttr("userId", user2.getUserDto().getId()))
				.andExpect(status().isForbidden());
	}

	@Test
	public void testChangePassword_Ok() throws Exception {

		AuthenticatedUserDto user = createAuthenticatedUser("user");

		ChangePasswordParamsDto changePassworParams = new ChangePasswordParamsDto();
		changePassworParams.setOldPassword(PASSWORD);
		changePassworParams.setNewPassword("newPassword");

		ObjectMapper mapper = new ObjectMapper();

		mockMvc.perform(post("/api/users/{userId}/changePassword", user.getUserDto().getId())
				.header("Authorization", "Bearer " + user.getServiceToken())
				.contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsBytes(changePassworParams)))
				.andExpect(status().isNoContent());

	}

	@Test
	public void testDeleteUser_Ok() throws Exception {

		AuthenticatedUserDto admin = createAuthenticatedUser("admin");

		Users user1 = new Users("user", "password", "noah@gmail.com");
		userDao.save(user1);

		mockMvc.perform(post("/api/users/" + user1.getId() + "/removeUser")
				.header("Authorization", "Bearer " + admin.getServiceToken())
				.contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isOk());
	}

}
