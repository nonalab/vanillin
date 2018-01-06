import 'babel-polyfill';

import aesjs from 'aes-js';

import EventEmitter from 'eventemitter3';
import Promise from 'bluebird';

import {getDiffieHellman} from 'diffie-hellman/browser';

import {shake_128} from 'js-sha3';

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
        repo = 'vanillin'
    }) {
        super();

        // Use this to grab all event
        this.validEvents = ['IPFSOnly', 'DiffieIPFS', 'DiffieOnly'];

        this.initTime = Date.now();

        console.log(this.initTime);

        this.web3 = new Web3(web3Provider);

        this.receivedHandshakeBlockHashSet = new Set();

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
            .setProvider(currentProvider);
        this
            .facilitatorContract
            .defaults({gas: 4e6})

        this.dh = getDiffieHellman('modp16');

        this.ipfs = new IPFS({repo})

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
                if (error)
                    this.emit('error', {error})

                    // console.log(results);

                const validResult = results
                    .filter(({args, blockHash}) => this.isTimestampValid(args.timestamp) && !this.receivedHandshakeBlockHashSet.has(blockHash))
                    .sort((a, b) => a.blockNumber < b.blockNumber)[0]

                if (validResult) {
                    // console.log(validResult);
                    this
                        .receivedHandshakeBlockHashSet
                        .add(validResult.blockHash);

                    this[`on${validResult.event}`](validResult.args)
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
        if (!this.otherGX)
            throw new Error('Did not receive other gx');

        const gxBytes = aesjs
            .utils
            .hex
            .toBytes(this.otherGX);

        console.log(gxBytes);

        const gAB = this
            .dh
            .computeSecret(new Uint8Array(gxBytes));

        console.log(gAB);

        this.key = aesjs
            .utils
            .hex
            .toBytes(shake_128(gAB, 128));
    }

    get gx() {
        return aesjs
            .utils
            .hex
            .fromBytes(this.dh.generateKeys());
    }

    isTimestampValid(timestamp) {
        return timestamp.c[0] * 10e2 > this.initTime
    }

    async storeEncrypted(data) {
        try {
            const encryptedData = this.encrypt(JSON.stringify(data));

            const node = await this.write(encryptedData);

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
        const encryptedHex = aesjs
            .utils
            .hex
            .fromBytes(encryptedBytes);
        return encryptedHex;
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

        const data = new Buffer(value);

        return this
            .ipfs
            .object
            .put(data);
    }

    /* Handle WebRTC Pairing Events */

    handlePeerEvent() {
        this
            .peer
            .on('signal', (data) => this.reply(data))
            .on('connect', () => this.emit('connect', this.peer))
            .on('data', (data) => this.emit('data', data))
            .on('stream', (stream) => this.emit('stream', stream))
    }

    /* Abstraction for the contract's call */

    sendInvite(address) {
        this
            .setOtherAddress(address)
            .contractInstance
            .init(this.otherAddress, this.gx, {from: this.accountAddress});
    }

    async reply(data) {
        console.log(data);
        const multihash = await this.storeEncrypted(data);
        console.log(multihash);

        if (this.peer.initiator) {
            this
                .contractInstance
                .reply(this.otherAddress, this.gx, multihash, {from: this.accountAddress});
        } else {
            this
                .contractInstance
                .sendPayload(this.otherAddress, multihash, {from: this.accountAddress});
        }
    }

    async handleInfo(multihash) {
        const value = await this.read(multihash)

        const em = value.toString()

        const decryptedData = await this.decrypt(em)

        this.peer.signal(JSON.parse(decryptedData))

        this.emit('token', decryptedData)
    }

    /* Contract Event Handlers */

    // On receiving initial invite
    onDiffieOnly({from, gA}) {
        this
            .setOtherGX(gA)
            .setOtherAddress(from);

        this.peer = new Peer({initiator: true, trickle: false});
        this.handlePeerEvent();
    }

    // On sending reply to invite
    onDiffieIPFS({gB, ipfsRef}) {
        this.setOtherGX(gB)

        this.peer = new Peer({initiator: false, trickle: false});
        this.handlePeerEvent();
        this.handleInfo(ipfsRef)
    }

    // On finalizing handshake
    onIPFSOnly({ipfsRef}) {
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
