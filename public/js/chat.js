const socket = io()

//Elements
const $messageForm = document.getElementById("message-form")
const $messageInput = document.getElementById("message-input")
const $messageButton = document.getElementById("message-button")
const $locationSendButton = document.getElementById("send-location")
const $messages = document.getElementById("messages")

//Templates
const messageTemplate = document.getElementById("message-template").innerHTML
const locationMessageTemplate = document.getElementById("location-message-template").innerHTML
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML

//Options
const {username, room}=Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    
    //Visible height
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("HH:mm")
    })
    $messages.insertAdjacentHTML("beforeend", html)
    
    autoscroll()
})


socket.on('locationMessage', (loc) => {

    const html = Mustache.render(locationMessageTemplate, {
        username: loc.username,
        url: loc.url,
        createdAt: moment(loc.createdAt).format("HH:mm")
    })
    $messages.insertAdjacentHTML("beforeend", html)

    autoscroll()
})

socket.on('roomData', ({ room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.getElementById("sidebar").innerHTML = html
})


$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()
    $messageButton.setAttribute("disabled", "disabled")
    
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {

        $messageButton.removeAttribute("disabled")
        $messageInput.value = ""
        $messageInput.focus()

        if(error) {
            return console.log(error)
        }

        console.log("Message delivered")
    })
})

$locationSendButton.addEventListener("click", () => {

    if(!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser.")
    }

    $locationSendButton.setAttribute("disabled", "disabled")

    navigator.geolocation.getCurrentPosition((position) => {
       
        
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (message) => {
            $locationSendButton.removeAttribute("disabled")
            console.log(message)
        })


    })
})

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})