const waitForEvent = (contract, eventName) => new Promise(function (resolve, reject) {
	const event = contract[eventName]()

	event.watch((error, result)=> {
        if (error) {
            reject(error)
        }

        resolve(result)

        event.stopWatching()
    })

});

module.exports = {
	waitForEvent
};
