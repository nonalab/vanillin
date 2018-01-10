# Contract Events

Since we'll be relying on metamask's provider, here're some caveat:

+ If for some reason the receiver are not getting any event, chances are Metamask's event listener got clogged somehow. To resolve this, switch Metamask network, restart Chrome, and return Metamask to the desired network.

+ Performance is impacted by the fact that we are filtering out event manually using a watch. Until Metamask implement websocket RTC, this won't go away anytime soon.

+ Receiving 2 consecutive events: Something is probably wrong with the Ganache instance and the best course of action is to restart everything.
