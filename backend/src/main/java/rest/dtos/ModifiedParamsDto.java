package es.udc.fi.dc.fd.rest.dtos;

import jakarta.validation.constraints.Min;

public class ModifiedParamsDto {
    private int sizeRotation;
    private int minTeam;
    private int maxTeam;
    private int timeRotation;
    private int initialBudget;
    private int timeRound;

    @Min(value=1)
    public int getSizeRotation() {
        return sizeRotation;
    }

    public void setSizeRotation(int sizeRotation) {
        this.sizeRotation = sizeRotation;
    }

    @Min(value=7)
    public int getMinTeam() {
        return minTeam;
    }

    public void setMinTeam(int minTeam) {
        this.minTeam = minTeam;
    }

    @Min(value=7)
    public int getMaxTeam() {
        return maxTeam;
    }

    public void setMaxTeam(int maxTeam) {
        this.maxTeam = maxTeam;
    }

    @Min(value=1)
    public int getTimeRotation() {
        return timeRotation;
    }

    public void setTimeRotation(int timeRotation) {
        this.timeRotation = timeRotation;
    }
    
    @Min(value=1000)
    public int getInitialBudget() {
        return initialBudget;
    }

    public void setInitialBudget(int initialBudget) {
        this.initialBudget = initialBudget;
    }

    @Min(value=0)
    public int getTimeRound() {
        return timeRound;
    }

    public void setTimeRound(int timeRound) {
        this.timeRound = timeRound;
    }
}
