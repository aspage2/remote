import React, {useEffect, useRef, useState} from "react";

import styles from "./Style.scss";

function HoldButton(props) {
  const { onActivate, duration } = props;

  const [count, setCount] = useState(0);
  const interval = useRef(0);
  const countRef = useRef(0);

  const intervalFunc = () => {
    if (countRef.current >= duration) {
      onActivate();
      intervalCleanup();
    } else {
      countRef.current += 10;
      setCount(countRef.current);
    }
  };

  const handleMouseDown = () => {
    if (interval.current !== 0) clearInterval(interval.current);
    interval.current = setInterval(intervalFunc, 10);
    countRef.current = 0;
    setCount(0);
  };

  const intervalCleanup = () => {
    if (interval.current !== 0) clearInterval(interval.current);
    countRef.current = 0;
    setCount(0);
  };

  const percent = Math.floor((count / parseFloat(duration)) * 100.0);
  return (
    <button
      className={styles.holdButton}
      onMouseDown={handleMouseDown}
      onMouseUp={intervalCleanup}
      onMouseLeave={intervalCleanup}
    >
      <div className={styles.loading} style={{ width: `${percent}%` }} />
      Value: {percent}
    </button>
  );
}

export default () => {
  const [active, setActive] = useState(false);
  const timeoutRef = useRef(0);
  
  useEffect(() => {
    if (!active)
      return
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setActive(false), 2000);
  }, [active]);
  
  return <div>
    <HoldButton onActivate={()=>setActive(true)} duration={1000}/>
    {active && <h2>Active</h2> || <h2>Inactive</h2>}
  </div>
};