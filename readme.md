# Memcluster

Memcluster is a daemon to synchronize writes across multiple memcached servers or clusters.

It effectively acts as a memcached proxy, allowing you to run memcluster on a server with many application instances, and interact with it like you would a normal memcached server.

Writes are done asynchronously across the list of clusters, we only wait for the response from one server/cluster before returning to the application.

Reads are done randomly amoungst the list of servers/clusters defined. Clusters with `local: true` in the config (indicating that they may be accessed with lower latency, i.e. they're in the same datacenter) will be prioritised over other instances.

### Installation

Ensure you have node.js installed locally.

 1. Run `npm install`
 2. Copy `config.example.json` to `config.json` and fill in your details.
 3. To start the daemon, run `npm start`.
