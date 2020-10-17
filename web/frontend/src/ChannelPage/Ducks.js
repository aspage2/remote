
const ActionTypes = {
    CHANNEL_SET: "action_channel_set",
};

export const Actions = {
    setChannels: channels => ({type: ActionTypes.CHANNEL_SET, channels}),
};

export const makeReducer = initial_channels => (state, action) => {
    if (action.type === ActionTypes.CHANNEL_SET)
        return action.channels;
    return state || initial_channels || {};
};