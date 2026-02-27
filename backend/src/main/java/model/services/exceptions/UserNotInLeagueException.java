package es.udc.fi.dc.fd.model.services.exceptions;

public class UserNotInLeagueException extends Exception {
    final Long userId;
    final String leagueName;

    public UserNotInLeagueException(Long userId, String leagueName) {
        super("The user with id " + userId + " is not in " + leagueName);
        this.userId = userId;
        this.leagueName = leagueName;
    }

    public Long getUserId() {
        return userId;
    }

    public String getLeagueName() {
        return leagueName;
    }
}
