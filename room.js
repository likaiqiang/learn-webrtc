class Room {
    constructor(io){
        this.io = io
        this.sockets = []
        this.maxCount = 2
    }
    join({room,username,id}){
        const index = this.sockets.findIndex(s=>s.username === username && s.room === room)
        if(index == -1){   
            if(this.sockets.length >=this.maxCount){
                return
            } 
            else {
                this.sockets.push({
                    room,
                    username,
                    id
                })
            }
        }
        else {
            this.sockets[index].id = id
        }
    }
    to(id,key,value){
        this.io.sockets.socket(id).emit(key,value)
    }
    leave({room,username}){
        const index = this.sockets.findIndex(s=>s.username === username && s.room === room)
        this.sockets.splice(index,1)
    }
    clear(){
        this.sockets = []
    }
}
module.exports = Room