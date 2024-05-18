import { mpdQuery } from "./mpd";
import { useEffect, useState } from "react";

function useLoadState() {
  const orig = {
    loaded: false,
    err: false,
    data: null,
  };
  const [loadState, setLoadState] = useState(orig);

  return [
    loadState,
    (d) => setLoadState({ loaded: true, err: false, data: d }),
    (e) => setLoadState({ loaded: true, err: true, data: e }),
    () => setLoadState(orig),
  ];
}

export function useHttpGet(path) {
  const [status, success, err, reset] = useLoadState();

  useEffect(() => {
    reset();
    fetch(path)
      .then((res) => res.json())
      .then(success)
      .catch(err);
  }, [path]);

  return status;
}

/**
 * Hook that handles the loading/err state of a music database query
 * @param cmd MPD query
 * @returns {{loaded: boolean, err: boolean, data: *}}
 */
export function useMPDQuery(cmd) {
  const [ls, success, err, reset] = useLoadState();

  useEffect(() => {
    if (cmd !== "") {
      reset();
      mpdQuery(cmd).then(success).catch(err);
    }
  }, [cmd]);

  return ls;
}
