class ReveiceRTC {
    constructor(socket,playCb, options) {
        this.pc = new RTCPeerConnection(options || {
            'iceServers': [
                {
                    'urls': 'turn:43.132.179.18:3478?transport=udp',
                    'credential': "butter530",
                    'username': "butter"
                }, {
                    'urls': 'turn:43.132.179.18:3478?transport=tcp',
                    'credential': "butter530",
                    'username': "butter"
                }, {
                    'urls': 'stun:43.132.179.18:3478'
                }
            ]
        })
        this.socket = socket
        this.socket.on('offer-from-server', (e, id) => {
            this.pc.setRemoteDescription(new RTCSessionDescription(e))
            this.pc.createAnswer().then(desc => {
                try{
                    this.pc.setLocalDescription(desc)
                } catch(e){
                    console.error(e)
                }
                socket.emit('desc', desc)
            })
        })
        this.socket.on('local-candidate-from-server', e => {
            this.pc.addIceCandidate(new RTCIceCandidate({
                sdpMLineIndex: e.label,
                candidate: e.candidate
            }))
        })
        this.pc.ontrack = (e) => {
            console.log('ontrack')
            if (typeof playCb === 'function') {
                playCb(e)
            }
        }
        this.pc.onicecandidate = event => {
            if (event.candidate) {
                this.socket.emit('remote-candidate', {
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate
                })
            }
        }
    }
    close(){
        this.pc.close()
        this.pc = null
    }
}

class SenderRTC {
    constructor(socket, streams, options) {
        this.pc = new RTCPeerConnection(options || {
            'iceServers': [
                {
                    'urls': 'turn:43.132.179.18:3478?transport=udp',
                    'credential': "butter530",
                    'username': "butter"
                }, {
                    'urls': 'turn:43.132.179.18:3478?transport=tcp',
                    'credential': "butter530",
                    'username': "butter"
                }, {
                    'urls': 'stun:43.132.179.18:3478'
                }
            ]
        })
        this.socket = socket
        this.streams = streams
        this.pc.onicecandidate = event => {
            if (event.candidate) {
                console.log('local-candidate')
                socket.emit('local-candidate', {
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate,
                })
            }
        }

        this.socket.on('remote-candidate-from-server', e => {
            console.log('remote-candidate-from-server', e)
            this.pc.addIceCandidate(new RTCIceCandidate({
                sdpMLineIndex: e.label,
                candidate: e.candidate
            }))
        })
        this.streams.getTracks().forEach(track => {
            this.pc.addTrack(track, this.streams)
        })
        this.socket.on('answer-from-server', e => {
            console.log('answer-from-server')
            console.log('setRemoteDescription',e)
            try{
                this.pc.setRemoteDescription(new RTCSessionDescription(e))
            } catch(e){
                console.error(e)
            }
        })

        this.pc.createOffer({
            offerToReceiveAudio: 0,
            offerToReceiveVideo: 1
        }).then(desc => {
            console.log('setLocalDescription',desc)
            this.pc.setLocalDescription(desc)
            socket.emit('desc', desc)
        })
    }
    close(){
        this.pc.close()
        this.pc = null
    }
}