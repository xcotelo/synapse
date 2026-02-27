package es.udc.fi.dc.fd.model.services;

import static org.junit.Assert.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Arrays;
import java.util.List;

import jakarta.transaction.Transactional;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;

import es.udc.fi.dc.fd.model.common.exceptions.DuplicateInstanceException;
import es.udc.fi.dc.fd.model.common.exceptions.InstanceNotFoundException;
import es.udc.fi.dc.fd.model.entities.League;
import es.udc.fi.dc.fd.model.entities.LeagueDao;
import es.udc.fi.dc.fd.model.entities.Player;
import es.udc.fi.dc.fd.model.entities.Player.PositionType;
import es.udc.fi.dc.fd.model.entities.Users.RoleType;
import es.udc.fi.dc.fd.model.entities.PlayerDao;
import es.udc.fi.dc.fd.model.entities.Relation;
import es.udc.fi.dc.fd.model.entities.RelationDao;
import es.udc.fi.dc.fd.model.entities.Team;
import es.udc.fi.dc.fd.model.entities.TeamDao;
import es.udc.fi.dc.fd.model.entities.UserDao;
import es.udc.fi.dc.fd.model.entities.UserOnLeague;
import es.udc.fi.dc.fd.model.entities.UserOnLeagueDao;
import es.udc.fi.dc.fd.model.entities.Users;
import es.udc.fi.dc.fd.model.services.exceptions.CannotDeleteAdminException;
import es.udc.fi.dc.fd.model.services.exceptions.CannotDeleteCreatorOfLeagueException;
import es.udc.fi.dc.fd.model.services.exceptions.IncorrectLoginException;
import es.udc.fi.dc.fd.model.services.exceptions.IncorrectPasswordException;

/**
 * The Class UserServiceTest.
 */
@RunWith(SpringRunner.class)
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class UserServiceTest {

	private final Long NON_EXISTENT_ID = Long.valueOf(-1);

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

	/** The user service. */
	@Autowired
	private UserService userService;

	/**
	 * Creates the user.
	 *
	 * @param userName the user name
	 * @return the user
	 */
	private Users createUser(String userName) {
		return new Users(userName, "password", "firstName", "lastName", userName + "@" + userName + ".com");
	}

	/**
	 * Test sign up and login from id.
	 *
	 * @throws DuplicateInstanceException the duplicate instance exception
	 * @throws InstanceNotFoundException  the instance not found exception
	 */
	@Test
	public void testSignUpAndLoginFromId() throws DuplicateInstanceException, InstanceNotFoundException {

		Users user = createUser("user");

		userService.signUp(user);

		Users loggedInUser = userService.loginFromId(user.getId());

		assertEquals(user, loggedInUser);
		assertEquals(Users.RoleType.USER, user.getRole());

	}

	@Test
	public void testSignUpDuplicatedUserName() throws DuplicateInstanceException {

		Users user = createUser("user");

		userService.signUp(user);
		assertThrows(DuplicateInstanceException.class, () -> userService.signUp(user));

	}

	@Test
	public void testLoginFromNonExistentId() {
		assertThrows(InstanceNotFoundException.class, () -> userService.loginFromId(NON_EXISTENT_ID));
	}

	@Test
	public void testLogin() throws DuplicateInstanceException, IncorrectLoginException {

		Users user = createUser("user");
		String clearPassword = user.getPassword();

		userService.signUp(user);

		Users loggedInUser = userService.login(user.getUserName(), clearPassword);

		assertEquals(user, loggedInUser);

	}

	@Test
	public void testLoginWithIncorrectPassword() throws DuplicateInstanceException {

		Users user = createUser("user");
		String clearPassword = user.getPassword();

		userService.signUp(user);
		assertThrows(IncorrectLoginException.class, () -> userService.login(user.getUserName(), 'X' + clearPassword));

	}

	@Test
	public void testLoginWithNonExistentUserName() {
		assertThrows(IncorrectLoginException.class, () -> userService.login("X", "Y"));
	}

	@Test
	public void testUpdateProfile() throws InstanceNotFoundException, DuplicateInstanceException {

		Users user = createUser("user");

		userService.signUp(user);

		user.setFirstName('X' + user.getFirstName());
		user.setLastName('X' + user.getLastName());
		user.setEmail('X' + user.getEmail());

		userService.updateProfile(user.getId(), 'X' + user.getFirstName(), 'X' + user.getLastName(),
				'X' + user.getEmail());

		Users updatedUser = userService.loginFromId(user.getId());

		assertEquals(user, updatedUser);

	}

	@Test
	public void testUpdateProfileWithNonExistentId() {
		assertThrows(InstanceNotFoundException.class, () -> userService.updateProfile(NON_EXISTENT_ID, "X", "X", "X"));
	}

	@Test
	public void testChangePassword() throws DuplicateInstanceException, InstanceNotFoundException,
			IncorrectPasswordException, IncorrectLoginException {

		Users user = createUser("user");
		String oldPassword = user.getPassword();
		String newPassword = 'X' + oldPassword;

		userService.signUp(user);
		userService.changePassword(user.getId(), oldPassword, newPassword);
		Users loggedUser = userService.login(user.getUserName(), newPassword);

		assertEquals(user.getId(), loggedUser.getId());

	}

	@Test
	public void testChangePasswordWithNonExistentId() {
		assertThrows(InstanceNotFoundException.class, () -> userService.changePassword(NON_EXISTENT_ID, "X", "Y"));
	}

	@Test
	public void testChangePasswordWithIncorrectPassword() throws DuplicateInstanceException {

		Users user = createUser("user");
		String oldPassword = user.getPassword();
		String newPassword = 'X' + oldPassword;

		userService.signUp(user);
		assertThrows(IncorrectPasswordException.class,
				() -> userService.changePassword(user.getId(), 'Y' + oldPassword, newPassword));

	}

	@Test
	public void testFindLeaguesFromUser() {

		Users user = createUser("user");
		user.setRole(RoleType.USER);
		userDao.save(user);

		Team team = new Team("team", "Team1.png");
		teamDao.save(team);

		Player player = new Player("player", "lastName", PositionType.LATERAL_I, 25, 10, team, "", "Waterpolo_6.png",
				5000);
		playerDao.save(player);

		League league1 = new League("league1", user, 7, 5, 15, 7, 7, "League1.png", 50000, 30);
		leagueDao.save(league1);
		League league2 = new League("league2", user, 7, 5, 15, 7, 7, "League1.png", 50000, 30);
		leagueDao.save(league2);

		Relation relation1 = new Relation(league1, player, user);
		relationDao.save(relation1);
		Relation relation2 = new Relation(league2, player, user);
		relationDao.save(relation2);

		Block<League> expectedBlock = new Block<>(Arrays.asList(league1, league2), false);
		Block<League> aux = userService.findLeaguesByUserId(user.getId(), PageRequest.of(0, 5));
		assertEquals(expectedBlock.getItems(), aux.getItems());
	}

	@Test
	public void testFindAllUsersAdmin() {

		Users user1 = createUser("user1");
		user1.setRole(RoleType.USER);
		userDao.save(user1);

		Users user2 = createUser("user2");
		user2.setRole(RoleType.USER);
		userDao.save(user2);

		Users user3 = createUser("user3");
		user3.setRole(RoleType.USER);
		userDao.save(user3);

		Users user4 = createUser("user4");
		user4.setRole(RoleType.ADMIN);
		userDao.save(user4);

		Block<Users> expectedBlock = new Block<>(Arrays.asList(user1, user2, user3), false);
		Block<Users> actualBlock = userService.findAllUsers(PageRequest.of(0, 5));
		assertEquals(expectedBlock.getItems(), actualBlock.getItems());
	}

	@Test
	public void removeUser_withoutLeagues()
			throws InstanceNotFoundException, CannotDeleteAdminException, CannotDeleteCreatorOfLeagueException {
		Users user1 = createUser("user1");
		user1.setRole(RoleType.USER);
		userDao.save(user1);

		Users user2 = createUser("user2");
		user2.setRole(RoleType.USER);
		userDao.save(user2);

		Block<Users> expectedBlock = new Block<>(Arrays.asList(user1, user2), false);
		Block<Users> actualBlock = userService.findAllUsers(PageRequest.of(0, 5));
		assertEquals(expectedBlock.getItems(), actualBlock.getItems());

		userService.removeUser(user1.getId());
		Block<Users> expectedBlock2 = new Block<>(Arrays.asList(user2), false);
		Block<Users> actualBlock2 = userService.findAllUsers(PageRequest.of(0, 5));
		assertEquals(expectedBlock2.getItems(), actualBlock2.getItems());

	}

	@Test
	public void testRemoveUser_withLeagues() throws InstanceNotFoundException, CannotDeleteAdminException, CannotDeleteCreatorOfLeagueException {
		Users user1 = createUser("user1");
		user1.setRole(RoleType.USER);
		userDao.save(user1);

		Users user2 = createUser("user2");
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
		
		List<UserOnLeague> before = userOnLeagueDao.findUsersAccepted(league.getId()); 
		assertEquals(2,before.size());

		userService.removeUser(user2.getId());
		List<UserOnLeague> after = userOnLeagueDao.findUsersAccepted(league.getId()); 
		assertEquals(1,after.size());

	}

	@Test
	public void testRemoveUser_removeAdmin() throws CannotDeleteAdminException {

		Users user1 = createUser("user1");
		user1.setRole(RoleType.ADMIN);
		userDao.save(user1);

		assertThrows(CannotDeleteAdminException.class, () -> {
			userService.removeUser(user1.getId());
		});

	}

	@Test
	public void testRemoveUser_creatorOfLeague() throws CannotDeleteCreatorOfLeagueException {

		Users user1 = createUser("user1");
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
		
		assertThrows(CannotDeleteCreatorOfLeagueException.class, () -> {
			userService.removeUser(user1.getId());
		});
	}
 
}