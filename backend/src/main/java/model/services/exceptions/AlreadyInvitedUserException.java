package es.udc.fi.dc.fd.model.services.exceptions;

public class AlreadyInvitedUserException extends Exception{

    final String userName;
    final String leagueName;

    public AlreadyInvitedUserException(String userName, String leagueName) {
        super("The user " + userName + " is already in " + leagueName);
        this.userName = userName;
        this.leagueName = leagueName;
    }

    public String getUserName() {
        return userName;
    }

    public String getLeagueName() {
        return leagueName;
    }
}
