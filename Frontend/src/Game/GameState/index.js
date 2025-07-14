// import { Card, CardContent, CardMedia, Stack, Typography } from '@mui/material'
// import React from 'react'
// import tictoc from './tictoc.jpg'
// import pacman from './pacman.png'
// import chess from './chess.jpg'

// const index = () => {
//     return (
//         <>
//             {/* game 1 */}
//             <Stack sx={{
//                 position: 'absolute',
//                 right: '200px',
//                 top: '110px',
//             }}>
//                 <Card>
//                     <CardMedia component="img" height="150px" image={tictoc} alt='tic-toc' sx={{ cursor: 'pointer' }} />
//                     <CardContent>
//                         <Typography variant='h6'>
//                             Tic-Tac-Toe Game
//                         </Typography>
//                     </CardContent>
//                 </Card>
//             </Stack>
//             {/* game 2 */}
//             <Stack sx={{
//                 position: 'absolute',
//                 right: '600px',
//                 top: '110px',
//             }}>
//                 <Card>
//                     <CardMedia component="img" height="150px" image={pacman} alt='tic-toc' sx={{ cursor: 'pointer' }} />
//                     <CardContent>
//                         <Typography variant='h6'>
//                             Pac-Man Game
//                         </Typography>
//                     </CardContent>
//                 </Card>
//             </Stack>
//             {/* game 3 */}
//             <Stack sx={{
//                 position: 'absolute',
//                 right: '1000px',
//                 top: '110px',
//             }}>
//                 <Card>
//                     <CardMedia component="img" height="150px" image={chess} alt='tic-toc' sx={{ cursor: 'pointer' }} />
//                     <CardContent>
//                         <Typography variant='h6'>
//                             Chess Game
//                         </Typography>
//                     </CardContent>
//                 </Card>
//             </Stack>
//         </>

//     )
// }

// export default index

// =-====================================================

import { Card, CardContent, CardMedia, Grid, Typography, Container, Box } from '@mui/material';
import React from 'react';
import tictoc from './tictoc.jpg';
import pacman from './pacman.png';
import chess from './chess.jpg';
import { Link } from 'react-router-dom';

const games = [
    {
        id: 1,
        title: 'Tic-Tac-Toe Game',
        image: tictoc,
        alt: 'tic-tac-toe game',
        path: '/tictactoe'
    },
    {
        id: 2,
        title: 'Pac-Man Game',
        image: pacman,
        alt: 'pacman game',
        path: '/pacman'
    },
    {
        id: 3,
        title: 'Chess Game',
        image: chess,
        alt: 'chess game',
        path: '/chess'
    }
];

const GameCard = ({ game }) => (
    <Grid item xs={12} sm={6} md={4}>
        <Card sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.3s',
            '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: 6
            }
        }}>
            <Link to={game.path} style={{ textDecoration: 'none' }}>
                <CardMedia
                    component="img"
                    height="200"
                    image={game.image}
                    alt={game.alt}
                    sx={{ cursor: 'pointer' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2" align="center" color="text.primary">
                        {game.title}
                    </Typography>
                </CardContent>
            </Link>
        </Card>
    </Grid>
);

const GamesGallery = () => {
    return (
        <Box sx={{ py: 4, position: 'absolute', left: '400px' }}>
            <Container maxWidth="lg">
                <Typography variant="h3" component="h1" gutterBottom align="center" sx={{
                    mb: 8,
                    fontWeight: 'bold',
                    color: 'primary.main'
                }}>
                    Games
                </Typography>

                <Grid container spacing={4}>
                    {games.map((game) => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </Grid>
            </Container>
        </Box>
    );
};

export default GamesGallery;