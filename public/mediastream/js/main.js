function main(){
    const video = document.getElementById('video')
    const startBtn = document.getElementById('start')
    const stopBtn = document.getElementById('stop')
    const videofigure = document.getElementById('videofigure')
    const preview = document.getElementById('preview')
    const captureBtn = document.getElementById('capture')
    const downloadBtn = document.getElementById('download')
    let streams = null
    const initFilters = ()=>{
        const filterSelect = document.getElementById('filterSelect')
        const filters = [
            "_1977",
            "aden",
            "amaro",
            "brannan",
            "brooklyn",
            "clarendon",
            "gingham",
            "hudson",
            "inkwell",
            "kelvin",
            "lark",
            "lofi",
            "mayfair",
            "moon",
            "nashville",
            "perpetua",
            "reyes",
            "rise",
            "slumber",
            "stinson",
            "toaster",
            "valencia",
            "walden",
            "willow",
            "xpro2"
        ]
        filterSelect.className = filters[0]

        const fra = document.createDocumentFragment()
        for(let f of filters){
            const option = document.createElement('option')
            option.textContent = f
            option.value = f
            fra.appendChild(option)
        }
        filterSelect.appendChild(fra)
        filterSelect.addEventListener('change',(e)=>{
            videofigure.className = e.target.value
        })
    }

    const stop = ()=>{
        streams.getTracks().forEach(track=>{
            track.stop()
        })
    }
    const start = async ()=>{
        streams = await navigator.mediaDevices.getUserMedia({
            // audio: {
            //     noiseSuppression: true,
            //     echoCancellation: true
            // },
            audio:false,
            video: {
                width: 320,
                height: 240,
                frameRate:15
            }
        })
        video.srcObject = streams
    }
    const initCapture = ()=>{
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        captureBtn.addEventListener('click',()=>{
            const style = getComputedStyle(video)
            const width =  parseInt(style.width) / 2
            const height = parseInt(style.height) / 2

            canvas.width = width
            canvas.height = height
           
            ctx.drawImage(video,0,0,width,height)

            const svgDomStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}px" height="${height}px">
                                    <foreignObject x="0" y="0" width="100%" height="100%">
                                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cssgram/0.1.10/cssgram.min.css">
                                        <figure class="${filterSelect.className}">
                                            <img src="${canvas.toDataURL('image/png')}" alt="">
                                        </figure>
                                    </foreignObject>
                                </svg>`
            

            console.log('ddd',svgDomStr)

            // preview.src = `data:image/svg+xml;charset=utf-8,${svgDomStr}`
            preview.innerHTML = svgDomStr
        })
    }
    const download = ()=>{
        const str = preview.getAttribute('src')
        if(!src) return
        window.location.href = str.replace("image/png", "image/octet-stream")
    }
    start()
    initFilters()
    initCapture()
    startBtn.addEventListener('click',start)
    stopBtn.addEventListener('click',stop)
    downloadBtn.addEventListener('click',download)

}
main()