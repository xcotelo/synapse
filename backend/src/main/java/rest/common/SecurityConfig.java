package es.udc.fi.dc.fd.rest.common;

import static org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * The Class SecurityConfig.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String USER  = "USER";
    private static final String ADMIN = "ADMIN";

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {

        this.jwtFilter = jwtFilter;
    }

    /**
     * Configure.
     *
     * @param http the http
     * @return the security filter chain
     * @throws Exception the exception
     */
    @Bean
    protected SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        // @formatter:off
        http.cors(cors -> cors.disable()).csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers(antMatcher("/*")).permitAll()
                .requestMatchers(antMatcher("/static/**")).permitAll()
                .requestMatchers(antMatcher("/assets/**")).permitAll()
                .requestMatchers(antMatcher("/api/hello")).permitAll()
                .requestMatchers(antMatcher("/api/users/signUp")).permitAll()
                .requestMatchers(antMatcher("/api/users/login")).permitAll()
                .requestMatchers(antMatcher("/api/users/loginFromServiceToken")).permitAll()
                .requestMatchers(antMatcher("/api/users/allUsers")).hasRole(ADMIN)
                .requestMatchers(antMatcher("/api/users/*/removeUser")).hasRole(ADMIN)
                .requestMatchers(antMatcher("/api/image/getImage/{imageName}")).permitAll()
                .requestMatchers(antMatcher("/api/player/allPlayers")).hasAnyRole(USER, ADMIN)
                .requestMatchers(antMatcher("/api/player/players")).hasAnyRole(USER, ADMIN)
                .requestMatchers(antMatcher("/api/player/*")).hasAnyRole(USER, ADMIN)
                .requestMatchers(antMatcher("/api/player/addPlayer")).hasRole(ADMIN)
                .requestMatchers(antMatcher("/api/player/*/removePlayer")).hasRole(ADMIN)
                .requestMatchers(antMatcher("/api/league/addLeague")).hasRole(USER)
                .requestMatchers(antMatcher("/api/users/*/leagues")).hasRole(USER)
                .requestMatchers(antMatcher("/api/player/teams")).hasRole(ADMIN)
                .requestMatchers(antMatcher("/api/league/allLeagues")).hasRole(ADMIN)
                .requestMatchers(antMatcher("/api/league/*/deleteLeague")).hasRole(ADMIN)
                .requestMatchers(antMatcher("/api/league/*/inviteUser")).hasRole(USER)
                .requestMatchers(antMatcher("/api/league/*/allUsers")).hasRole(USER)
                .requestMatchers(antMatcher("/api/team/addTeam")).hasRole(ADMIN)
                .requestMatchers(antMatcher("/api/league/*/avaliableUser")).hasRole(USER)
                .requestMatchers(antMatcher("/api/league/*/getCreator")).hasRole(USER)
                .requestMatchers(antMatcher("/api/league/*/userLeagueTeam/*")).hasRole(USER)
                .requestMatchers(antMatcher("/api/league/*/getRotation")).hasRole(USER)
                .requestMatchers(antMatcher("/api/league/*/getPlayersOnSale")).hasRole(USER)
                .requestMatchers(antMatcher("/api/league/*/modifyLeague")).hasRole(USER)
                .requestMatchers(antMatcher("/api/league/*/buyPlayer/*")).hasRole(USER)
                .requestMatchers(antMatcher("/api/league/*/sellPlayer/*")).hasRole(USER)
                .requestMatchers(antMatcher("/api/league/*/deleteSellPlayer/*")).hasRole(USER)
                .requestMatchers(antMatcher("/api/league/*/getBudget")).hasRole(USER)
                .requestMatchers(antMatcher("/api/league/userInvitations")).hasRole(USER)
                .requestMatchers(antMatcher("/api/league/*/userInvitationsDelete")).hasRole(USER)
                .requestMatchers(antMatcher("/api/league/*/userInvitationsAccept")).hasRole(USER)
                .requestMatchers(antMatcher("/api/league/*/updateMainLineUp")).hasRole(USER)
                .requestMatchers(antMatcher("/ws/**")).permitAll()
                // Cerebro digital: de momento permitimos el endpoint de sugerencias
                .requestMatchers(antMatcher("/api/brain/suggest")).permitAll()
                .requestMatchers(antMatcher("/actuator/**")).permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        // @formatter:on

        return http.build();
    }

    /**
     * Authentication manager.
     *
     * @param authenticationConfiguration the authentication configuration
     * @return the authentication manager
     * @throws Exception the exception
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    /**
     * Cors configuration source.
     *
     * @return the cors configuration source
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        config.setAllowCredentials(true);
        config.addAllowedOrigin("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        source.registerCorsConfiguration("/**", config);

        return source;

    }

}
