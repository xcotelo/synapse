package synapse.rest.mappers;

import synapse.model.entities.User;
import synapse.rest.dtos.AuthenticatedUserDto;
import synapse.rest.dtos.UserDto;

/**
 * Mapper between User entities and DTOs.
 */
public class UserMapper {

	private UserMapper() {
	}

	public static final UserDto toUserDto(User user) {
		return new UserDto(user.getId(), user.getUserName(), user.getEmail());
	}

	public static final User toUser(UserDto userDto) {
		return new User(userDto.getUserName(), userDto.getPassword(), userDto.getEmail());
	}

	public static final AuthenticatedUserDto toAuthenticatedUserDto(String serviceToken, User user) {
		return new AuthenticatedUserDto(serviceToken, toUserDto(user));
	}
}
