package es.udc.fi.dc.fd.model.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

/**
 * The Class UserOnLeague.
 */
@Entity
public class UserOnLeague {

    /** The id. */
    private Long id;

    /** The user. */
    private Users user;

    /** The league. */
    private League league;

    /** The budget. */
    private int budget;

    /** Indicate if user accepted the invitation. */
    private boolean isAccepted;

    /** The puntuation. */
    private int puntuation;

    

    /**
     * Instantiates a new UserOnLeague.
     */
    public UserOnLeague() {
    }

    /**
	 * Instantiates a new userOnLeague.
     * 
     * @param user       the user
     * @param league     the league
     * @param budget     the budget
     * @param isAccepted boolean isAccepted
     */
    public UserOnLeague(Users user, League league, int budget, boolean isAccepted) {
        this.user = user;
        this.league = league;
        this.budget = budget;
        this.isAccepted = isAccepted;
        this.puntuation = 0;
    }

    /**
     * Gets the id
     * 
     * @return the id
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    /**
     * Sets the id.
     *
     * @param id the new id
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * Gets the user.
     *
     * @return the user
     */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "userId")
    public Users getUser() {
        return user;
    }

    /**
     * Sets the user .
     *
     * @param user the new user
     */
    public void setUser(Users user) {
        this.user = user;
    }

	/**
	 * Gets the league.
	 *
	 * @return the league
	 */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "leagueId")
    public League getLeague() {
        return league;
    }

    /**
     * Sets the league.
     *
     * @param league the new league
     */
    public void setLeague(League league) {
        this.league = league;
    }

	/**
	 * Gets the budget.
	 *
	 * @return the budget
	 */
    public int getBudget() {
        return budget;
    }

	/**
	 * Sets the budget.
	 *
	 * @param budget the new budget
	 */
    public void setBudget(int budget) {
        this.budget = budget;
    }

	/**
	 * Gets the boolean isAccepted.
	 *
	 * @return the boolean isAccepted
	 */
    public boolean getIsAccepted() {
        return isAccepted;
    }

	/**
	 * Sets the boolean isAccepted.
	 *
	 * @param isAccepted the new isAccepted
	 */
    public void setIsAccepted(boolean isAccepted) {
        this.isAccepted = isAccepted;
    }
    /**
     * Gets the puntuation.
     * 
     * @return the puntuation
     *
    */
    public int getPuntuation() {
        return puntuation;
    }

    /**
     * Sets the puntuation.
     * @param puntuation
     */
    public void setPuntuation(int puntuation) {
        this.puntuation = puntuation;
    }
}
