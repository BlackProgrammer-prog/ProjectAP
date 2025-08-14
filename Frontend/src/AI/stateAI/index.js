import { Card, CardContent, CardMedia, Grid, Typography, Container, Box } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';
import chatgpt from './chatgpt.png'
import deepseek from './deepseek.png'
import copilot from './copilot.png'
import gemini from './gemini.png'

const AI = [
    {
        id: 1,
        title: 'ChatGPT',
        image: chatgpt,
        alt: 'ChatGPT',
        path: '/chatgpt'
    },
    {
        id: 2,
        title: 'deepseek',
        image: deepseek,
        alt: 'deepseek',
        path: '/deepseek'
    },
    {
        id: 3,
        title: 'gemini',
        image: gemini,
        alt: 'gemini',
        path: '/gemini'
    }
]

const GameCard = ({ AI }) => (
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
            <Link to={AI.path} style={{ textDecoration: 'none' }}>
                <CardMedia
                    component="img"
                    height="200"
                    image={AI.image}
                    alt={AI.alt}
                    sx={{ cursor: 'pointer' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2" align="center" color="text.primary">
                        {AI.title}
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
                    AI
                </Typography>

                <Grid container spacing={10}>
                    {AI.map((AI) => (
                        <GameCard key={AI.id} AI={AI} />
                    ))}
                </Grid>
            </Container>
        </Box>
    );
};

export default GamesGallery;