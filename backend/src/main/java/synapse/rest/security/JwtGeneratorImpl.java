package synapse.rest.security;

import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

/**
 * The Class JwtGeneratorImpl.
 */
@Component
public class JwtGeneratorImpl implements JwtGenerator {

    /** The sign key. */
    @Value("${project.jwt.signKey:${project.jwt.sign-key}}")
    private String signKey;

    /** The expiration minutes. */
    @Value("${project.jwt.expirationMinutes:${project.jwt.expiration-minutes}}")
    private long expirationMinutes;

    /**
     * Generate.
     *
     * @param info the info
     * @return the string
     */
    @Override
    public String generate(JwtInfo info) {

        return Jwts.builder()
                .subject(info.getUserName())
                .expiration(new Date(System.currentTimeMillis() + expirationMinutes * 60 * 1000))
                .claim("userId", info.getUserId())
                .signWith(Keys.hmacShaKeyFor(signKey.getBytes()), SignatureAlgorithm.HS512)
                .compact();

    }

    /**
     * Gets the info.
     *
     * @param token the token
     * @return the info
     */
    @Override
    public JwtInfo getInfo(String token) {

        Claims claims = Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(signKey.getBytes()))
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return new JwtInfo(((Integer) claims.get("userId")).longValue(), claims.getSubject());

    }

}
