

const ActionTypes = {
    SB_SHOW: "action_sb_show",
    SB_HIDE: "action_sb_hide",
};

export const Actions = {
    showSnackbar: message => ({
        type: ActionTypes.SB_SHOW,
        message
    }),
    hideSnackbar: () => ({type:ActionTypes.SB_HIDE})
};


export const reducer = (state, action) => {
    switch (action.type) {
        case ActionTypes.SB_SHOW:
            return {
                message: action.message,
                shown: true
            };
        case ActionTypes.SB_HIDE:
            return {
                message: state.message || "",
                shown: false
            };
        default:
            return state || {
                message: "",
                shown: false,
            }
    }
};
