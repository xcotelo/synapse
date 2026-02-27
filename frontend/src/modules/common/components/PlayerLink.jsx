import {Link} from 'react-router-dom';

const PlayerLink = ({id, name}) => {

    return (
        <Link to={`/player/player-details/${id}`}>
            {name}
        </Link>
    );

}

export default PlayerLink;