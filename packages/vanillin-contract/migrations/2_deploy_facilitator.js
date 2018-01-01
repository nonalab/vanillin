const VanillinFacilitator = artifacts.require('VanillinFacilitator');

module.exports = function (deployer) {
	deployer.deploy(VanillinFacilitator)
};
