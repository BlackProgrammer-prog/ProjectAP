// import React from 'react'

// const Tile = ({className}) => {
//   return (
//     <div className= {`tile ${className}`}>X</div>
//   )
// }

// export default Tile

// =====================================

import React from 'react'

const Tile = ({ className, value, onClick, pleyarTurn }) => {
  let hoverClass = null;
  if (value == null && pleyarTurn != null) {
    hoverClass = `${pleyarTurn.toLowerCase()}-hover`;
  }
  return (
    <div onClick={onClick} className={`tile ${className || ''} ${hoverClass}`}>
      {value}
    </div>
  );
};

export default Tile;
