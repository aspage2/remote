
const ActionTypes = {
    Q_SET: "action_q_set"
};


export const Actions = {
    setQueue: queue => ({type: ActionTypes.Q_SET, queue})
};

export const makeReducer = initial_queue => (state, action) => {
    if (action.type === ActionTypes.Q_SET)
        return action.queue;
    return state || initial_queue || [];
};