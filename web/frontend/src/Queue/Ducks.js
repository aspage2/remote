const INITIAL_QUEUE = INITIAL_STATUS && INITIAL_STATUS.queue;

const ActionTypes = {
    Q_SET: "action_q_set"
};


export const Actions = {
    setQueue: queue => ({type: ActionTypes.Q_SET, queue})
};


export const reducer = (state, action) => {
    if (action.type === ActionTypes.Q_SET)
        return action.queue;
    return state || INITIAL_QUEUE || [];
};