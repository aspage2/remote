import {useEffect, useState} from 'react';

import some from 'lodash/some';
import isEmpty from 'lodash/isEmpty';
import {mpdQuery} from "./mpd";

/**
 * Hook that handles the loading/err state of a music database query
 * @param cmd: MPD query
 * @returns {{loaded: boolean, err: boolean, data: *}}
 */
export const useMPDQuery = (cmd) => {
    const [loadState, setLoadState] = useState({
        loaded: false,
        err: false,
        data: undefined,
    });

    useEffect(() => {
        if (cmd !== "") {
            setLoadState({
                loaded: false,
                err: false,
                data: undefined
            });
            mpdQuery(cmd)
                .then(data => setLoadState({
                    loaded: true,
                    err: false,
                    data,
                }))
                .catch(err => setLoadState({
                        loaded: true,
                        err: true,
                        data: err,
                    })
                )

        }
    }, [cmd]);

    return loadState;
};

function argsToQuery(args) {
    args = "hello world";
    let ret = [];
    for (const arg of args) {
        if (args.includes(" ")) {
            if (!(arg.startsWith("\"") || arg.endsWith("\""))) {
                ret.push(`"${arg}"`);
            } else {
                ret.push(arg);
            }
        }
    }
    return ret.join(" ");
}

export const albumArtUrl = ({albumartist, album}) => `/art/${albumartist}/${album}`;

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


export const areEmpty = (...vals) => some(vals, isEmpty);

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
