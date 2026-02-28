package synapse.model.services;

import static org.junit.Assert.assertEquals;

import jakarta.transaction.Transactional;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;

import synapse.model.common.exceptions.DuplicateInstanceException;
import synapse.model.common.exceptions.InstanceNotFoundException;
import synapse.model.entities.Users;
import synapse.model.entities.UserDao;
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
		return new Users(userName, "password", userName + "@" + userName + ".com");
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

		user.setEmail('X' + user.getEmail());

		userService.updateProfile(user.getId(), 'X' + user.getEmail());

		Users updatedUser = userService.loginFromId(user.getId());

		assertEquals(user, updatedUser);

	}

	@Test
	public void testUpdateProfileWithNonExistentId() throws InstanceNotFoundException {
		thrown.expect(InstanceNotFoundException.class);
		userService.updateProfile(NON_EXISTENT_ID, "X");
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
	public void testChangePasswordWithIncorrectPassword()
			throws DuplicateInstanceException, InstanceNotFoundException, IncorrectPasswordException {

		Users user = createUser("user");
		String oldPassword = user.getPassword();
		String newPassword = 'X' + oldPassword;

		userService.signUp(user);
		thrown.expect(IncorrectPasswordException.class);
		userService.changePassword(user.getId(), 'Y' + oldPassword, newPassword);

	}

}
