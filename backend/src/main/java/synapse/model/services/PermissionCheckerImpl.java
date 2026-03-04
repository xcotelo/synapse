package synapse.model.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import synapse.model.common.exceptions.InstanceNotFoundException;
import synapse.model.entities.User;
import synapse.model.entities.UserDao;


/**
 * The Class PermissionCheckerImpl.
 */
@Service
@Transactional(readOnly=true)
@SuppressWarnings("null")
public class PermissionCheckerImpl implements PermissionChecker {

	private final UserDao userDao;

	public PermissionCheckerImpl(UserDao userDao) {
		this.userDao = userDao;
	}
	
	@Override
	public void checkUserExists(Long userId) throws InstanceNotFoundException {
		
		if (!userDao.existsById(userId)) {
			throw new InstanceNotFoundException("project.entities.user", userId);
		}
		
	}

	@Override
	public User checkUser(Long userId) throws InstanceNotFoundException {

		return userDao.findById(userId)
				.orElseThrow(() -> new InstanceNotFoundException("project.entities.user", userId));

	}

}
