import React from "react";

import { Route, Routes } from "react-router-dom";

import { Login, LoginAdmin, Register, UserListAdmin } from "../../user";
import { FindPlayersContainer, AddPlayerForm, PlayerDetails} from "../../player";
import { RoleType } from "../../common";
import { useUser } from "../../common/components/UserContext";
import { UserLineup, ShowLeagues, InviteMenu, LeagueDetails, ShowLeaguesAdmin } from "../../league";
import { AddTeamForm } from "../../team";
import { DigitalBrainInbox, DigitalBrainProcessEntry, DigitalBrainKnowledge } from "../../digitalbrain";

const Body = () => {

  const { loggedIn, userRole} = useUser();
  
  return (
    <Routes>
      <Route path="/">
        <Route index exact element={<Login />} />
        {<Route path="/register" element={<Register />} />}
        {<Route path="/loginAdmin" element={<LoginAdmin />} />}
        {/* Rutas del cerebro digital (no obligan a estar logueado) */}
        <Route path="/brain/inbox" element={<DigitalBrainInbox />} />
        <Route path="/brain/process/:id" element={<DigitalBrainProcessEntry />} />
        <Route path="/brain/knowledge" element={<DigitalBrainKnowledge />} />
        {loggedIn && <Route path="/player/find-players" element={<FindPlayersContainer />} />}
        {loggedIn && <Route path="/player/player-details/:id" element={<PlayerDetails/>} />}
        {loggedIn && userRole === RoleType.ADMIN && <Route path="/player/addPlayer" element={<AddPlayerForm/>} />}
        {loggedIn && userRole === RoleType.USER && <Route path="/league/ShowLeagues" element={<ShowLeagues/>}/>}
        {loggedIn && userRole === RoleType.USER && <Route path="/league/league-details/:id" element={<LeagueDetails/>}/>}
        {loggedIn && userRole === RoleType.USER && <Route path="/league/:id/userLeagueTeam/:userId" element={<UserLineup/>}/>}
        {loggedIn && userRole === RoleType.USER && <Route path="/league/inviteUser/:id" element={<InviteMenu/>}/>}
        {loggedIn && userRole === RoleType.ADMIN && <Route path="/team/addTeam" element={<AddTeamForm/>}/>}
        {loggedIn && userRole === RoleType.ADMIN && <Route path="/league/ShowLeaguesAdmin" element={<ShowLeaguesAdmin/>}/>}
        {loggedIn && userRole === RoleType.ADMIN && <Route path="/users/allUsers" element={<UserListAdmin/>}/>}
      </Route>
    </Routes>
  );
};

export default Body;
