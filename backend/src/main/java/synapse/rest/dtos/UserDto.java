package synapse.rest.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * The Class UserDto.
 */
public class UserDto {

	/**
	 * The Interface AllValidations.
	 */
	public interface AllValidations {
	}

	/**
	 * The Interface UpdateValidations.
	 */
	public interface UpdateValidations {
	}

	/** The id. */
	private Long id;

	/** The user name. */
	private String userName;

	/** The password. */
	private String password;

	/** The email. */
	private String email;

	private int puntuation;

	/**
	 * Instantiates a new user dto.
	 */
	public UserDto() {
	}

	public UserDto(Long id, String userName, int puntuation) {
		this.id = id;
		this.userName = userName;
		this.puntuation = puntuation;
	}

	public UserDto(Long id, String userName) {
		this.id = id;
		this.userName = userName;
	}

	public UserDto(Long id, String userName, String email) {

		this.id = id;
		this.userName = userName != null ? userName.trim() : null;
		this.email = email.trim();

	}

	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
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
	 * Gets the user name.
	 *
	 * @return the user name
	 */
	@NotNull(groups = { AllValidations.class })
	@Size(min = 1, max = 60, groups = { AllValidations.class })
	public String getUserName() {
		return userName;
	}

	/**
	 * Sets the user name.
	 *
	 * @param userName the new user name
	 */
	public void setUserName(String userName) {
		this.userName = userName.trim();
	}

	/**
	 * Gets the password.
	 *
	 * @return the password
	 */
	@NotNull(groups = { AllValidations.class })
	@Size(min = 1, max = 60, groups = { AllValidations.class })
	public String getPassword() {
		return password;
	}

	/**
	 * Sets the password.
	 *
	 * @param password the new password
	 */
	public void setPassword(String password) {
		this.password = password;
	}

	/**
	 * Gets the email.
	 *
	 * @return the email
	 */
	@NotNull(groups = { AllValidations.class, UpdateValidations.class })
	@Size(min = 1, max = 60, groups = { AllValidations.class, UpdateValidations.class })
	@Email(groups = { AllValidations.class, UpdateValidations.class })
	public String getEmail() {
		return email;
	}

	/**
	 * Sets the email.
	 *
	 * @param email the new email
	 */
	public void setEmail(String email) {
		this.email = email.trim();
	}

	/**
	 * Gets the puntuation of the user.
	 *
	 * @return the puntuation of the user
	 */
	public int getPuntuation() {
		return puntuation;
	}

	/**
	 * Sets the puntuation of the user.
	 *
	 * @param puntuation the new puntuation of the user
	 */
	public void setPuntuation(int puntuation) {
		this.puntuation = puntuation;
	}
}
