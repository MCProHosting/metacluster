# Metacluster

Metacluster is a daemon to synchronize writes across multiple memcached/redis servers or clusters.

It effectively acts as a proxy, allowing you to run metacluster on a server with many application instances, and interact with it like you would a normal memcached or redis server. Functional tests are done (see node_redis_output.txt) to ensure compatible behaviour.

![Architecture Diagram](http://i.imgur.com/W1GNnO0.png)

Writes are done asynchronously across the list of clusters, we only wait for the response from one server/cluster before returning to the application.

Reads are done randomly amoungst the list of servers/clusters defined. Clusters with `local: true` in the config (indicating that they may be accessed with lower latency, i.e. they're in the same datacenter) will be prioritised over other instances.

### So I should use this instead of cluster?

No. Clusters are good But after a point, with very many servers or clusters, the default synchronisation breaks down. You have many servers either containing sharded data or replicated data in multiple locations, with potentially great latency between other locations. If you treat them as a single cluster, you're either paying huge read times (if the data is sharded) or huge write times (if the data is replicated).

Metacluster is a way of mitigating that. It replicate data across geographic clusters, in the event that a user is routed to another location, especially frequent if they're on mobile devices and travelling. But,  it read from the lowest latency source (i.e., the local cluster) and verifies that data asynchronously with random other remote clusters. This allows you to scale more efficiently in highly distributed multi-homed environments.

### Caveats

Due to the nature of this proxy, stateful actions on redis are unreliable and should not be used. This includes pub/sub functionality, the monitor command, and client listings.

### Installation

Ensure you have node.js installed locally.

 1. Run `npm install`
 2. Copy `config.example.json` to `config.json` and fill in your details.
 3. To start the daemon, run `npm start`.

### Tests

We use the functional tests of the node-memcached adapter to ensure metacluster exhibits the correct behaviour.
