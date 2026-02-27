import React from "react";
import { useUser } from "../../common/components/UserContext";

const Menu = () => {
    const { loggedIn } = useUser();

    return (
        <div>
            {loggedIn === true &&
                 <div className="mt-5"></div>
            }
        </div>
    );
};

export default Menu;
