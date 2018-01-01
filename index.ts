import * as bodyParser from 'body-parser';
import * as Client from 'bitcoin-core';
import * as Promise from 'bluebird';
import * as express from 'express';
import * as cors from 'cors';

const WELCOME_MESSAGE: string = 'Welcome to the blockchain. Vires in numeris';
const port = process.env.PORT || 8080;
const BASE_HREF = '/api';

let isConnected: boolean = false;
let blocksCache = {};
let client = null;

const app = express();
app.use(cors());

function connect(host: string, port: number, username: string, password: string): Promise<string> {

    if (isConnected) {
        return Promise.resolve(WELCOME_MESSAGE);
    }

    let clientConn = new Client({
        network: 'mainnet',
        host,
        port,
        username,
        password,
        ssl: {
            enabled: false,
            strict: false
        }
    });

    return new Promise<string>((resolve, reject) => {
        clientConn.getBlockchainInfo()
            .then(() => {
                client = clientConn;
                isConnected = true;
                resolve(WELCOME_MESSAGE);
            })
            .catch(err => {
                reject(err);
            });
    });
}

function disconnect(): Promise<void> {

    client = null;
    isConnected = false;

    return Promise.resolve();
}

function logError(error: any) {

    console.log('Failed. Reason: ' + error.cause.code);
}

// configure app to use bodyParser()
// this will let us get the data from
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error: ' + err.message);
});

app.get('/api/health', (req, res) => {
    res.status(200).json({healthy: true});
});

// check if we're connected (middleware)
app.use((req, res, next) => {
    if (isConnected || req.path.toLowerCase() === BASE_HREF + '/connect') {
        next();
    }
    else {
        res.status(401).json({message: 'Please connect first'});
    }
});

// ROUTES FOR OUR API
// =============================================================================
const router = express.Router();

router.post('/connect', (req, res) => {

    let {host, port, username, password} = req.body;

    console.log('Connecting...');

    connect(host, port, username, password)
        .then(message => {
            console.log('Successfully connected');
            res.status(200).json({message});
        })
        .catch(error => {

            logError(error);

            const errCode = error.cause.code;
            let message = '';

            if (errCode === 'ECONNRESET') {
                message = 'Couldn\'t establish connection. Is your full node running?';
            } else if (errCode === 'EHOSTUNREACH') {
                message = 'Host unreachable. Check your internet connection';
            }
            else {
                message = errCode;
            }

            res.status(401).json({message});
        });
});

router.get('/disconnect', (req, res) => {

    console.log('Disconnecting...');

    disconnect()
        .then(message => {
            console.log('Successfully disconnected');
            res.status(200).json({message});
        })
        .catch(error => {
            logError(error);
            res.status(500).json(error);
        });
});

router.get('/get-blockchain-info', (req, res) => {

    console.log('Getting blockchain info...');

    client.getBlockchainInfo()
        .then(info => {
            console.log('Success');
            res.status(200).json(info);
        })
        .catch(error => {
            logError(error);
            res.status(400).json(error);
        })
});

router.get('/get-block/:blockhash', (req, res) => {

    const blockhash = req.params.blockhash;

    console.log(`Getting block ${blockhash}...`);

    if (blockhash in blocksCache) {
        console.log('Already in cache');
        res.status(200).json(blocksCache[blockhash]);
    }
    else {
        client.getBlock(blockhash, true)
            .then(data => {
                console.log('Success');
                blocksCache[blockhash] = data;
                res.status(200).json(data);
            })
            .catch(error => {
                logError(error);
                res.status(400).json(error);
            })
    }
});

router.get('/get-block-count', (req, res) => {

    console.log('Getting block count...');

    client.getBlockCount()
        .then(data => {
            console.log('Success');
            res.status(200).json(data);
        })
        .catch(error => {
            logError(error);
            res.status(400).json(error);
        })
});

router.get('/get-raw-transaction/:txid', (req, res) => {

    const txid = req.params.txid;

    console.log(`Getting raw transaction ${txid}`);

    client.getRawTransaction(txid, true)
        .then(data => {
            console.log('Success');
            res.status(200).json(data);
        })
        .catch(error => {
            logError(error);
            res.status(400).json(error);
        })
});

// more routes for our API will happen here

// all of our routes will be prefixed with /api
app.use(BASE_HREF, router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
