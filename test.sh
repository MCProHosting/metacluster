if [ ! -d "$DIRECTORY" ]; then
    git clone https://github.com/mranney/node_redis node_redis;
fi

jasmine-node spec/

cd node_redis
node test.js