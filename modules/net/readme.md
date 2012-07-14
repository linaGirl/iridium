# socket system

the iridium socket system makes distributed messaging simple as it can be. sockets try to deliver data as good as possible but wont guarantee delivery of any data to its destination( destination may go down and dont come up again ).

## basic socket layer

node process using the iridium.net module will automatically enable a socket server ( irdium/net/base/server.js ) which listens on a random port. if a service requests a specific port a server on that specific port will be opened. this server will register itself at the directory service which runs on local or any other ( configuration required ) host. the registartion process wil return a unique id for that server instance which is passed to all sockets which work on top of this server. so every server may be used to deliver messages to multiple servers.

message sockets register for the service specifi event on the server.


## socket layer

a socket is based on top of the basic layer. it is able to establish a connection to another socket and to accept incoming sockets from the basic socket server. a socket is an undirected connection which is used for traffic initiated by one of the two sides ( thus if two hosts initiate a socket to each other two connections will exists between theese two hosts ). this connections are always on. this means the layers on top of this socket are able to write data to this sockets even if no connection is established. if the physical connection is interrupted it will reestablish the link in order to transmit waiting packets. this layer will also do basic error correction ( retransmit on failed delivery ). this sockets are sticky to one specific server. they will never connect to another service instance.

## message socket layer

this is the topmost layer of the messaging system. it consists of different socket types for some regulary used messaging patterns ( request - reply and publish - subscribe



## sub socket

subscription sockets are used to receive a stream of messages without to ask for them.


### methods
 
* contructor -> { id: "id of pub socket" }

### events

* message -> a message was received
* miss -> missed some messages ( you may get them using a req socket ). this is detected only if a message is missing between two already received messages
* offline -> the socket lost the connection to the publisher
* online -> conenction ( re ) established

### properties

* status -> online / offline




## pub socket

### events

* subscribe
* unsubscribe

### methods

* send

### properties

* subscribers
* subscriptionCount
