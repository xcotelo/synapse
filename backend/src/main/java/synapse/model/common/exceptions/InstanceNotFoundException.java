package synapse.model.common.exceptions;

/**
 * The Class InstanceNotFoundException.
 */
public class InstanceNotFoundException extends InstanceException {

    private static final long serialVersionUID = 1L;
    
    /**
     * Instantiates a new instance not found exception.
     *
     * @param name the name
     * @param key the key
     */
    public InstanceNotFoundException(String name, Object key) {
    	super(name, key); 	
    }

}
