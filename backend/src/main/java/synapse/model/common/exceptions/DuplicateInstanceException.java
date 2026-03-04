package synapse.model.common.exceptions;

/**
 * The Class DuplicateInstanceException.
 */

public class DuplicateInstanceException extends InstanceException {

    private static final long serialVersionUID = 1L;

    /**
     * Instantiates a new duplicate instance exception.
     *
     * @param name the name
     * @param key the key
     */
    public DuplicateInstanceException(String name, Object key) {
    	super(name, key); 	
    }
    
}
