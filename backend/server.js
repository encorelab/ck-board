const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origins: ['http://localhost:4200']
  }
});

const port = process.env.PORT || 8000;
const documents = {};

io.on('connection', (socket) => {
  console.log('User connected!');
  let previousId;

  const safeJoin = currentId => {
    socket.leave(previousId);
    socket.join(currentId, () => console.log(`Socket ${socket.id} joined room ${currentId}`));
    previousId = currentId;
  };

  socket.on("addDoc", doc => {
    console.log(doc);
    documents[doc.id] = doc;
    safeJoin(doc.id);
    io.emit("documents", Object.keys(documents));
  });
})

http.listen(port);
console.log('App running at ' + port);