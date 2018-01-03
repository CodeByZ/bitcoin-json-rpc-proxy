import * as Client from 'bitcoin-core';
import * as Promise from 'bluebird';

let connected: boolean = false;
let client = null;

export {client};

const WELCOME_MESSAGE: string = 'Welcome to the blockchain. Vires in numeris';

/**
 * isConnected
 *
 * @returns {boolean}
 */
export function isConnected(): boolean {

    return connected;
}

/**
 * connect
 *
 * @param {string} host
 * @param {number} port
 * @param {string} username
 * @param {string} password
 * @returns {<string>}
 */
export function connect(host: string, port: number, username: string, password: string): Promise<string> {

    if (connected) {
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
                connected = true;
                resolve(WELCOME_MESSAGE);
            })
            .catch(err => {
                reject(err);
            });
    });
}

/**
 * disconnect
 *
 * @returns {<void>}
 */
export function disconnect(): Promise<void> {

    client = null;
    connected = false;
    return Promise.resolve();
}
