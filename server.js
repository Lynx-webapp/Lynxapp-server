const app = require('express')(),
server = require('http').Server(app),
ws = require('ws'),
wss = new ws.Server({
  server
}),
mongoose = require('mongoose')
welcome = function(a) {
  let b = [
    `Hey ${a}`,
    `Ha te voilà ${a}, tu nous as apportés des pizzas ?`,
    `Un ${a} sauvage vient d'apparaître`,
    `Dites bonjour à ${a} !`,
    `Salut ${a} tu nous avait manqué`,
    `Hey ${a} je ne t'ai jamais vu ici`,
    `Hey ${a}, Je te souhaite la bienvenue parmi nous.`,
    `Bienvenue ${a}`,
    `${a} a rejoint le groupe`,
    `Hey ${a} tu es sur le serveur officiel de Lynx-app`,
    `${a} vient de rejoindre le serveur, tout le monde ayez l'air occupé`,
    `${a} est arrivé`
  ]
  return b[Math.floor(Math.random()*b.length)]
}

const config = {
  name: null,
  cluster: null,
  password: null,
  username: null
}
mongoose.connect(`mongodb+srv://lynxapp:QngQ4Oms9NLfs0T9@cluster0.9u5ne.mongodb.net/lynxdb-test?retryWrites=true&w=majority`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
mongoose.connection.on('connected', e => {
  if (e) throw e
  console.log('Connected to data base!')
})

app.use(require('body-parser').json())
app.use(require('body-parser').urlencoded({
  extended: true
}))

const ModalMessage = mongoose.model('messages', {
  username: String,
  content: String,
  color: String,
  avatar: String,
  CreatedAt: String
})

app.get('/message', (req, res)=> {

  ModalMessage.find({}, (e, d)=> {
    if (e) return new Error(e)
    if (!d) {
      return res.status(203).json({
        users: wss.clients.size,
        number: 0,
        msg: null
      })
    } else 
    return res.status(203).json({
        users: wss.clients.size,
        number: d.length || 0,
        msg: d
      })

  })
})

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    try {
      JSON.parse(message)
    } catch (err){
        return
      }
    let m = JSON.parse(message)
    ModalMessage.findOne({
      username: m.username
    }).exec((err, d) => {
      if (err) return new Error(err)
      if (!d) {
        var color = '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0'),
            avatar = `https://api.multiavatar.com/${m.username}.svg`
      } else { 
        var color = d.color,
            avatar = d.avatar
        }
      var ch = Date.now() + 1800000
      if (m.event === 'msg') {
        console.log(avatar)
        new ModalMessage({
          username: m.username,
          content: m.content,
          color: color,
          avatar: avatar || `https://api.multiavatar.com/${m.username}.svg`,
          CreatedAt: new Date().getUTCHours() + ':' + new Date().getUTCMinutes() + ":" + new Date().getUTCSeconds()
        }).save((e, r)=> {
          if (e) return new Error(e)
        })
      }
      wss.clients.forEach(function each(client) {
        var ch = Date.now() + 1800000 / 2.3 * 5
        ws.on('close', () => {
          return client.send(JSON.stringify({
            event: 'leave',
            content: m.username + ' a quitté le groupe.',
            username: 'Lynxou',
            color: '#42f6da',
            date: new Date().getUTCHours() + ':' + new Date().getUTCMinutes() + ":" + new Date().getUTCSeconds()
          }))
        })
        if (m.event === 'new') return client.send(JSON.stringify({
          event: m.event,
          content: welcome(m.username),
          user: m.username,
          avatar: avatar,
          username: 'Lynxou',
          color: '#42f6da',
          date: new Date().getUTCHours() + ':' + new Date().getUTCMinutes() + ":" + new Date().getUTCSeconds()
        }))
        if (m.event === 'msg') return client.send(JSON.stringify({
          date: new Date().getUTCHours() + ':' + new Date().getUTCMinutes() + ":" + new Date().getUTCSeconds(),
          username: m.username,
          content: m.content,
          event: m.event,
          avatar: avatar,
          color: color
        }))
      })
    })
  })
})

server.listen(process.env.PORT || 3000, (e)=> {
  if (e) throw new Error(e)
  console.info(`Linstening on port ${process.env.port || 3000}`)
})
