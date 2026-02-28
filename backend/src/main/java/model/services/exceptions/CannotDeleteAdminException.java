package es.udc.fi.dc.fd.model.services.exceptions;

/**
 * The Class CannotDeleteAdminException.
 */
@SuppressWarnings("serial")
public class CannotDeleteAdminException extends Exception {

	/** The user id. */
	private Long userId;

	/**
	 * Instantiates a new cannot delete admin exception.
	 *
	 * @param userId the user id
	 */
	public CannotDeleteAdminException(Long userId) {
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
