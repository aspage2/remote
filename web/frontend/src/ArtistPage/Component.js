
import React from 'react';

import _ from 'lodash';
import AlbumCard from "../AlbumCard";
import {useMusicDatabaseQuery} from "../urls";
import {SocketContext} from "../socket";

function ArtistPage(props){

    const {artist, history, socket} = props;
    const {data, loaded, err} =  useMusicDatabaseQuery(`/data/artist/${artist}`);

    if (!loaded)
        return <h3>Loading</h3>;
    if (err)
        return <h3>Error!</h3>;

    const albums = _.sortBy(data.albums, album => album.date || 10000);

    return <React.Fragment>
        <h1>Albums from {artist}</h1>
        <div>
            {_.map(albums, album => <AlbumCard
                info={album}
                onClick={() => history.push(`/web/albumartist/${album.albumartist}/album/${album.album}`)}
                buttonClick={() => {
                    socket.emit("findadd", {
                        album: album.album,
                        albumartist: album.albumartist
                    })
                }}
            />)}
        </div>
    </React.Fragment>
}

export default props => <SocketContext.Consumer>
    {socket => <ArtistPage socket={socket} {...props}/>}
</SocketContext.Consumer>