package es.udc.fi.dc.fd.model.services;

import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import es.udc.fi.dc.fd.model.common.exceptions.DuplicateInstanceException;
import es.udc.fi.dc.fd.model.common.exceptions.InstanceNotFoundException;
import es.udc.fi.dc.fd.model.entities.Users;
import es.udc.fi.dc.fd.model.entities.League;
import es.udc.fi.dc.fd.model.entities.RelationDao;
import es.udc.fi.dc.fd.model.entities.UserOnLeagueDao;
import es.udc.fi.dc.fd.model.entities.UserDao;
import es.udc.fi.dc.fd.model.entities.LeagueDao;
import es.udc.fi.dc.fd.model.entities.BidDao;
import es.udc.fi.dc.fd.model.services.exceptions.CannotDeleteAdminException;
import es.udc.fi.dc.fd.model.services.exceptions.CannotDeleteCreatorOfLeagueException;
import es.udc.fi.dc.fd.model.services.exceptions.IncorrectLoginException;
import es.udc.fi.dc.fd.model.services.exceptions.IncorrectPasswordException;


/**
 * The Class UserServiceImpl.
 */
@Service
@Transactional
public class UserServiceImpl implements UserService {

	/** The permission checker. */
	private PermissionChecker permissionChecker;
	/** The password encoder. */
	private BCryptPasswordEncoder passwordEncoder;
	/** The user dao. */
	private UserDao userDao;
	private final UserOnLeagueDao userOnLeagueDao;
	private final RelationDao relationDao;
	private final LeagueDao leagueDao;
	private final BidDao bidDao;

	public UserServiceImpl(PermissionChecker permissionChecker, BCryptPasswordEncoder passwordEncoder,
			UserDao userDao, RelationDao relationDao, UserOnLeagueDao userOnLeagueDao, LeagueDao leagueDao, BidDao bidDao) {
		this.permissionChecker = permissionChecker;
		this.passwordEncoder = passwordEncoder;
		this.userDao = userDao;
		this.relationDao = relationDao;
		this.userOnLeagueDao = userOnLeagueDao;
		this.leagueDao = leagueDao;
		this.bidDao = bidDao;
	}

	/**
	 * Sign up.
	 *
	 * @param user the user
	 * @throws DuplicateInstanceException the duplicate instance exception
	 */
	@Override
	public void signUp(Users user) throws DuplicateInstanceException {

		if (userDao.existsByUserName(user.getUserName())) {
			throw new DuplicateInstanceException("project.entities.user", user.getUserName());
		}

		user.setPassword(passwordEncoder.encode(user.getPassword()));
		user.setRole(Users.RoleType.USER);

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
	public Users login(String userName, String password) throws IncorrectLoginException {

		Optional<Users> user = userDao.findByUserName(userName);

		if (!user.isPresent()) {
			throw new IncorrectLoginException(userName, password);
		}

		if (!passwordEncoder.matches(password, user.get().getPassword())) {
			throw new IncorrectLoginException(userName, password);
		}

		return user.get();

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
	public Users loginFromId(Long id) throws InstanceNotFoundException {
		return permissionChecker.checkUser(id);
	}

	/**
	 * Update profile.
	 *
	 * @param id        the id
	 * @param firstName the first name
	 * @param lastName  the last name
	 * @param email     the email
	 * @return the user
	 * @throws InstanceNotFoundException the instance not found exception
	 */
	@Override
	public Users updateProfile(Long id, String firstName, String lastName, String email)
			throws InstanceNotFoundException {

		Users user = permissionChecker.checkUser(id);

		user.setFirstName(firstName);
		user.setLastName(lastName);
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

		Users user = permissionChecker.checkUser(id);

		if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
			throw new IncorrectPasswordException();
		} else {
			user.setPassword(passwordEncoder.encode(newPassword));
		}

	}

	@Override
	public Block<League> findLeaguesByUserId(Long id, Pageable pageable) {
		Slice<League> leagues = relationDao.findUserLeagues(id, pageable);

		return new Block<>(leagues.getContent(), leagues.hasNext());
	}

	/**
	 * Find all users
	 * 
	 * @param pageable the pageable
	 * @return the Block<Users>
	 */
	@Override
	public Block<Users> findAllUsers(Pageable pageable) {
		Slice<Users> users = userDao.find(pageable);
		return new Block<>(users.getContent(), users.hasNext());
	}
	
	@Override
	public void removeUser(Long userId) throws InstanceNotFoundException, CannotDeleteAdminException,CannotDeleteCreatorOfLeagueException {
		Users user = userDao.findById(userId).orElseThrow(() ->  new InstanceNotFoundException("project.entities.user", userId));
		
		if(user.getRole().name().equals("ADMIN")) {
			throw new CannotDeleteAdminException(userId);
		}
		
		if(leagueDao.isCreatorOfAnyLeague(userId)){
			throw new CannotDeleteCreatorOfLeagueException(userId);
		}
        
		if (userOnLeagueDao.existsByUserId(userId)) {
			bidDao.deleteByUserId(userId);
			relationDao.deleteByUserId(userId);
			userOnLeagueDao.deleteByUserId(userId);
		}
		
		userDao.delete(user);
	} 

}
