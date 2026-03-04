package synapse.rest.controllers;

import static synapse.rest.mappers.UserConversor.toAuthenticatedUserDto;
import static synapse.rest.mappers.UserConversor.toUser;
import static synapse.rest.mappers.UserConversor.toUserDto;

import java.net.URI;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import synapse.model.common.exceptions.DuplicateInstanceException;
import synapse.model.common.exceptions.InstanceNotFoundException;
import synapse.model.entities.Users;
import synapse.model.services.exceptions.IncorrectPasswordException;
import synapse.model.services.exceptions.PermissionException;
import synapse.model.services.UserService;
import synapse.rest.security.JwtGenerator;
import synapse.rest.security.JwtInfo;
import synapse.rest.dtos.AuthenticatedUserDto;
import synapse.rest.dtos.ChangePasswordParamsDto;
import synapse.rest.dtos.UserDto;

/**
 * REST controller for user resources.
 * Session/auth endpoints are in SessionController.
 */
@RestController
@RequestMapping(value = "/api/users", produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
public class UserController {

	private final JwtGenerator jwtGenerator;
	private final UserService userService;

	public UserController(JwtGenerator jwtGenerator, UserService userService) {
		this.jwtGenerator = jwtGenerator;
		this.userService = userService;
	}

	/**
	 * POST /api/users — Create a new user (sign up).
	 * Returns 201 CREATED with Location header.
	 */
	@PostMapping
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
	 * PUT /api/users/{id} — Update user profile.
	 */
	@PutMapping("/{id}")
	public UserDto updateProfile(@RequestAttribute Long userId, @PathVariable("id") Long id,
			@Validated({ UserDto.UpdateValidations.class }) @RequestBody UserDto userDto)
			throws InstanceNotFoundException, PermissionException {

		checkSameUser(userId, id);

		return toUserDto(userService.updateProfile(id, userDto.getEmail()));
	}

	/**
	 * PUT /api/users/{id}/password — Change user password.
	 * Uses PUT because we are replacing the password sub-resource.
	 */
	@PutMapping("/{id}/password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void changePassword(@RequestAttribute Long userId, @PathVariable Long id,
			@Validated @RequestBody ChangePasswordParamsDto params)
			throws PermissionException, InstanceNotFoundException, IncorrectPasswordException {

		checkSameUser(userId, id);

		userService.changePassword(id, params.getOldPassword(), params.getNewPassword());
	}

	/**
	 * DELETE /api/users/{id} — Delete a user.
	 * Returns 204 NO_CONTENT.
	 */
	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void removeUser(@RequestAttribute Long userId, @PathVariable Long id)
			throws InstanceNotFoundException, PermissionException {

		checkSameUser(userId, id);

		userService.removeUser(id);
	}

	private void checkSameUser(Long authenticatedUserId, Long targetId) throws PermissionException {
		if (!targetId.equals(authenticatedUserId)) {
			throw new PermissionException();
		}
	}

	private String generateServiceToken(Users user) {
		JwtInfo jwtInfo = new JwtInfo(user.getId(), user.getUserName());
		return jwtGenerator.generate(jwtInfo);
	}
}
