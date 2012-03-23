#!/usr/bin/env bash

apt-get install libxml2-dev -y

cd libxmljs
node-waf distclean
node-waf configure
node-waf build

