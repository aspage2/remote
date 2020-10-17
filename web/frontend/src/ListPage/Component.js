
import React from 'react';
import {Link} from 'react-router-dom';
import {useMPDQuery} from "../urls";

import _ from "lodash";

import styles from "./Style.scss"

export default function ListPage(props) {
    const {title, endPoint, listTransform=_.identity} = props;

    const {loaded, data, err} = useMPDQuery(endPoint);

    let c;
    if (!loaded)
        c = <div/>;
    else if (err)
        c = <h1>Error</h1>;
    else {
        c = _.map(listTransform(data), (item, i) =>
            <div className={styles.item}>
                <Link key={i} to={item.route}>
                    <span className={styles.itemCopy}>{item.name}</span>
                </Link>
            </div>
        );
    }

    return <React.Fragment>
        <h1>{title}</h1>
        {c}
    </React.Fragment>
}