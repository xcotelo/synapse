package synapse.model.services.exceptions;

/**
 * Thrown when the supplied password does not match the stored one.
 */
public class IncorrectPasswordException extends Exception {

	private static final long serialVersionUID = 1L;

	public IncorrectPasswordException() {
		super("The provided password is incorrect");
	}
}
