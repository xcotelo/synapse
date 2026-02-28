package synapse.model.services;

import static org.junit.Assert.assertEquals;

import java.util.Arrays;

import jakarta.transaction.Transactional;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;

import synapse.model.common.exceptions.DuplicateInstanceException;
import synapse.model.common.exceptions.InstanceNotFoundException;
import synapse.model.entities.Users;
import synapse.model.entities.Users.RoleType;
import synapse.model.entities.UserDao;
import synapse.model.services.Block;
import synapse.model.services.exceptions.CannotDeleteAdminException;
import synapse.model.services.exceptions.IncorrectLoginException;
import synapse.model.services.exceptions.IncorrectPasswordException;

/**
 * The Class UserServiceTest.
 */
@RunWith(SpringRunner.class)
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class UserServiceTest {

	@Rule
	public ExpectedException thrown = ExpectedException.none();

	private final Long NON_EXISTENT_ID = Long.valueOf(-1);

	@Autowired
	UserDao userDao;

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
		thrown.expect(DuplicateInstanceException.class);
		userService.signUp(user);

	}

	@Test
	public void testLoginFromNonExistentId() throws InstanceNotFoundException {
		thrown.expect(InstanceNotFoundException.class);
		userService.loginFromId(NON_EXISTENT_ID);
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
	public void testLoginWithIncorrectPassword() throws DuplicateInstanceException, IncorrectLoginException {

		Users user = createUser("user");
		String clearPassword = user.getPassword();

		userService.signUp(user);
		thrown.expect(IncorrectLoginException.class);
		userService.login(user.getUserName(), 'X' + clearPassword);

	}

	@Test
	public void testLoginWithNonExistentUserName() throws IncorrectLoginException {
		thrown.expect(IncorrectLoginException.class);
		userService.login("X", "Y");
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
	public void testUpdateProfileWithNonExistentId() throws InstanceNotFoundException {
		thrown.expect(InstanceNotFoundException.class);
		userService.updateProfile(NON_EXISTENT_ID, "X", "X", "X");
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
	public void testChangePasswordWithNonExistentId() throws InstanceNotFoundException, IncorrectPasswordException {
		thrown.expect(InstanceNotFoundException.class);
		userService.changePassword(NON_EXISTENT_ID, "X", "Y");
	}

	@Test
	public void testChangePasswordWithIncorrectPassword() throws DuplicateInstanceException, InstanceNotFoundException, IncorrectPasswordException {

		Users user = createUser("user");
		String oldPassword = user.getPassword();
		String newPassword = 'X' + oldPassword;

		userService.signUp(user);
		thrown.expect(IncorrectPasswordException.class);
		userService.changePassword(user.getId(), 'Y' + oldPassword, newPassword);

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
			throws InstanceNotFoundException, CannotDeleteAdminException {
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
	public void testRemoveUser_removeAdmin() throws InstanceNotFoundException, CannotDeleteAdminException {

		Users user1 = createUser("user1");
		user1.setRole(RoleType.ADMIN);
		userDao.save(user1);

		thrown.expect(CannotDeleteAdminException.class);
		userService.removeUser(user1.getId());

	}

}
