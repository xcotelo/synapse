package es.udc.fi.dc.fd.rest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

import es.udc.fi.dc.fd.model.entities.Users;
import es.udc.fi.dc.fd.model.entities.Users.RoleType;
import es.udc.fi.dc.fd.model.entities.League;
import es.udc.fi.dc.fd.model.entities.LeagueDao;
import es.udc.fi.dc.fd.model.entities.Player;
import es.udc.fi.dc.fd.model.entities.Player.PositionType;
import es.udc.fi.dc.fd.model.entities.PlayerDao;
import es.udc.fi.dc.fd.model.entities.Relation;
import es.udc.fi.dc.fd.model.entities.RelationDao;
import es.udc.fi.dc.fd.model.entities.Team;
import es.udc.fi.dc.fd.model.entities.TeamDao;
import es.udc.fi.dc.fd.model.entities.UserDao;
import es.udc.fi.dc.fd.model.entities.UserOnLeague;
import es.udc.fi.dc.fd.model.entities.UserOnLeagueDao;
import es.udc.fi.dc.fd.model.services.exceptions.IncorrectLoginException;


import es.udc.fi.dc.fd.rest.controllers.UserController;

import es.udc.fi.dc.fd.rest.dtos.AuthenticatedUserDto;
import es.udc.fi.dc.fd.rest.dtos.LoginParamsDto;
import es.udc.fi.dc.fd.rest.dtos.ChangePasswordParamsDto;
import es.udc.fi.dc.fd.rest.dtos.UserDto;

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

	@Autowired
	PlayerDao playerDao;

	@Autowired
	TeamDao teamDao;

	@Autowired
	LeagueDao leagueDao;

	@Autowired
	RelationDao relationDao;

	@Autowired
	UserOnLeagueDao userOnLeagueDao;

	/** The user controller. */
	@Autowired
	private UserController userController;

	/**
	 * Creates the authenticated user.
	 *
	 * @param userName the user name
	 * @param roleType the role type
	 * @return the authenticated user dto
	 * @throws IncorrectLoginException the incorrect login exception
	 */
	private AuthenticatedUserDto createAuthenticatedUser(String userName, RoleType roleType)
			throws IncorrectLoginException {

		Users user = new Users(userName, PASSWORD, "newUser", "user", "user@test.com");

		user.setPassword(passwordEncoder.encode(user.getPassword()));
		user.setRole(roleType);

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

		AuthenticatedUserDto user = createAuthenticatedUser("admin", RoleType.USER);

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
		user.setFirstName("firtsname");
		user.setLastName("lastname");
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
		user.setFirstName("firtsname");
		user.setLastName("lastname");
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

		AuthenticatedUserDto authenticatedUser = createAuthenticatedUser("user", RoleType.USER);

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

		AuthenticatedUserDto user = createAuthenticatedUser("user", RoleType.USER);

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

		AuthenticatedUserDto authenticatedUser = createAuthenticatedUser("user", RoleType.USER);
		Long userId = authenticatedUser.getUserDto().getId();

		UserDto user = new UserDto();
		user.setUserName("user");
		user.setPassword(PASSWORD);
		user.setFirstName("firtsname");
		user.setLastName("lastname");
		user.setEmail("user@test.com");

		ObjectMapper mapper = new ObjectMapper();

		mockMvc.perform(put("/api/users/{userId}", userId)
				.header("Authorization", "Bearer " + authenticatedUser.getServiceToken())
				.contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsBytes(user)))
				.andExpect(status().isOk());
	}

	@Test
	public void testUpdateProfile_NotPermission() throws Exception {

		Users user1 = new Users("user1", "password", "firstName", "lastName",
				"user1@user1.com");

		AuthenticatedUserDto user2 = createAuthenticatedUser("user2", RoleType.USER);

		mockMvc.perform(put("/api/users/{userId}", user1.getId())
				.requestAttr("userId", user2.getUserDto().getId()))
				.andExpect(status().isForbidden());
	}

	@Test
	public void testChangePassword_Ok() throws Exception {

		AuthenticatedUserDto user = createAuthenticatedUser("user", RoleType.USER);

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
	public void testGetLeaguesFromUser_Ok() throws Exception {
		AuthenticatedUserDto user = createAuthenticatedUser("user", RoleType.USER);

		mockMvc.perform(get("/api/users/{userId}/leagues", user.getUserDto().getId())
				.header("Authorization", "Bearer " + user.getServiceToken())
				.contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isOk());
	}

	@Test
	public void testGetAllUsersAdmin_Ok() throws Exception {
		AuthenticatedUserDto admin = createAuthenticatedUser("admin", RoleType.ADMIN);

		mockMvc.perform(get("/api/users/allUsers", admin.getUserDto().getId())
				.header("Authorization", "Bearer " + admin.getServiceToken())
				.contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isOk());
	}

	
	
	@Test
	public void testDeleteUserWithoutLeagues_Ok() throws Exception {

		AuthenticatedUserDto admin = createAuthenticatedUser("user", RoleType.ADMIN);
		 
		Users user1 =  new Users("user", "password", "firstName", "lastName", "noah@gmail.com");
		user1.setRole(RoleType.USER);
		userDao.save(user1);

		mockMvc.perform(post("/api/users/" + user1.getId() + "/removeUser")
				.header("Authorization", "Bearer " + admin.getServiceToken())
				.contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isOk());
	}

	@Test
	public void testDeleteUserWithLeagues_Ok() throws Exception {

		AuthenticatedUserDto admin = createAuthenticatedUser("user", RoleType.ADMIN);
		 
		Users user1 =  new Users("user", "password", "firstName", "lastName", "noah@gmail.com");
		
		user1.setRole(RoleType.USER);
		userDao.save(user1);

		Users user2 =  new Users("user2", "password", "firstName", "lastName", "martin@gmail.com");
		
		user2.setRole(RoleType.USER);
		userDao.save(user2);

		League league = new League("TestLiga", user1, 9, 7, 15, 8, 8, "Waterpolo_1.png", 50000, 30);
		leagueDao.save(league);

		Team team = new Team("Equipo", "Team1.png");
		teamDao.save(team);

		Player player1 = new Player("player1", "lastName", PositionType.PORTERO, 25, 10, team, "",
				"Waterpolo_6.png", 5000);
		playerDao.save(player1);

		Relation relation1 = new Relation(league, player1, user1);
		relationDao.save(relation1);

		UserOnLeague userOnLeague = new UserOnLeague(user1, league, 5000, true);
		userOnLeagueDao.save(userOnLeague);
		
		Relation relation2 = new Relation(league, player1, user2);
		relationDao.save(relation2);

		UserOnLeague userOnLeague2 = new UserOnLeague(user2, league, 5000, true);
		userOnLeagueDao.save(userOnLeague2);

		mockMvc.perform(post("/api/users/" + user2.getId() + "/removeUser")
				.header("Authorization", "Bearer " + admin.getServiceToken())
				.contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isOk());
	}

	@Test
	public void testDeleteAdmin_FORBIDDEN() throws Exception {

		AuthenticatedUserDto admin = createAuthenticatedUser("user", RoleType.ADMIN);
		 
		Users user1 =  new Users("user", "password", "firstName", "lastName", "noah@gmail.com");
		user1.setRole(RoleType.ADMIN);
		userDao.save(user1);

		mockMvc.perform(post("/api/users/" + user1.getId() + "/removeUser")
				.header("Authorization", "Bearer " + admin.getServiceToken())
				.contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isForbidden());
	}

	@Test
	public void testDeleteCreatorOfLeagues_Ok() throws Exception {

		AuthenticatedUserDto admin = createAuthenticatedUser("user", RoleType.ADMIN);
		 
		Users user1 =  new Users("user", "password", "firstName", "lastName", "noah@gmail.com");
		
		user1.setRole(RoleType.USER);
		userDao.save(user1);

		League league = new League("TestLiga", user1, 9, 7, 15, 8, 8, "Waterpolo_1.png", 50000, 30);
		leagueDao.save(league);

		Team team = new Team("Equipo", "Team1.png");
		teamDao.save(team);

		Player player1 = new Player("player1", "lastName", PositionType.PORTERO, 25, 10, team, "",
				"Waterpolo_6.png", 5000);
		playerDao.save(player1);

		Relation relation1 = new Relation(league, player1, user1);
		relationDao.save(relation1);

		UserOnLeague userOnLeague = new UserOnLeague(user1, league, 5000, true);
		userOnLeagueDao.save(userOnLeague);
		
		mockMvc.perform(post("/api/users/" + user1.getId() + "/removeUser")
				.header("Authorization", "Bearer " + admin.getServiceToken())
				.contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isForbidden());
	}

}
