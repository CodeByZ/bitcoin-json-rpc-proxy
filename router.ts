import * as express from 'express';

import {client, connect, disconnect} from './connection';
import {blocksCache} from "./cache";

const router = express.Router();
export {router};

/**
 * /connect endpoint
 */
router.post('/connect', (req, res) => {

    let {host, port, username, password} = req.body;

    console.log('Connecting...');

    connect(host, port, username, password)
        .then(message => {
            console.log('Successfully connected');
            return res.status(200).json({message});
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

            <void> res.status(401).json({message});
        });
});

/**
 * /disconnect endpoint
 */
router.get('/disconnect', (req, res) => {

    console.log('Disconnecting...');

    disconnect()
        .then(message => {
            console.log('Successfully disconnected');
            <void> res.status(200).json({message});
        })
        .catch(error => {
            res.status(500)
                .json(error)
                .then(() => {
                    logError(error);
                });
        });
});

/**
 * /get-blockchain-info endpoint
 */
router.get('/get-blockchain-info', (req, res) => {

    console.log('Getting blockchain info...');

    client.getBlockchainInfo()
        .then(info => {
            console.log('Success');
            <void> res.status(200).json(info);
        })
        .catch(error => {
            res.status(400)
                .json(error)
                .then(() => {
                    logError(error);
                });
        });
});

/**
 * /get-block endpoint
 */
router.get('/get-block/:blockhash', (req, res) => {

    const blockhash = req.params.blockhash;

    console.log(`Getting block ${blockhash}...`);

    if (blockhash in blocksCache) {
        console.log('Already in cache');
        <void> res.status(200).json(blocksCache[blockhash]);
    }
    else {
        client.getBlock(blockhash, true)
            .then(data => {
                console.log('Success');
                blocksCache[blockhash] = data;
                <void> res.status(200).json(data);
            })
            .catch(error => {
                res.status(400)
                    .json(error)
                    .then(() => {
                        logError(error);
                    });
            });
    }
});

/**
 * get-block-count endpoint
 */
router.get('/get-block-count', (req, res) => {

    console.log('Getting block count...');

    client.getBlockCount()
        .then(data => {
            console.log('Success');
            <void> res.status(200).json(data);
        })
        .catch(error => {
            logError(error);
            res.status(400)
                .json(error)
                .then(() => {
                    logError(error);
                });
        });
});

/**
 * /get-raw-transaction endpoint
 */
router.get('/get-raw-transaction/:txid', (req, res) => {

    const txid = req.params.txid;

    console.log(`Getting raw transaction ${txid}`);

    client.getRawTransaction(txid, true)
        .then(data => {
            console.log('Success');
            <void> res.status(200).json(data);
        })
        .catch(error => {
            logError(error);
            res.status(400)
                .json(error)
                .then(() => {
                    logError(error);
                });
        })
});

/**
 * logError
 *
 * @param error
 */
function logError(error: any) {

    console.log('Failed. Reason: ' + error.cause.code);
}
