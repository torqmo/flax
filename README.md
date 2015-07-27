# Flax
Flax is an ECMA6 iojs/nodejs framework designed to ease and accelerate development of large and scalable applications.

The meaning of "flax" is an inflexible version of the word "flex", not necessarily implying on the framework's inflexibility, but not necessarily not implying of it's flexibility.

## Overview 

Flax, like some other frameworks, takes the architectural enforcement approach rather than the modular approach. 

It contains the following elements / subsystems:

*   entity abstraction layer 
*   a minimal ORM with unified interface to different databases
*   event bus for cluster synchronization and consistency
*   http server wrapper
*   implementations of client web-services and UI elements 


![cluster overview](/docs/cluster.png?raw=true)


TBD : client -> web-server -> entity diagram

## Example App 
Here's an example of a library application (TBD: explanation) 
_borrowees.js_
    
    var entities = require('flax/entities');
    var presistency = require('flax/presistency');
    /**
     * Here we define our Borrowee
    /*
    
    class Borrowee extends entities.Entity {
        constructor() {
            super();
            this.borrowedItems = new BorrowedItemsList();
        }
        returnBook(bookId) {
        }
    }
    
    Borrrowee.props = {
        name: {type: string},
        birthday : {type: date}
    };
    

    class BorroweeController extends entities.EntityController {
        constructor() {
            var pLayer =  persistency.factory.get('borrowees');
            super(pLayer, Borrowee);
        }

    }
    module.exports.controller  = new BorroweeController()

## Entities
Entities are the core components of flax applications, logically you should use entities almost as much as possible

### The Entity Class

### The EntityController Class
 
## Persistency Layers


### mongodb implementaion
