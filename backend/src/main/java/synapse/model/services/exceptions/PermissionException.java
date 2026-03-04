package synapse.model.services.exceptions;

/**
 * Thrown when a user attempts to access a resource they do not own.
 */
public class PermissionException extends Exception {

	private static final long serialVersionUID = 1L;

	public PermissionException() {
		super("User does not have permission to access this resource");
	}
}
