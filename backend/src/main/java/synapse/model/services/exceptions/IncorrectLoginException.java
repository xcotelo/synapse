package synapse.model.services.exceptions;

/**
 * The Class IncorrectLoginException.
 */
public class IncorrectLoginException extends Exception {

	private final String userName;

	/**
	 * Instantiates a new incorrect login exception.
	 * Only stores the userName — never the password, to prevent leakage in logs/stack traces.
	 *
	 * @param userName the user name that failed authentication
	 */
	public IncorrectLoginException(String userName) {
		this.userName = userName;
	}

	public String getUserName() {
		return userName;
	}

}
