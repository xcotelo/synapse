package synapse.rest.controllers;

import static synapse.rest.dtos.UserConversor.toAuthenticatedUserDto;
import static synapse.rest.dtos.UserConversor.toUser;
import static synapse.rest.dtos.UserConversor.toUserDto;



import static synapse.rest.dtos.UserConversor.toUserAllDtos;

import java.net.URI;
import java.util.Locale;

import org.springframework.context.MessageSource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import synapse.model.common.exceptions.DuplicateInstanceException;
import synapse.model.common.exceptions.InstanceNotFoundException;
import synapse.model.entities.Users;
import synapse.model.services.exceptions.IncorrectLoginException;
import synapse.model.services.exceptions.IncorrectPasswordException;
import synapse.model.services.exceptions.PermissionException;
import synapse.model.services.exceptions.CannotDeleteAdminException;
import synapse.model.services.Block;
import synapse.model.services.UserService;
import synapse.rest.common.ErrorsDto;
import synapse.rest.common.JwtGenerator;
import synapse.rest.common.JwtInfo;
import synapse.rest.dtos.AuthenticatedUserDto;
import synapse.rest.dtos.BlockDto;
import synapse.rest.dtos.ChangePasswordParamsDto;
import synapse.rest.dtos.LoginParamsDto;
import synapse.rest.dtos.UserDto;

/**
 * The Class UserController.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

	/** The Constant INCORRECT_LOGIN_EXCEPTION_CODE. */
	private static final String INCORRECT_LOGIN_EXCEPTION_CODE = "project.exceptions.IncorrectLoginException";

	/** The Constant INCORRECT_PASSWORD_EXCEPTION_CODE. */
	private static final String INCORRECT_PASS_EXCEPTION_CODE = "project.exceptions.IncorrectPasswordException";

	private static final String CANNOT_DELETE_ADMIN_EXCEPTION = "project.exceptions.CannotDeleteAdminException";
	/** The message source. */
	private final MessageSource messageSource;
	/** The jwt generator. */
	private final JwtGenerator jwtGenerator;
	/** The user service. */
	private final UserService userService;

	public UserController(MessageSource messageSource, JwtGenerator jwtGenerator, UserService userService) {

		this.messageSource = messageSource;
		this.jwtGenerator = jwtGenerator;
		this.userService = userService;
	}

	/**
	 * Handle incorrect login exception.
	 *
	 * @param exception the exception
	 * @param locale    the locale
	 * @return the errors dto
	 */
	@ExceptionHandler(IncorrectLoginException.class)
	@ResponseStatus(HttpStatus.NOT_FOUND)
	public ErrorsDto handleIncorrectLoginException(IncorrectLoginException exception, Locale locale) {

		String errorMessage = messageSource.getMessage(INCORRECT_LOGIN_EXCEPTION_CODE, null,
				INCORRECT_LOGIN_EXCEPTION_CODE, locale);

		return new ErrorsDto(errorMessage);

		
	}

	/**
	 * Handle incorrect password exception.
	 *
	 * @param exception the exception
	 * @param locale    the locale
	 * @return the errors dto
	 */
	@ExceptionHandler(IncorrectPasswordException.class)
	@ResponseStatus(HttpStatus.NOT_FOUND)
	public ErrorsDto handleIncorrectPasswordException(IncorrectPasswordException exception, Locale locale) {

		String errorMessage = messageSource.getMessage(INCORRECT_PASS_EXCEPTION_CODE, null,
				INCORRECT_PASS_EXCEPTION_CODE, locale);

		return new ErrorsDto(errorMessage);

	}
	/**
	 * Handle cannot delete admin user.
	 *
	 * @param exception the exception
	 * @param locale    the locale
	 * @return the errors dto
	 */
	@ExceptionHandler(CannotDeleteAdminException.class)
	@ResponseStatus(HttpStatus.FORBIDDEN)
	public ErrorsDto handleCannotDeleteAdminException( CannotDeleteAdminException exception, Locale locale) {

		String errorMessage = messageSource.getMessage(CANNOT_DELETE_ADMIN_EXCEPTION, new Object[] { exception.getUserId() },
		CANNOT_DELETE_ADMIN_EXCEPTION, locale);

		return new ErrorsDto(errorMessage);
	}

	/**
	 * Sign up.
	 *
	 * @param userDto the user dto
	 * @return the response entity
	 * @throws DuplicateInstanceException the duplicate instance exception
	 */
	@PostMapping("/signUp")
	public ResponseEntity<AuthenticatedUserDto> signUp(
			@Validated({ UserDto.AllValidations.class }) @RequestBody UserDto userDto)
			throws DuplicateInstanceException {

		Users user = toUser(userDto);

		userService.signUp(user);

		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(user.getId())
				.toUri();

		return ResponseEntity.created(location).body(toAuthenticatedUserDto(generateServiceToken(user), user));

	}

	/**
	 * Login.
	 *
	 * @param params the params
	 * @return the authenticated user dto
	 * @throws IncorrectLoginException the incorrect login exception
	 */
	@PostMapping("/login")
	public AuthenticatedUserDto login(@Validated @RequestBody LoginParamsDto params) throws IncorrectLoginException {

		Users user = userService.login(params.getUserName(), params.getPassword());

		return toAuthenticatedUserDto(generateServiceToken(user), user);

	}

	/**
	 * Login from service token.
	 *
	 * @param userId       the user id
	 * @param serviceToken the service token
	 * @return the authenticated user dto
	 * @throws InstanceNotFoundException the instance not found exception
	 */
	@PostMapping("/loginFromServiceToken")
	public AuthenticatedUserDto loginFromServiceToken(@RequestAttribute Long userId,
			@RequestAttribute String serviceToken) throws InstanceNotFoundException {

		Users user = userService.loginFromId(userId);

		return toAuthenticatedUserDto(serviceToken, user);

	}

	/**
	 * Update profile.
	 *
	 * @param userId  the user id
	 * @param id      the id
	 * @param userDto the user dto
	 * @return the user dto
	 * @throws InstanceNotFoundException the instance not found exception
	 * @throws PermissionException       the permission exception
	 */
	@PutMapping("/{id}")
	public UserDto updateProfile(@RequestAttribute Long userId, @PathVariable("id") Long id,
			@Validated({ UserDto.UpdateValidations.class }) @RequestBody UserDto userDto)
			throws InstanceNotFoundException, PermissionException {

		if (!id.equals(userId)) {
			throw new PermissionException();
		}

		return toUserDto(
				userService.updateProfile(id, userDto.getFirstName(), userDto.getLastName(), userDto.getEmail()));

	}

	/**
	 * Change password.
	 *
	 * @param userId the user id
	 * @param id     the id
	 * @param params the params
	 * @throws PermissionException        the permission exception
	 * @throws InstanceNotFoundException  the instance not found exception
	 * @throws IncorrectPasswordException the incorrect password exception
	 */
	@PostMapping("/{id}/changePassword")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void changePassword(@RequestAttribute Long userId, @PathVariable Long id,
			@Validated @RequestBody ChangePasswordParamsDto params)
			throws PermissionException, InstanceNotFoundException, IncorrectPasswordException {

		if (!id.equals(userId)) {
			throw new PermissionException();
		}

		userService.changePassword(id, params.getOldPassword(), params.getNewPassword());

	}

	/**
	 * Generate service token.
	 *
	 * @param user the user
	 * @return the string
	 */
	private String generateServiceToken(Users user) {

		JwtInfo jwtInfo = new JwtInfo(user.getId(), user.getUserName(), user.getRole().toString());

		return jwtGenerator.generate(jwtInfo);

	}

	@GetMapping("/allUsers")
	public BlockDto<UserDto> findAllUsers(@RequestParam(defaultValue = "0") int page,@RequestParam(defaultValue = "5") int size) {

		Pageable pageable = PageRequest.of(page, size);
		Block<Users> users = userService.findAllUsers(pageable);

		return new BlockDto<>(toUserAllDtos(users.getItems()), users.getExistMoreItems());
	}

	@PostMapping("/{userId}/removeUser")
    public void removeUser(@PathVariable Long userId) throws InstanceNotFoundException, CannotDeleteAdminException {
        userService.removeUser(userId);
    }

}
