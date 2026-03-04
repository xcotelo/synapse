package synapse.model.services.exceptions;

/**
 * Thrown when attempting to delete the admin user.
 */
public class CannotDeleteAdminException extends Exception {

	private static final long serialVersionUID = 1L;

	/** The user id. */
	private final Long userId;

	/**
	 * Instantiates a new cannot delete admin exception.
	 *
	 * @param userId the user id
	 */
	public CannotDeleteAdminException(Long userId) {
		super("Cannot delete admin user with id: " + userId);
		this.userId = userId;
	}

	/**
	 * Gets the user id.
	 *
	 * @return the user id
	 */
	public Long getUserId() {
		return userId;
	}

}
