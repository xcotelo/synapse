package es.udc.fi.dc.fd.model.entities;

import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.CrudRepository;

import jakarta.transaction.Transactional;

/**
 * The Interface UserOnLeagueDao.
 */
public interface UserOnLeagueDao extends CrudRepository<UserOnLeague, Long> {

    /**
     * Get userOnLeague
     *
     * @param leagueId the league id
     * @param userId   the user id
     * @return the budget
     */
    @Query("SELECT u FROM UserOnLeague u WHERE u.league.id =?1 AND u.user.id =?2")
    UserOnLeague getUserOnLeague(Long leagueId, Long userId);

    /**
     * Find Users on Leagues by user id
     * 
     * @param userId the user id
     * @return the list
     */
    @Query("SELECT ul FROM UserOnLeague ul WHERE (ul.user.id = ?1) AND ul.isAccepted = false")
    List<UserOnLeague> findUsersInvited(Long userId);

    /**
     * Find invitations by user and league
     * 
     * @param userId   the user id
     * @param leagueId the league id
     * @return the list
     */
    @Query("SELECT ul FROM UserOnLeague ul WHERE ul.user.id = ?1 AND ul.league.id = ?2")
    Optional<UserOnLeague> findInvitation(Long userId, Long leagueId);

    /**
     * Update invitations to accept it
     * 
     * @param userId   the user id
     * @param leagueId the league id
     * @return the list
     */
    @Modifying
    @Transactional
    @Query("UPDATE UserOnLeague ul SET ul.isAccepted = ?2 WHERE ul.id = ?1")
    void updateIsAccepted(Long userOnLeagueId, boolean isAccepted);

    /**
     * Find Users who accepted invitations
     * 
     * @param leagueId the league id
     * @return the list
     */
    @Query("SELECT ul FROM UserOnLeague ul WHERE (ul.league.id = ?1) AND ul.isAccepted = true")
    List<UserOnLeague> findUsersAccepted(Long leagueId);
    
    /**
     * Delete userOnLeague by league id
     * 
     * @param leagueId the league id
     */
    void deleteByLeagueId(Long leagueId);

    /**
     * Check if a user belongs to any league.
     * 
     * @param userId the user id
     * @return true if the user belongs to any league, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(ul) > 0 THEN TRUE ELSE FALSE END FROM UserOnLeague ul WHERE ul.user.id = ?1")
    boolean existsByUserId(Long userId);

    /**
     * Delete userOnLeague by user id
     * 
     * @param userId the user id
    */
    void deleteByUserId(Long userId);
    
}