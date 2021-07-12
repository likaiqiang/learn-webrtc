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
        this.onOfferFromServer = this.onOfferFromServer.bind(this)
        this.onLocalCandidateFromServer = this.onLocalCandidateFromServer.bind(this)
        this.close = this.close.bind(this)

        this.socket = socket
        this.socket.on('offer-from-server', this.onOfferFromServer)
        this.socket.on('local-candidate-from-server', this.onLocalCandidateFromServer)
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
        this.pc.onicecandidate = null
        this.pc.ontrack = null
        this.pc.close()
        this.pc = null
        this.socket.off('offer-from-server',this.onOfferFromServer)
        this.socket.off('local-candidate-from-server',this.onLocalCandidateFromServer)
    }
    onOfferFromServer(e){
        try{
            this.pc.setRemoteDescription(new RTCSessionDescription(e))
        } catch(e){

        }
        this.pc.createAnswer().then(desc => {
            try{
                this.pc.setLocalDescription(desc)
            } catch(e){
                
            }
            this.socket.emit('desc', desc)
        })
    }
    onLocalCandidateFromServer(e){
        this.pc.addIceCandidate(new RTCIceCandidate({
            sdpMLineIndex: e.label,
            candidate: e.candidate
        }))
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
        this.onRemoteCandidateFromServer = this.onRemoteCandidateFromServer.bind(this)
        this.onAnswerFromServer = this.onAnswerFromServer.bind(this)
        this.close = this.close.bind(this)

        this.socket = socket
        this.streams = streams
        this.pc.onicecandidate = event => {
            if (event.candidate) {
                console.log('local-candidate')
                this.socket.emit('local-candidate', {
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate,
                })
            }
        }

        this.socket.on('remote-candidate-from-server', this.onRemoteCandidateFromServer)
        this.streams.getTracks().forEach(track => {
            this.pc.addTrack(track, this.streams)
        })
        this.socket.on('answer-from-server', this.onAnswerFromServer)

        this.pc.createOffer({
            offerToReceiveAudio: 0,
            offerToReceiveVideo: 1
        }).then(desc => {
            console.log('setLocalDescription',desc)
            this.pc.setLocalDescription(desc)
            this.socket.emit('desc', desc)
        })
    }
    close(){
        this.pc.onicecandidate = null
        this.pc.close()
        this.pc = null
        this.socket.off('remote-candidate-from-server',this.onRemoteCandidateFromServer)
        this.socket.off('answer-from-server',this.onAnswerFromServer)
    }
    onRemoteCandidateFromServer(e){
        this.pc.addIceCandidate(new RTCIceCandidate({
            sdpMLineIndex: e.label,
            candidate: e.candidate
        }))
    }
    onAnswerFromServer(e){
        try{
            this.pc.setRemoteDescription(new RTCSessionDescription(e))
        } catch(e){}
    }
}
