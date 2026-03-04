package synapse.model.services.exceptions;

/**
 * Thrown when login credentials are invalid.
 * Only stores the userName — never the password, to prevent leakage in logs/stack traces.
 */
public class IncorrectLoginException extends Exception {

	private static final long serialVersionUID = 1L;

	private final String userName;

	/**
	 * @param userName the user name that failed authentication
	 */
	public IncorrectLoginException(String userName) {
		super("Incorrect login for user: " + userName);
		this.userName = userName;
	}

	public String getUserName() {
		return userName;
	}

}
