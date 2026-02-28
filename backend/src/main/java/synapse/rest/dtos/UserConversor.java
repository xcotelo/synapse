package synapse.rest.dtos;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import synapse.model.entities.Users;

/**
 * The Class UserConversor.
 */
public class UserConversor {

	/**
	 * Instantiates a new user conversor.
	 */
	private UserConversor() {
	}

	/**
	 * To user dto.
	 *
	 * @param user the user
	 * @return the user dto
	 */
	public static final UserDto toUserDto(Users user) {
		return new UserDto(user.getId(), user.getUserName(), user.getEmail());
	}

	/**
	 * To user.
	 *
	 * @param userDto the user dto
	 * @return the user
	 */
	public static final Users toUser(UserDto userDto) {

		return new Users(userDto.getUserName(), userDto.getPassword(), userDto.getEmail());
	}

	/**
	 * To authenticated user dto.
	 *
	 * @param serviceToken the service token
	 * @param user         the user
	 * @return the authenticated user dto
	 */
	public static final AuthenticatedUserDto toAuthenticatedUserDto(String serviceToken, Users user) {

		return new AuthenticatedUserDto(serviceToken, toUserDto(user));

	}

	public static final UserDto toUserDto1(Users user) {
		return new UserDto(user.getId(), user.getUserName());
	}

	public static final List<UserDto> toUserDtos(List<Users> users) {

		return users.stream().map(c -> toUserDto1(c)).collect(Collectors.toList());

	}

	public static final UserDto toUserDto2(Users user, int puntuation) {
		return new UserDto(user.getId(), user.getUserName(), puntuation);
	}

	public static final List<UserDto> toUserDtosPoints(List<Users> users, List<Integer> puntuationList) {

		List<UserDto> userDtos = new ArrayList<>();

		for (int i = 0; i < users.size(); i++) {
			userDtos.add(toUserDto2(users.get(i), puntuationList.get(i)));
		}

		return userDtos;

	}

	public static final List<UserDto> toUserAllDtos(List<Users> users) {
		return users.stream().map(c -> toUserDto(c)).collect(Collectors.toList());
	}
}
