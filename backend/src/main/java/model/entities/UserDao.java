package es.udc.fi.dc.fd.model.entities;

import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * The Interface UserDao.
 */
public interface UserDao extends JpaRepository<Users, Long> {

	/**
	 * Exists by user name.
	 *
	 * @param userName the user name
	 * @return true, if successful
	 */
	boolean existsByUserName(String userName);

	/**
	 * Find by user name.
	 *
	 * @param userName the user name
	 * @return the optional
	 */
	Optional<Users> findByUserName(String userName);


    /**
     * Find all players with no admin role
     * 
     * @param pageable the pageable
     * @return the slice
     */
    @Query("SELECT u FROM Users u WHERE u.role <> ADMIN")
    Slice<Users> find(Pageable pageable);

}
