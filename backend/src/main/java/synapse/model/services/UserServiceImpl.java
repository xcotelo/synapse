package synapse.model.services;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import synapse.model.common.exceptions.DuplicateInstanceException;
import synapse.model.common.exceptions.InstanceNotFoundException;
import synapse.model.entities.User;
import synapse.model.entities.UserDao;
import synapse.model.services.exceptions.IncorrectLoginException;
import synapse.model.services.exceptions.IncorrectPasswordException;

/**
 * The Class UserServiceImpl.
 */
@Service
@Transactional
@SuppressWarnings("null")
public class UserServiceImpl implements UserService {

	/** The permission checker. */
	private PermissionChecker permissionChecker;
	/** The password encoder. */
	private BCryptPasswordEncoder passwordEncoder;
	/** The user dao. */
	private UserDao userDao;

	public UserServiceImpl(PermissionChecker permissionChecker, BCryptPasswordEncoder passwordEncoder,
			UserDao userDao) {
		this.permissionChecker = permissionChecker;
		this.passwordEncoder = passwordEncoder;
		this.userDao = userDao;
	}

	/**
	 * Sign up.
	 *
	 * @param user the user
	 * @throws DuplicateInstanceException the duplicate instance exception
	 */
	@Override
	public void signUp(User user) throws DuplicateInstanceException {

		if (userDao.existsByUserName(user.getUserName())) {
			throw new DuplicateInstanceException("project.entities.user", user.getUserName());
		}

		user.setPassword(passwordEncoder.encode(user.getPassword()));

		userDao.save(user);

	}

	/**
	 * Login.
	 *
	 * @param userName the user name
	 * @param password the password
	 * @return the user
	 * @throws IncorrectLoginException the incorrect login exception
	 */
	@Override
	@Transactional(readOnly = true)
	public User login(String userName, String password) throws IncorrectLoginException {

		User user = userDao.findByUserName(userName)
				.orElseThrow(() -> new IncorrectLoginException(userName));

		if (!passwordEncoder.matches(password, user.getPassword())) {
			throw new IncorrectLoginException(userName);
		}

		return user;

	}

	/**
	 * Login from id.
	 *
	 * @param id the id
	 * @return the user
	 * @throws InstanceNotFoundException the instance not found exception
	 */
	@Override
	@Transactional(readOnly = true)
	public User loginFromId(Long id) throws InstanceNotFoundException {
		return permissionChecker.checkUser(id);
	}

	/**
	 * Update profile.
	 *
	 * @param id    the id
	 * @param email the email
	 * @return the user
	 * @throws InstanceNotFoundException the instance not found exception
	 */
	@Override
	public User updateProfile(Long id, String email)
			throws InstanceNotFoundException {

		User user = permissionChecker.checkUser(id);

		user.setEmail(email);

		return user;

	}

	/**
	 * Change password.
	 *
	 * @param id          the id
	 * @param oldPassword the old password
	 * @param newPassword the new password
	 * @throws InstanceNotFoundException  the instance not found exception
	 * @throws IncorrectPasswordException the incorrect password exception
	 */
	@Override
	public void changePassword(Long id, String oldPassword, String newPassword)
			throws InstanceNotFoundException, IncorrectPasswordException {

		User user = permissionChecker.checkUser(id);

		if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
			throw new IncorrectPasswordException();
		} else {
			user.setPassword(passwordEncoder.encode(newPassword));
		}

	}

	@Override
	public void removeUser(Long userId) throws InstanceNotFoundException {

		User user = permissionChecker.checkUser(userId);

		userDao.delete(user);
	}

}
