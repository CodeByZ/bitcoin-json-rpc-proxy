import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as cors from 'cors';

import {isConnected} from "./connection";
import {router} from './router';

const port = process.env.PORT || 8080;
const BASE_HREF = '/api';

const app = express();

// Allow cross-origin requests (in case the frontend runs on different machine's browser)
app.use(cors());

// Configure the app to use bodyParser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error: ' + err.message);
});

// Health check route
app.get('/api/health', (req, res) => {
    return res.status(200).json({healthy: true});
});

// Check if we're connected (middleware)
app.use((req, res, next) => {
    if (isConnected() || req.path.toLowerCase() === BASE_HREF + '/connect') {
        next();
    }
    else {
        return res.status(401).json({message: 'Please connect first'});
    }
});

// All of our routes will be prefixed with /api
app.use(BASE_HREF, router);

// Start the server
app.listen(port);
console.log('Magic happens on port ' + port);
