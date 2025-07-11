import React, { useEffect, useState } from 'react'
import Board from './Board'
import GameOver from './GameOver'
import GameState from './GameState'
import Reset from './Reset'
import gameOverSoundAssist from '../sounds/GameOver.wav'
import clickSoundAssist from '../sounds/Click.wav'
import './style.css'
import { CaretLeft, MagnifyingGlass, Plus, Users } from 'phosphor-react';
import { Avatar, Box, Divider, IconButton, Stack, Switch, useTheme, Menu, MenuItem, Typography } from "@mui/material";
import { useNavigate } from 'react-router-dom'


const gameOverSound = new Audio(gameOverSoundAssist);
gameOverSound.volume = 0.2

const clickSound = new Audio(clickSoundAssist);
clickSound.volume = 0.5

const winningCombinations = [
    //Rows 
    { combo: [0, 1, 2], strikeClass: "strike-row-1" },
    { combo: [3, 4, 5], strikeClass: "strike-row-2" },
    { combo: [6, 7, 8], strikeClass: "strike-row-3" },
    // Columns
    { combo: [0, 3, 6], strikeClass: "strike-column-1" },
    { combo: [1, 4, 7], strikeClass: "strike-column-2" },
    { combo: [2, 5, 8], strikeClass: "strike-column-3" },
    // Diagonals
    { combo: [0, 4, 8], strikeClass: "strike-diagonal-1" },
    { combo: [2, 4, 6], strikeClass: " strike-diagonal-2" },
]
const PLEYAR_X = 'X'
const PLEYAR_O = 'O'

function checkWinner(tiles, setStrikeClass, setGameState) {
    for (const { combo, strikeClass } of winningCombinations) {
        const tileValue1 = tiles[combo[0]]
        const tileValue2 = tiles[combo[1]]
        const tileValue3 = tiles[combo[2]]

        if (tileValue1 !== null && tileValue1 === tileValue2 && tileValue1 === tileValue3) {
            setStrikeClass(strikeClass)
            if (tileValue1 === PLEYAR_X) {
                setGameState(GameState.playerXWins)
            } else {
                setGameState(GameState.playerOWins)
            }
            return;
        }
    }
    const areAllTilesFilledIn = tiles.every((tile) => tile !== null)
    if (areAllTilesFilledIn) {
        setGameState(GameState.draw)
    }
}

const TicTocToe = () => {
    const [tiles, setTiles] = useState(Array(9).fill(null))
    const [pleyarTurn, setPleyarTurn] = useState(PLEYAR_X)
    const [strikeClass, setStrikeClass] = useState();
    const [gameState, setGameState] = useState(GameState.inProgress)
    const navigate = useNavigate()

    // beutifull code ...
    const handleTileClick = (index) => {
        if (gameState !== GameState.inProgress) {
            return;
        }

        if (tiles[index] !== null) {
            return;
        }

        const newTile = [...tiles];
        newTile[index] = pleyarTurn;
        setTiles(newTile)
        if (pleyarTurn === PLEYAR_X) {
            setPleyarTurn(PLEYAR_O)
        } else {
            setPleyarTurn(PLEYAR_X)
        }

    }
    const handleReset = () => {
        setGameState(GameState.inProgress)
        setTiles(Array(9).fill(null))
        setPleyarTurn(PLEYAR_X);
        setStrikeClass(null)
    }
    useEffect(() => {
        checkWinner(tiles, setStrikeClass, setGameState);
    }, [tiles])

    useEffect(() => {
        if (tiles.some((tile) => tile !== null)) {
            clickSound.play()
        }
    }, [tiles])
    useEffect(() => {
        if (gameState !== GameState.inProgress) {
            gameOverSound.play()
        }
    }, [gameState])

    // very good ali ...
    return (
        <div>
            <h1>Tic Toc Toe</h1>
            <Stack sx={{
                position: 'absolute',
                left: '120px',
                top: '10px'
            }}>
                <IconButton onClick={() => navigate("/app")}>
                    <CaretLeft size={32} />
                </IconButton>
            </Stack>
            <Board strikeClass={strikeClass} pleyarTurn={pleyarTurn} onTileClick={handleTileClick} tiles={tiles} />
            <GameOver gameState={gameState} />
            <Reset gameState={gameState} onReset={handleReset} />
        </div>

    )
}

export default TicTocToe