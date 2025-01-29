import { useEffect, useState } from 'react'


function App() {
  const [socket, setSocket] = useState<null | WebSocket>(null)
  const [msg, setMsg] = useState('')
  const [text, setText] = useState('')
  useEffect(() => {
      const wsocket = new WebSocket('ws://localhost:8080')
      wsocket.onopen = ()=>{
        console.log('Connected')
        setSocket(wsocket);
      }
      
      wsocket.onmessage = (msg) => {
        console.log('Received message ', msg.data)
        setMsg(msg.data);
      }
      
    }, [])
    
    if(!socket){
      return (
        <>
          <h1 className='text-3xl font-light text-black'> Not Connected to Server</h1>
        </>
    )
  }
  
  console.log(socket)
  return (
    <>
      <div className="bg-black h-screen text-white w-full flex flex-col items-center justify-center text-4x">
          <input type="text" placeholder='Send a message...' value={text} className='text-black p-3' onChange={(e) => setText(e.target.value)} />
          <button onClick={() => { socket.send(JSON.stringify({"text" : text, "id" : 1}))}} className='bg-slate-50 mt-2 text-black p-2 btn '> Send msg</button>
          {msg}
      </div>
    </>
  )
}

export default App
