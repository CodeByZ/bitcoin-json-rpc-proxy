const express = require('express');
const bodyParser = require('body-parser');
const Client = require('bitcoin-core');

const app = express();
const cors = require('cors');

const WELCOME_MESSAGE: string = 'Welcome to the blockchain. Vires in numeris';

app.use(cors());

const port = process.env.PORT || 8080;
const BASE_HREF = '/api';

let isConnected: boolean = false;
let client = null;

// {
//     "host": "192.168.1.9",
//     "port": 1972,
//     "username": "bitcoinrpc",
//     "password": "rpc##PA%%wo1D"
// }

function disconnect(): Promise<void> {

    client = null;
    isConnected = false;

    return Promise.resolve();
}

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

// configure app to use bodyParser()
// this will let us get the data from
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// error handling middleware
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Error: ' + err.message);
});

app.use('/api/health', (req, res) => {
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
    connect(host, port, username, password)
        .then(message => {
            res.status(200).json({message});
        })
        .catch(error => {
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
    disconnect()
        .then(message => {
            res.status(200).json({message});
        })
        .catch(error => {
            res.status(500).json(error);
        });
});

router.get('/get-blockchain-info', (req, res) => {
    client.getBlockchainInfo().then(info => {
        res.status(200).json(info);
    });
});

router.get('/get-block/:blockhash', (req, res) => {
    client.getBlock(req.params.blockhash, true)
        .then(data => {
            res.status(200).json(data);
        })
        .catch(error => {
            res.status(400).json(error);
        })
});

router.get('/get-received-by-address/:address', (req, res) => {
    client.getReceivedByAddress(req.params.address, true)
        .then(data => {
            res.status(200).json(data);
        })
        .catch(error => {
            res.status(400).json(error);
        })
});


router.get('/get-block-count', (req, res) => {
    client.getBlockCount()
        .then(data => {
            res.status(200).json(data);
        })
        .catch(error => {
            res.status(400).json(error);
        })
});

router.get('/get-raw-transaction/:txid', (req, res) => {
    client.getRawTransaction(req.params.txid, true)
        .then(data => {
            res.status(200).json(data);
        })
        .catch(error => {
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
