import React from 'react'
import { Card, CardContent, CardMedia, Grid, Typography, Container, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import Calculater from './calculator.png'
import cloudy from './cloudy.png'
import compiler from './compiler.png'
import dollar from './dollar.png'
import robot from './robot.png'
import schedule from './schedule.png'


const Service = [
  {
    id: 1,
    title: 'Calculater',
    image: Calculater,
    alt: 'Calculater',
    path: '/Calculate'
  },
  {
    id: 2,
    title: 'cloudy',
    image: cloudy,
    alt: 'cloudy',
    path: '/Weather'
  },
  {
    id: 3,
    title: 'compiler',
    image: compiler,
    alt: 'compiler',
    path: '/Compiler'
  }, {
    id: 4,
    title: 'dollar',
    image: dollar,
    alt: 'dollar',
    path: '/Coin'
  },
  {
    id: 5,
    title: 'robot',
    image: robot,
    alt: 'robot',
    path: '/Robot'
  },
  {
    id: 6,
    title: 'schedule',
    image: schedule,
    alt: 'schedule',
    path: '/Calender'
  }
]


const GameCard = ({ service }) => (
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
            <Link to={service.path} style={{ textDecoration: 'none' }}>
                <CardMedia
                    component="img"
                    height="200"
                    image={service.image}
                    alt={service.alt}
                    sx={{ cursor: 'pointer' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2" align="center" color="text.primary">
                        {service.title}
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
                    
                </Typography>

                <Grid container spacing={4}>
                    {Service.map((service) => (
                        <GameCard key={service.id} service={service} />
                    ))}
                </Grid>
            </Container>
        </Box>
    );
};

export default GamesGallery;