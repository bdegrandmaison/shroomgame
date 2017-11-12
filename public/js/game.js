var newgame = function() {
  var zone = document.getElementById('zonedejeu');
  if (zone) {
    zone.addEventListener('mousemove', function(event) {
      var top = event.clientY + 'px';
      var left = event.clientX + 'px';
      client.emit('gamestart', {
        room: joueur.salle,
        name: joueur.pseudo,
        top: top,
        left: left
      });
    });
  }
};

var pointers = function(data) {
  if (data[joueur.salle]) {
    if (!document.getElementById(joueur.pseudo)) {
      var ownpointer = document.createElement('div');
      ownpointer.id = joueur.pseudo;
      $('#zonedejeu').append(ownpointer);
    } else {
      let ownpointer = document.getElementById(joueur.pseudo);
      if (data[joueur.salle][joueur.pseudo]) {
        for (property in data[joueur.salle][joueur.pseudo].style) {
          ownpointer.style[property] = data[joueur.salle][joueur.pseudo].style[property];
        }

      }
    }

    if (!document.getElementById(adversaire.name)) {
      var otherpointer = document.createElement('div');
      otherpointer.id = adversaire.name;
      $('#zonedejeu').append(otherpointer);
    } else {
      var otherpointer = document.getElementById(adversaire.name);
      if (data[joueur.salle][adversaire.name]) {
        for (property in data[joueur.salle][adversaire.name].style) {
          otherpointer.style[property] = data[joueur.salle][adversaire.name].style[property];
        }
        client.emit('ready',joueur.salle);
      }
    }
  }
};

var gameon = function(data){
  if (document.getElementById('shroom')) {
    var shroom = document.getElementById('shroom');
    shroom.parentNode.removeChild(shroom);
    var newshroom = document.createElement('img');
    newshroom.src = 'img/shroom.jpg';
    newshroom.id = 'shroom';
    newshroom.style.top = data.top;
    newshroom.style.left = data.left;
    $('#zonedejeu').append(newshroom);
    $('#shroom').click(function(){
      client.emit('clicked', {room: joueur.salle, player: joueur.pseudo, adversaire: adversaire.name })
    });
  } else {
    var shroom = document.createElement('img');
    shroom.src = 'img/shroom.jpg';
    shroom.id = 'shroom';
    shroom.style.top = data.top;
    shroom.style.left = data.left;
    $('#zonedejeu').append(shroom);
    $('#shroom').click(function(){
      client.emit('clicked', {room: joueur.salle, player: joueur.pseudo, adversaire: adversaire.name })
    });
  }
}
