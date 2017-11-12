var client;
var joueur;
var adversaire;

window.addEventListener('DOMContentLoaded', function() {

  client = io('http://localhost:8080');
  joueur = {};
  adversaire = {};

  $('#classement').click(function(){
    $.ajax({
      url: '/classement/',
      success: function(data){
        var leHTML = '<table class="table"><thead><tr><th scope="col">#</th><th scope="col">Joueur</th><th scope="col">Temps</th><th scope="col">Score</th></tr></thead><tbody>';
        for (var i = 0; i < data.length; i++) {
          leHTML += '<tr><th scope="row">'+ (i+1) + '</th><td>'+ data[i].user +'</td><td>'+ data[i].temps +'</td><td>'+ data[i].score +'</td></tr>'
        }
        leHTML += '</tbody>';
        $('#lesscores').html(leHTML);
      }
    });
  });

  $('#validp').click(function() {
    joueur.pseudo = $('#joueur').val();
    if (!joueur.pseudo) {
      $('#errare').text('Merci d\'entrer un pseudo');
      $('#errare').css('margin-top', '8%');
    } else {
      client.emit('pseudo', joueur.pseudo);
    }
  });

  client.on('verif', function(data) {
    if (data.reponse === 'Good') {
      $('#topbanner').html('<h2>Bienvenue ' + joueur.pseudo + ' ! </h2>');
      if (data.rooms && data.rooms.length > 0) {
        let roomhtml = '';
        for (var i = 0; i < data.rooms.length; i++) {
          if (data.rooms[i].number == 1) {
            roomhtml += '<button id="' + data.rooms[i].name + '" type="button" class="btn btn btn-success stillopen">' + data.rooms[i].name + '</button>';
          } else {
            roomhtml += '<button type="button" class="btn btn btn-secondary sallespleines" disabled>' + data.rooms[i].name + '</button>';
          }
        }
        $('#dispo').html(roomhtml);
        $('.stillopen').click(function() {
          let lid = $(this).attr('id');
          client.emit('rejoindre', lid);
          joueur.salle = lid;
          $('#bannermid').html('<h3>Bienvenue dans la salle ' + lid + ' ! </h3>');
          $('#bannermid').css('margin-top', '0');
          $('#lastbanner').css('display', 'grid')
        });
      }
      $('#bannermid').css('display', 'inline-block');
    } else {
      $('#errare').text('Ce pseudo est déja pris');
      $('#errare').css('margin-top', '8%');
    }
  });

  $('#valids').click(function() {
    joueur.salle = $('#salle').val();
    if (joueur.salle === '') {
      $('#errare1').text('Merci d\'entrer un nom de salle');
      $('#errare1').css('margin-top', '8%');
    } else {
      client.emit('salle', joueur.salle);
      $('#lastbanner').css('display', 'grid');
    }
  });

  client.on('verifroom', function(data) {
    if (data === 'Good') {
      $('#bannermid').html('<h3>Bienvenue dans la salle ' + joueur.salle + ' ! </h3>');
      $('#bannermid').css('margin-top', '0');
    } else {
      $('#errare1').text('Ce nom est déjà pris');
      $('#errare1').css('margin-top', '8%');
    }
  });

  $('.persos').click(function() {
    $('.persos').css('filter', 'grayscale(1)');
    $(this).css('filter', 'grayscale(0)');
    joueur.player = $(this).attr('id');
  });

  $('#valida').click(function() {
    if (joueur.player) {
      client.emit('choixavatar', joueur.player);
      let gameon = '<div id="zone2" class="container-fluid"><div class="row"><div class="col-1 bordure"></div><div id="p1"class="col-2"><h1>' + joueur.pseudo + '</h1><img src="/img/' + joueur.player + '.png"><hr><h2>Score</h2><h2 id="score">0</h2></div><div id="zonedejeu" class="col"><p id="temps"></p></div><div id="p2" class="col-2"><h1>?</h1><img src="/img/unknown.png"><hr><h2>Score</h2><h2  id="scoreadv">0</h2></div><div class="col-1 bordure"></div></div></div>';
      $('#zone').html(gameon);
    } else {
      $('#errare2').text('Merci de choisir un avatar');
      $('#errare2').css('margin-top', '2%');
    }
  });

  client.on('miseenplace', function(data) {
    if (data[0].name === joueur.pseudo) {
      adversaire = data[1];
      let arrivee = '<h1>' + adversaire.name + '</h1><img class="img-fluid" src="/img/' + adversaire.avatar + '.png"><hr><h2>Score</h2><h2 id="scoreadv">0</h2>'
      $('#p2').html(arrivee);
      newgame();
    } else {
      if (data[1].name === joueur.pseudo) {
        adversaire = data[0];
        let arrivee = '<h1>' + adversaire.name + '</h1><img class="img-fluid" src="/img/' + adversaire.avatar + '.png"><hr><h2>Score</h2><h2 id="scoreadv">0</h2>'
        $('#p2').html(arrivee);
        newgame();
      }
    }
  });

  client.on('game', function(data) {
    pointers(data);
  });

  client.on('timer', function(data) {
    if (data.room === joueur.salle) {
      $('#temps').text('Temps restant: ' + data.countdown);
    }
  });

  client.on('position', function(data) {
    if (data.room === joueur.salle) {
      gameon(data);
      $('#score').text(data.thisgame[joueur.pseudo].score);
      $('#scoreadv').text(data.thisgame[adversaire.name].score);
    }
  });

  client.on('gameover', function(data) {
    if (data.room === joueur.salle) {
      var endscreen;
      if (data.thisgame[joueur.pseudo].score > data.thisgame[adversaire.name].score) {
        endscreen = '<div id="end"><h1>VICTOIRE</h1><h5>Votre score sera conserve</h5><h5>Pour rejouer merci de retourner sur la page home</h5></div>';
      } else {
        if (data.thisgame[joueur.pseudo].score < data.thisgame[adversaire.name].score) {
          endscreen = '<div id="end"><h1>DEFAITE</h1><h5>Pour rejouer merci de retourner sur la page home</h5></div>';
        } else {
          endscreen = '<div id="end"><h1>EGALITE</h1><h5>Pour rejouer merci de retourner sur la page home</h5></div>';
        }
      }
      $('#zonedejeu').html(endscreen);
    }
  });

  client.on('youwin', function(data){
    console.log('Hello');
    if (data.room === joueur.salle) {
      var pardefaut = '<div id="end"><h1>VICTOIRE PAR ABANDON</h1><h5>Votre score sera conserve</h5><h5>Pour rejouer merci de retourner sur la page home</h5></div>';
      $('#zonedejeu').html(pardefaut);
    }
  });


});
