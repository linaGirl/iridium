#!/usr/bin/env bash

apt-get install libzmq-dev -y
cd ./zeromq
node-waf distclean
node-waf configure
node-waf build

cd ../msgpack
make clean
make
#make install
