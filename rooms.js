import Room from './room'
class Rooms{
    constructor(){
        this.rooms = {}
    }
    createOrJoinRoom({room,username,id}){
        if(this.rooms[id]){
            this.rooms[id].join({
                room,
                username,
                id
            })
        }
        else {
            this.rooms[id] = new Room({room,username,id})
        }
    }
}

module.exports = Rooms