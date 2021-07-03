class Event{
    constructor(){
        this.events = {}
    }
    on(key,cb){
       if(!Array.isArray(this.events[key])) this.events[key] = []
       this.events[key].push(cb)
    }
    emit(key){
        const cbs = this.events[key] || []
        for(let cb of cbs){
            cbs()
        }
    }
}
module.exports = Event