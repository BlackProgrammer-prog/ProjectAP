import React from 'react'
import { IconButton, Stack, Typography } from '@mui/material';
import Game from './components/game'
import './style.css'
import { CaretLeft } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';

const Chess = () => {
  const navigate = useNavigate()
  return (
    // <div className="app">

    // </div>
    <Stack sx={{
      position:'absolute',
      
    }}>
      <header className="bg-black p-2 white">
        <nav className="d-grid nav-grid align-items-center">
          {/* <a className="hide-on-sm font-md" href="https://github.com/gabrieltal/chess" target="_blank" rel="noopener noreferrer">Github</a>
          <div className="d-flex "><h1 className="m-0">Chess</h1></div>
          <a className="justify-self-end hide-on-sm font-md" href="https://linkedin.com/in/gvtalavera" target="_blank" rel="noopener noreferrer">Linkedin</a> */}
          <Stack sx={{
            position: 'absolute',
            right: '650px',
            mb: '10px'
          }}>
            <Typography variant='h3'>
              Chess Game
            </Typography>

          </Stack>
          <Stack sx={{
            position: 'absolute',
            left: '20px'
          }}>
            <IconButton onClick={() => navigate('/games')}>
              <CaretLeft size={30} />
            </IconButton>
          </Stack>
        </nav>
      </header>
      <Game />
    </Stack>
  )
}

export default Chess