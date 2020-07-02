import React, {useEffect, useRef} from 'react';

import classnames from 'classnames';

import styles from './Style.scss';

/**
 * Sits at the top right of the screen and displays messages
 */
export function Snackbar({message, hideSnackbar, shown}){
    const className = classnames(
        styles.card,
        {[styles.shown]: shown}
    );
    const timeoutRef = useRef(0);
    useEffect(() => {
        if (shown) {
            timeoutRef.current = setTimeout(() => {
                hideSnackbar();
            }, 3000);
        }
        return () => {
            clearTimeout(timeoutRef.current);
        }
    }, [shown]);

    return <div className={className}>
        <div>{message}</div> <button onClick={hideSnackbar}>Hide</button>
    </div>
}

