import aesjs from 'aes-js';
import IPFS from 'ipfs';

import EventEmitter from 'eventemitter3';
import Promise from 'bluebird';

import {
	getDiffieHellman
} from 'diffie-hellman/browser';

import {
	shake_128,
} from 'js-sha3';

import contract from 'truffle-contract';
import truffleSchema from '../build/contracts/VanillinFacilitator.json';

import Web3 from 'web3';

/*
    It initializes the Facilitator given the web3 provider, default to ganache's localhost.
*/
export default class VanillinFacilitator extends EventEmitter {
	constructor({
		web3 = null,
		web3ProviderUrl = 'http://localhost:7545',
		repo: 'vanillin'
	}) {
		super();

		this.initTime = Date.now();

		this.web3 = web3 ||
			new Web3(new Web3.providers.HttpProvider(web3ProviderUrl));

		this.facilitatorContract = contract(truffleSchema)
			.setProvider(this.web3.currentProvider);

		this.dh = getDiffieHellman('modp16');

		this.ipfs = new IPFS({
			repo
		})

		this.ipfs.on('ready', this.emit('ipfs-ready'));
	}

	// Initialize contract contractInstance and all event subscriptions
	async init() {
		const [
			contractInstance,
			accounts
		] = await Promise.all([
			this.facilitatorContract.deployed(),
			this.web3.eth.getAccounts(),
			this.waitFor('ipfs-ready')
		])

		[
			'IPFSOnly',
			'DiffieIPFS',
			'DiffieOnly'
		].map((eventName) => {
			this.subscribeToContractEvent(contractInstance[eventName]({
				to: accounts[0]
			}))
		})

		this.contractInstance = contractInstance;
	}

	/* Setters for mirror properties */
	setOtherAddress(value) {
		this.otherAddress = value;
	}

	setOtherGX(value) {
		this.otherGX = value;
	}

	setSharedKey() {
		if(!this.otherGX) throw new Error('Did not receive other gx');

		const gxBytes = aesjs.utils.hex.toBytes(this.otherGX);

		const gAB = this.dh.computeSecret(new Uint8Array(gxBytes));

		this.key = aesjs.utils.hex.toBytes(shake_128(gAB, 128));
	}

	get gx() {
		return aesjs.utils.hex.fromBytes(this.dh.generateKeys());
	}

	// TODO: Need to investigate this

	isDataValid(data) {
		console.log(data);
		return(
			data &&
			data.length > 0 &&
			data[data.length - 1].timestampt.c[0] * 1000 > this.initTime
		)
	}

	/* Abstraction for the contract's call */

	sendInvite() {
		this.contractInstance.requestCommunication(
			this.otherAddress, this.gx
		);
	}

	async reply(data, initiator) {
		const multihash = await this.storeEncrypted(data);

		if(initiator) {
			this.contractInstance.respondToRequest(
				this.otherAddress, this.gx, multihash
			);
		} else {
			this.contractInstance.sendPayload(
				this.otherAddress, multihash
			);
		}
	}

	async storeEncrypted(data) {
		const encryptedData =
			this.encrypt(JSON.stringify(data));

		const node = await this.write(encryptedData);

		return node.toJSON()
			.multihash;
	}

	/* Crypto operations: */

	encrypt(m) {
		if(!this.key) this.setSharedKey();

		const aesCtr = new aesjs.ModeOfOperation.ctr(this.key);
		const textBytes = aesjs.utils.utf8.toBytes(m);
		const encryptedBytes = aesCtr.encrypt(textBytes);
		const encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
		return encryptedHex;
	}

	decrypt(em) {
		if(!this.key) this.setSharedKey();

		const aesCtr = new aesjs.ModeOfOperation.ctr(this.key);
		const encryptedBytes = aesjs.utils.hex.toBytes(em);
		const decryptedBytes = aesCtr.decrypt(encryptedBytes);
		return aesjs.utils.utf8.fromBytes(decryptedBytes);
	}

	/* IPFS operations: */

	read(multihash) {
		if(!this.ipfs.isOnline()) throw new Error(`IPFS is not ready`);

		return this.ipfs.object.data(multihash);
	}

	write(value) {
		if(!this.ipfs.isOnline()) throw new Error(`IPFS is not ready`);

		const data = new Buffer(value);

		return this.ipfs.object.put(data);
	}

	/* Waiting Coroutine */
	async waitFor(eventName) {
		const self = this;
		return new Promise(function (resolve, reject) {
			self.once(eventName, resolve)
		});
	}

	subscribeToContractEvent(eventInstance) {
		eventInstance.watch((error, result) => {
			if(error) this.emit('error', error)

			this.emit(event, result)
		})
	}

}
