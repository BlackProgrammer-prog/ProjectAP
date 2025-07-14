import React from 'react'
import GameState from './GameState';

function GameOver ({gameState}){
    switch (gameState) {
        case GameState.inProgress:
            return <></>
            break;
        case GameState.playerXWins:
            return <div className='game-over'>X Win</div>
            break;
        case GameState.playerOWins:
            return <div className='game-over'>O Win</div>
            break;
        case GameState.draw:
            return <div className='game-over'>Draw</div>
            break;
        default:
            <></>
    }
}

export default GameOver