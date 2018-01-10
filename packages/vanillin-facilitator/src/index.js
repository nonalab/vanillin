import 'babel-polyfill';

import aesjs from 'aes-js';
import {ec as ECDH} from 'elliptic';

import EventEmitter from 'eventemitter3';
import Promise from 'bluebird';

import contract from 'truffle-contract';
import truffleSchema from '../build/contracts/VanillinFacilitator.json';

import Web3 from 'web3';

import Peer from 'simple-peer';

const IPFS = window.Ipfs;

/*
    It initializes the Facilitator given the web3 provider, default to ganache's localhost.
*/
export default class VanillinFacilitator extends EventEmitter {
    constructor({
        web3Provider = new Web3
            .providers
            .HttpProvider('http://localhost:7545'),
        repo = 'vanillin',
        swarm = []
    }) {
        super();

        // Use this to grab all event
        this.validEvents = ['IPFSOnly', 'DiffieIPFS', 'DiffieOnly'];

        // Using seconds cuz ETH contract use that
        this.initTime = Date.now() / 1000;

        this.ecdh = new ECDH('curve25519')

        this.inviteHashSet = new Set()

        this.keypair = this
            .ecdh
            .genKeyPair()

        console.log(this.initTime);

        this.web3 = new Web3(web3Provider);

        const {currentProvider} = this.web3;

        /*
        	Hack for the web3 vs truffle bug:
			https://github.com/trufflesuite/truffle-contract/issues/56
        */

        if (typeof currentProvider.sendAsync !== "function") {
            currentProvider.sendAsync = function() {
                return currentProvider
                    .send
                    .apply(currentProvider, arguments)
            }
        }

        this.facilitatorContract = contract(truffleSchema);
        this
            .facilitatorContract
            .setProvider(currentProvider)
        this
            .facilitatorContract
            .defaults({gas: 4e6})

        this.ipfs = new IPFS({
            repo,
            config: {
                Addresses: {
                    Swarm: [
                        '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star', ...swarm
                    ]
                }
            }
        })

        this
            .ipfs
            .on('ready', () => this.emit('ipfs-ready'));
    }

    // Initialize contract contractInstance and all event subscriptions
    async init() {
        const [contractInstance, accounts] = await Promise.all([
            this
                .facilitatorContract
                .deployed(),
            this
                .web3
                .eth
                .getAccounts(),
            this
                .ipfs
                .isOnline()
                    ? this.waitFor('ipfs-ready')
                    : 0
        ]);

        this.accountAddress = accounts[0];

        this.contractInstance = contractInstance;

        this.emit('ready')
    }

    send(message) {
        if (!this.peer || this.peer.error) {
            return this.emit('error', new Error('Simple Peer connection was not established'))
        }

        if (!message) {
            return this.emit('error', new Error('Message is falsy'))
        }

        const payload = JSON.stringify(message);

        if (payload === '{}') {
            return this.emit('error', new Error('Message is empty object'))
        }

        if (!payload.type) {
            return this.emit('error', new Error('Message has not type'))
        }

        this.emit(payload.type, payload)

        this
            .peer
            .send(payload)
    }

    /* Contract event subscribers */
    async startEventWatching(refreshRate = 1800) {
        const fromBlock = await this
            .web3
            .eth
            .getBlock('latest')

        // An array of interval
        this.eventWatchers = this
            .validEvents
            .map((eventName) => this.subscribeToContractEvent(eventName, fromBlock.number, refreshRate))
    }

    stopEventWatching() {
        this
            .eventWatchers
            .map((ew) => {
                clearInterval(ew)
            })
    }

    subscribeToContractEvent(eventName, fromBlock, refreshRate) {
        return setInterval(() => {
            const eventInstance = this.contractInstance[eventName]({
                to: this.accountAddress
            }, {fromBlock, to: 'latest'})

            eventInstance.get((error, results) => {
                if (error) {
                    this.emit('error', {error})
                }

                // if (results.length > 0) {
                //     console.log(eventName);
                //     console.log(results);
                // }

                const validResult = results
                    .filter(({args, transactionHash}) => !this.inviteHashSet.has(transactionHash) && this.isTimestampValid(args.timestamp))
                    .sort((a, b) => a.blockNumber < b.blockNumber)[0]

                if (validResult) {
                    // console.log(validResult);
                    this
                        .inviteHashSet
                        .add(validResult.transactionHash);

                    this[`on${validResult.event}`](validResult.args);
                }
            })
        }, refreshRate);
    }

    /* Setters for mirror properties */
    setOtherAddress(value) {
        this.otherAddress = value;
        return this;
    }

    setOtherGX(value) {
        this.otherGX = value;
        return this;
    }

    setSharedKey() {
        if (!this.otherGX) {
            return this.emit('error', new Error('Did not receive other gx'))
        }

        const gxPublic = this
            .ecdh
            .keyFromPublic(this.otherGX, 'hex')
            .getPublic()

        this.key = this
            .keypair
            .derive(gxPublic)
            .toArray()
    }

    get gx() {
        return this
            .keypair
            .getPublic('hex');
    }

    isTimestampValid(timestamp) {
        return timestamp.comparedTo(this.initTime) > 0
    }

    async storeEncrypted(data) {
        try {
            const encryptedData = this.encrypt(JSON.stringify(data));
            // console.log(encryptedData);

            const node = await this.write(encryptedData);
            // console.log(node);

            return node
                .toJSON()
                .multihash;

        } catch (error) {
            this.emit('error', error)
            return null
        }
    }

    /* Crypto operations: */

    encrypt(m) {
        if (!this.key)
            this.setSharedKey();

        const aesCtr = new aesjs
            .ModeOfOperation
            .ctr(this.key);

        const textBytes = aesjs
            .utils
            .utf8
            .toBytes(m);

        const encryptedBytes = aesCtr.encrypt(textBytes);

        // Return the hex presentation
        return aesjs
            .utils
            .hex
            .fromBytes(encryptedBytes);
    }

    decrypt(em) {
        if (!this.key)
            this.setSharedKey();

        const aesCtr = new aesjs
            .ModeOfOperation
            .ctr(this.key);

        const encryptedBytes = aesjs
            .utils
            .hex
            .toBytes(em);

        const decryptedBytes = aesCtr.decrypt(encryptedBytes);

        // Return the utf8 presentation
        return aesjs
            .utils
            .utf8
            .fromBytes(decryptedBytes);
    }

    /* IPFS operations: */

    read(multihash) {
        if (!this.ipfs.isOnline())
            throw new Error(`IPFS is not ready`);

        return this
            .ipfs
            .object
            .data(multihash);
    }

    write(value) {
        if (!this.ipfs.isOnline())
            throw new Error(`IPFS is not ready`);

        const obj = {
            Data: Buffer.from(value),
            Links: []
        }

        return this
            .ipfs
            .object
            .put(obj);
    }

    /* Handle WebRTC Pairing Events */

    async handlePeerEvent() {
        try {
            this
                .peer
                .on('signal', (data) => this.onSignal(data))
                .on('connect', () => this.emit('connect', this.peer))
                .on('data', (data) => this.emit(data.type, data))
                .on('error', (error) => {
                    this.peer.error = true

                    this.emit('error', error)
                })

            // .on('data', (data) => this.emit('data', data))
            // .on('stream', (stream) => this.emit('stream', stream))
        } catch (error) {
            this.emit('error', error)
        }
    }

    /* Abstraction for the contract's call */

    sendInvite(address) {
        console.log('SEND INVITE');
        this
            .setOtherAddress(address)
            .contractInstance
            .init(this.otherAddress, this.gx, {from: this.accountAddress});
    }

    async onSignal(data) {
        // console.log(data);
        const multihash = await this.storeEncrypted(data);
        // console.log(multihash);

        if (this.peer.initiator) {
            console.log('REPLY');
            this
                .contractInstance
                .reply(this.otherAddress, this.gx, multihash, {from: this.accountAddress});
        } else {
            console.log('FINALIZE');
            this
                .contractInstance
                .finalize(this.otherAddress, multihash, {from: this.accountAddress});
        }
    }

    async handleInfo(multihash) {
        // console.log(multihash);

        const value = await this.read(multihash)

        // console.log(value);

        const em = value.toString()

        const decryptedData = await this.decrypt(em)

        // console.log(decryptedData);

        this
            .peer
            .signal(JSON.parse(decryptedData))

        this.emit('token', decryptedData)
    }

    /* Contract Event Handlers */

    // On receiving initial invite
    onDiffieOnly({from, gA}) {
        // console.log('onDiffieOnly');
        this
            .setOtherGX(gA)
            .setOtherAddress(from);

        this.peer = new Peer({initiator: true});
        this.handlePeerEvent();
    }

    // On receiving reply and send back invite
    onDiffieIPFS({gB, ipfsRef}) {
        // console.log('onDiffieIPFS');
        this.setOtherGX(gB)

        this.peer = new Peer({initiator: false});
        this.handlePeerEvent()
        this.handleInfo(ipfsRef)
    }

    // On finalizing handshake
    onIPFSOnly({ipfsRef}) {
        // console.log('onIPFSOnly');
        this.handleInfo(ipfsRef)
    }

    /* Waiting Coroutine */
    async waitFor(eventName) {
        const self = this;
        return new Promise(function(resolve, reject) {
            self.once(eventName, resolve)
        });
    }

}
