/*
    VanillinFacilitator Test
*/

const {
	waitForEvent
} = require('./TestUtils');

const VanillinFacilitator = artifacts.require('VanillinFacilitator');

const gA = 'A'
const gB = 'B'
const ipfsA = 'ipfsA'
const ipfsB = 'ipfsB'

contract('VanillinFacilitator', function ([alice, bob]) {

	it('should init and emit DiffieOnly', async function () {
		const facilitatorInstance = await VanillinFacilitator.deployed();

		// Alice sends Bob her gA
		facilitatorInstance.init(bob, gA)

		const firedEvent = await waitForEvent(facilitatorInstance, 'DiffieOnly')

		assert.equal(firedEvent.args.to, bob)
		assert.equal(firedEvent.args.gA, gA)
	});

	it('should reply and emit DiffieIPFS', async function () {
		const facilitatorInstance = await VanillinFacilitator.deployed();

		// Bob reply back to Alice with his gB and his ipfs address
		facilitatorInstance.reply(alice, gB, ipfsB)

		const firedEvent = await waitForEvent(facilitatorInstance, 'DiffieIPFS')

		assert.equal(firedEvent.args.to, alice)
		assert.equal(firedEvent.args.gB, gB)
		assert.equal(firedEvent.args.ipfsRef, ipfsB)
	});

});
