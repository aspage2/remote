import axios from 'axios';

import {useEffect, useState} from 'react';

import _ from 'lodash';

/**
 * Hook that handles the loading/err state of a music database query
 * @param path: URL to issue a GET to
 * @returns {{loaded: boolean, err: boolean, data: *}}
 */
export const useMusicDatabaseQuery = (path) => {
    const [loadState, setLoadState] = useState({
        loaded: false,
        err: false,
        data: undefined,
    });

    useEffect(() => {
        if (path !== "") {
            setLoadState({
                loaded: false,
                err: false,
                data: undefined
            });
            axios.get(path)
                .then(res => setLoadState({
                    loaded: true,
                    err: false,
                    data: res.data
                }))
                .catch(err => setLoadState({
                        loaded: true,
                        err: true,
                        data: err.response
                    })
                )

        }
    }, [path]);

    return loadState;
};

export const albumArtUrl = ({albumartist, album}) => `http://${ALBUM_ART_URL}/art/${albumartist}/${album}`;

/**
 * Convert seconds to a formatted song duration
 * @param t
 * @returns string
 */
export const timeStr = t => {
    t = parseInt(t);
    const mins = `${parseInt(t / 60)}`;
    const secs = `${t % 60}`.padStart(2, '0');
    return `${mins}:${secs}`;
};


export const areEmpty = (...vals) => _.some(vals, _.isEmpty);

export const englishTimeStr = totalTime => {
    const totalHours = Math.floor(totalTime / 3600);
    const totalMins = Math.floor((totalTime % 3600) / 60);
    const totalSecs = Math.floor(totalTime % 60);

    let times = [];
    if (totalHours > 0) {
        times = times.concat(`${totalHours} Hours`)
    }
    if (totalMins > 0) {
        times = times.concat(`${totalMins} Minutes`)
    }
    if (totalSecs > 0) {
        times = times.concat(`${totalSecs} Seconds`)
    }
    return times.join(", ")
};
