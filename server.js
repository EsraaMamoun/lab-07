'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors());

app.get('/', (request, response) => {
    response.send('The Home Page..');
});

app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailsHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);


/////////////////////////////////////////////////Location//////////////////////////////////////////////////////

function locationHandler(request, response) {
    const city = request.query.city;
    superagent(`https://eu1.locationiq.com/v1/search.php?key=${process.env.GEOCODE_API_KEY}&q=${city}&format=json`)
    .then((res) => {
        const geoData = res.body;
        const locationData = new Location(city, geoData);
        response.status(200).json(locationData);
    }).catch((err) => errorHandler(err, request, response));
}

function Location(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;
}

//////////////////////////////////////////////////Weather//////////////////////////////////////////////////////

function weatherHandler(request, response) {
    superagent(`https://api.weatherbit.io/v2.0/forecast/daily?city=${request.query.search_query}&key=${process.env.WEATHER_API_KEY}`)
    .then((weatherRes) => {
        const theWeather = weatherRes.body.data.map((darkskyData) => {
            return new Weather(darkskyData);
        });
        response.status(200).json(theWeather);
    }).catch((err) => errorHandler(err, request, response));
}


function Weather(darkskyData) {
    this.forecast = darkskyData.weather.description;
    this.time = (new Date(darkskyData.valid_date)).toDateString();
}

/////////////////////////////////////////////////Tralis/////////////////////////////////////////////////////////

function trailsHandler(request, response) {
    superagent(`https://www.hikingproject.com/data/get-trails?lat=${request.query.latitude}&lon=${request.query.longitude}&maxDistance=400&key=${process.env.TRAIL_API_KEY}`)
    .then((trailsRes) => {
        const trailsData = trailsRes.body.trails.map((theTrails) => {
            return new Tralis(theTrails);
        });
        response.status(200).json(trailsData);
    }).catch((err) => errorHandler(err, request, response));
}

function Tralis(theTrails) {
    this.name = theTrails.name;
    this.location = theTrails.location;
    this.length = theTrails.length;
    this.stars = theTrails.stars;
    this.star_votes = theTrails.star_votes;
    this.summary = theTrails.summary;
    this.trail_url = theTrails.trail_url;
    this.conditions = theTrails.conditions;
    this.condition_date = theTrails.condition_date;
    this.condition_time = theTrails.condition_time;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////


function notFoundHandler(request, response) {
    response.status(404).send('NOT FOUND!');
}

function errorHandler(error, request, response) {
    response.status(500).send(error);
}

app.listen(PORT, () => console.log(`App is listening on ${PORT}`));
