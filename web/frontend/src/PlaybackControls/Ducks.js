
const ActionTypes = {
    PB_SET: "action_pb_set",
};


export const Actions = {
    setPlayback: playback => ({type: ActionTypes.PB_SET, playback}),
};


export const makeReducer = initial_playback => (state, action) => {
    if (action.type === ActionTypes.PB_SET)
        return action.playback;
    return state || initial_playback || {}
};