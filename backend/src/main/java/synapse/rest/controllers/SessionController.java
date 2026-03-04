package synapse.rest.controllers;

import static synapse.rest.mappers.UserConversor.toAuthenticatedUserDto;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import synapse.model.common.exceptions.InstanceNotFoundException;
import synapse.model.entities.Users;
import synapse.model.services.UserService;
import synapse.model.services.exceptions.IncorrectLoginException;
import synapse.rest.security.JwtGenerator;
import synapse.rest.security.JwtInfo;
import synapse.rest.dtos.AuthenticatedUserDto;
import synapse.rest.dtos.LoginParamsDto;

/**
 * REST controller for session management (authentication).
 * Maps to /api/sessions — creating a session = login.
 */
@RestController
@RequestMapping(value = "/api/sessions", produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
public class SessionController {

	private final JwtGenerator jwtGenerator;
	private final UserService userService;

	public SessionController(JwtGenerator jwtGenerator, UserService userService) {
		this.jwtGenerator = jwtGenerator;
		this.userService = userService;
	}

	/**
	 * Login — creates a new session (JWT token).
	 * POST /api/sessions
	 */
	@PostMapping
	public AuthenticatedUserDto login(@Validated @RequestBody LoginParamsDto params) throws IncorrectLoginException {
		Users user = userService.login(params.getUserName(), params.getPassword());
		return toAuthenticatedUserDto(generateServiceToken(user), user);
	}

	/**
	 * Refresh session from an existing service token.
	 * POST /api/sessions/refresh
	 */
	@PostMapping("/refresh")
	public AuthenticatedUserDto refreshToken(@RequestAttribute Long userId,
			@RequestAttribute String serviceToken) throws InstanceNotFoundException {
		Users user = userService.loginFromId(userId);
		return toAuthenticatedUserDto(serviceToken, user);
	}

	private String generateServiceToken(Users user) {
		JwtInfo jwtInfo = new JwtInfo(user.getId(), user.getUserName());
		return jwtGenerator.generate(jwtInfo);
	}
}
