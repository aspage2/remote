
const INITIAL_PLAYBACK = INITIAL_STATUS && INITIAL_STATUS.playback;

const ActionTypes = {
    PB_SET: "action_pb_set",
};


export const Actions = {
    setPlayback: playback => ({type: ActionTypes.PB_SET, playback}),
};


export const reducer = (state, action) => {
    if (action.type === ActionTypes.PB_SET)
        return action.playback;
    return state || INITIAL_PLAYBACK || {}
};