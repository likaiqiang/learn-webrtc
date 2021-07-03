class ReveiceRTC {
    constructor(socket, videoDom,playCb, options) {
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
            // 'iceServers':[
            //     {
            //         'urls':['turn:43.132.179.18:3478','stun:43.132.179.18:3478'],
            //         'credential': "xxx",
            //         'username': "xxx"
            //     }
            // ],
            // 'iceServers': [
            //     {
            //         'urls': 'turn:43.132.179.18:3478?transport=udp',
            //         'credential': "xxx",
            //         'username': "xxx"
            //     }, {
            //         'urls': 'turn:43.132.179.18:3478?transport=tcp',
            //         'credential': "xxx",
            //         'username': "xxx"
            //     }, {
            //         'urls': 'stun:43.132.179.18:3478'
            //     }
            // ],
        })
        this.videoDom = videoDom
        this.remoteSocketId = null
        this.socket = socket
        this.socket.on('offer-from-server', (e, id) => {
            this.remoteSocketId = id
            this.pc.setRemoteDescription(new RTCSessionDescription(e))
            this.pc.createAnswer().then(desc => {
                this.pc.setLocalDescription(desc)
                socket.emit('desc', desc, this.remoteSocketId)
            })
        })
        this.socket.on('local-candidate-from-server', e => {
            console.log('local-candidate-from-server', e)
            this.pc.addIceCandidate(new RTCIceCandidate({
                sdpMLineIndex: e.label,
                candidate: e.candidate
            }))
        })
        this.pc.ontrack = (e) => {
            this.videoDom.srcObject = e.streams[0]
            // video.style.display = 'block'
            // mediaBtn.style.display = 'none'
            this.videoDom.play()
            if (typeof playCb === 'function') {
                playCb(this.videoDom, e)
            }
            // setInterval(() => {
            //     localRTC.getReceivers()[0].getStats().then(reports => {
            //         reports.forEach(report => {
            //             if (report.type === 'inbound-rtp')
            //                 console.log('receivve report', report.)
            //         })
            //     })
            // }, 1000)
        }
        this.pc.onicecandidate = event => {
            if (event.candidate) {
                this.socket.emit('remote-candidate', {
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate
                }, this.remoteSocketId)
            }
        }
    }
    close(){
        this.pc.close()
        this.pc = null
    }
}

class SenderRTC {
    constructor(socket, streams, socketId, options) {
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
        this.socketId = socketId
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
            this.pc.setRemoteDescription(new RTCSessionDescription(e))
        })

        this.pc.createOffer({
            offerToReceiveAudio: 0,
            offerToReceiveVideo: 1
        }).then(desc => {
            this.pc.setLocalDescription(desc)
            socket.emit('desc', desc, this.socketId)
        })
    }
    close(){
        this.pc.close()
        this.pc = null
    }
}
class DuplexRtc{
    
}