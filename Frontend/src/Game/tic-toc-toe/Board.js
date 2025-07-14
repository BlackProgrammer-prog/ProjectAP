// import React from 'react'
// import Tile from './Tile'
// import Strike from './Strike'

// const Board = () => {
//     return (
//         <div className='board'>
//             <Tile className=" right-border bottom-border" />
//             <Tile className=" right-border bottom-border" />
//             <Tile className=" bottom-border" />
//             <Tile className=" right-border bottom-border" />
//             <Tile className=" right-border bottom-border" />
//             <Tile className=" bottom-border" />
//             <Tile className=" right-border " />
//             <Tile className=" right-border " />
//             <Tile />

//             <Strike />
//         </div>
//     )
// }

// export default Board

// ===================================================================

import React from 'react'
import Tile from './Tile'
import Strike from './Strike'

const Board = ({ tiles, onTileClick, pleyarTurn , strikeClass}) => {
    return (
        <div className='board'>
            <Tile pleyarTurn={pleyarTurn} onClick={() => onTileClick(0)} value={tiles[0]} className="right-border bottom-border" />
            <Tile pleyarTurn={pleyarTurn} onClick={() => onTileClick(1)} value={tiles[1]} className="right-border bottom-border" />
            <Tile pleyarTurn={pleyarTurn} onClick={() => onTileClick(2)} value={tiles[2]} className="bottom-border" />
            <Tile pleyarTurn={pleyarTurn} onClick={() => onTileClick(3)} value={tiles[3]} className="right-border bottom-border" />
            <Tile pleyarTurn={pleyarTurn} onClick={() => onTileClick(4)} value={tiles[4]} className="right-border bottom-border" />
            <Tile pleyarTurn={pleyarTurn} onClick={() => onTileClick(5)} value={tiles[5]} className="bottom-border" />
            <Tile pleyarTurn={pleyarTurn} onClick={() => onTileClick(6)} value={tiles[6]} className="right-border" />
            <Tile pleyarTurn={pleyarTurn} onClick={() => onTileClick(7)} value={tiles[7]} className="right-border" />
            <Tile pleyarTurn={pleyarTurn} onClick={() => onTileClick(8)} value={tiles[8]} />
            <Strike strikeClass={strikeClass} />
        </div>
    )
}

export default Board