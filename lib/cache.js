const Event = require('./event')
class Cache extends Event{
    constructor(){
        super()
        this.caches = {}
    }
    get(key){
        return this.caches[key]
    }
    set(key,value){
        this.caches[key] = value
    }
}
module.exports = Cache