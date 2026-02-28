package synapse.model.services;

import synapse.model.common.exceptions.DuplicateInstanceException;
import synapse.model.common.exceptions.InstanceNotFoundException;
import synapse.model.entities.Users;
import synapse.model.services.exceptions.IncorrectLoginException;
import synapse.model.services.exceptions.IncorrectPasswordException;

/**
 * The Interface UserService.
 */
public interface UserService {

	/**
	 * Sign up.
	 *
	 * @param user the user
	 * @throws DuplicateInstanceException the duplicate instance exception
	 */
	void signUp(Users user) throws DuplicateInstanceException;

	/**
	 * Login.
	 *
	 * @param userName the user name
	 * @param password the password
	 * @return the user
	 * @throws IncorrectLoginException the incorrect login exception
	 */
	Users login(String userName, String password) throws IncorrectLoginException;

	/**
	 * Login from id.
	 *
	 * @param id the id
	 * @return the user
	 * @throws InstanceNotFoundException the instance not found exception
	 */
	Users loginFromId(Long id) throws InstanceNotFoundException;

	Users updateProfile(Long id, String email) throws InstanceNotFoundException;

	/**
	 * Change password.
	 *
	 * @param id          the id
	 * @param oldPassword the old password
	 * @param newPassword the new password
	 * @throws InstanceNotFoundException  the instance not found exception
	 * @throws IncorrectPasswordException the incorrect password exception
	 */
	void changePassword(Long id, String oldPassword, String newPassword)
			throws InstanceNotFoundException, IncorrectPasswordException;

	/**
	 * Delete the user
	 * 
	 * @param userId the user id
	 * @throws InstanceNotFoundException
	 */
	void removeUser(Long userId) throws InstanceNotFoundException;
}
