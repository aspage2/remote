
const INITIAL_CHANNELS = INITIAL_STATUS && INITIAL_STATUS.channel;

const ActionTypes = {
    CHANNEL_SET: "action_channel_set",
};

export const Actions = {
    setChannels: channels => ({type: ActionTypes.CHANNEL_SET, channels}),
};

export const reducer = (state, action) => {
    if (action.type === ActionTypes.CHANNEL_SET)
        return action.channels;
    return state || INITIAL_CHANNELS || {};
};