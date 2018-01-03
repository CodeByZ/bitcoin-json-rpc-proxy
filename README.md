# bitcoin-json-rpc-proxy

A simple bitcoin JSON RPC proxy

### What is This?

This project is a node.js based bitcoin JSON RPC proxy, used by [this frontend Blockchain explorer](https://github.com/CodeByZ/blockchain-explorer).

Note that this proxy needs to communicate with a [Bitcoin Core full node](https://bitcoin.org/en/download) (bitcoind / bitcoin-qt) instance, which you should install on your machine / network.

### Running the Proxy

 1. Clone the project
 2. Go into the project folder: `cd bitcoin-json-rpc-proxy` 
 3. Install dependencies and compile: `npm install` 
 4. Run the proxy server: `npm start`
 5. That's it!

### Configuring the Bitcoin Core Node
A bitcoin full node does not by default listen to JSON RPC requests, so we need to configure `bitcoin.conf` as the following example:

##### Recommended `bitcoin.conf` Settings:
```
server=1
disablewallet=1
rpcuser=<username-of-your-choice>
rpcpassword=<password-of-your-choice>
txindex=1
rpcallowip=127.0.0.1
```

##### Notes

* `server=1` property tells the node to run the JSON RPC service and accept connection requests (by default on port 8332)
* `txindex=1` tells the node to maintain a transactions index. Without it, the node will not index transactions (only blocks) so we won’t be able to run RPC queries to get raw transaction details. If you forget to set this flag before running the node and then want to enable it, then you’ll first need to run the node with the -reindex command line argument to construct the transactions index.
* `disablewallet=1` tells the node not to provide any wallet management functionality, as we’re only interested in querying the blockchain data for the sake of this exercise.
* `rpcallowip=127.0.0.1` tells the node to accept incoming connections on the local interface. If you plan to install the proxy on a different machine than the bitcoin core node, you'll need to either set the ip address to your proxy's machine address, *or* add more `rpcallowip` entries (you can add as many as you need), *or* install a local reverse proxy to tunnel requests from all interfaces to the local 127.0.0.1 interface.