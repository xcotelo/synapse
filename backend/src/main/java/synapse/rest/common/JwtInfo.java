package synapse.rest.common;

/**
 * The Class JwtInfo.
 */
public class JwtInfo {

	/** The user id. */
	private Long userId;

	/** The user name. */
	private String userName;

	/**
	 * Instantiates a new jwt info.
	 *
	 * @param userId   the user id
	 * @param userName the user name
	 */
	public JwtInfo(Long userId, String userName) {

		this.userId = userId;
		this.userName = userName;

	}

	/**
	 * Gets the user id.
	 *
	 * @return the user id
	 */
	public Long getUserId() {
		return userId;
	}

	/**
	 * Sets the user id.
	 *
	 * @param userId the new user id
	 */
	public void setUserId(Long userId) {
		this.userId = userId;
	}

	/**
	 * Gets the user name.
	 *
	 * @return the user name
	 */
	public String getUserName() {
		return userName;
	}

	/**
	 * Sets the user name.
	 *
	 * @param userName the new user name
	 */
	public void setUserName(String userName) {
		this.userName = userName;
	}

}
