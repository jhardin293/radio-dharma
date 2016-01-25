var SoundcloudAudioSource = function (player) {
  var self = this;
  var analyser;
  var audioCtx = new (window.AudioContext || window.webkitAudioContext);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  player.crossOrigin = "anonymous";

  var source = audioCtx.createMediaElementSource(player);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  var sampleAudioStream = function() {
    analyser.getByteFrequencyData(self.streamData);
    //Calculate an overall volume value
    var total = 0;
    for (var i = 0; i < 80; i++) {
      total += self.streamData[i];
    }
    self.volume = total;
    //console.log(self.volume);
  };
  setInterval(sampleAudioStream, 20);
  this.volume = 0;
  this.streamData = new Uint8Array(128);
  this.playStream = function(streamUrl) {
    player.addEventListener('ended', function(){
      self.directStream('coasting');
    });
    player.setAttribute('src', streamUrl);
    player.load();
  };
};

var Visualizer = function() {
  var audioSource;
  var circ;
  var bar;
  var draw = function() {
    // you can then access all the frequency and volume data
    var reduced = audioSource.streamData.reduce(function(prev,cur){ return prev + cur});
    var avg = reduced / audioSource.streamData.length;
    var value = audioSource.streamData[15];
    var scale = d3.scale.linear().domain([0, 60]).range([50,100]);
    var scaledValue = scale(avg);
    circ.style.height = scaledValue + '%';
    circ.style.width = scaledValue + '%';
    //console.log(audioSource.volume);

    for(bin = 0; bin < audioSource.streamData.length; bin ++) {
        // do something with each value. Here's a simple example
        var val = audioSource.streamData[bin];
        var line = document.getElementById('bar' + bin);
        line.style.height = val + 'px';
        
    }

    requestAnimationFrame(draw);
  };
  this.init = function(options) {
    audioSource = options.audioSource;
    circ = document.getElementById('circle');
    audioSource.streamData.forEach(function(bin, i){
      bar = document.createElement('div');
      bar.setAttribute('class', 'bar');
      bar.setAttribute('id', 'bar' + i);
      document.getElementById('barChart').appendChild(bar);
      bar.style.height = '100px';
    });
    draw();
  }; 

  this.end = function() {
    circ = document.getElementById('circle');
    console.log(circ,'circ');
    circ.style.height = '';
    circ.style.width = '';
  };
};
/* Makes a request to the Soundcloud API and returns JSON data. */
var SoundcloudLoader = function(player,uiUpdater){
  var self = this;
  var client_id = '25b96779cf795b0c81cb97428d06ec0d';
  this.sound = {};
  this.streamUrl ="";
  this.errorMessage = "";
  this.player = player;
  this.uiUPdater = uiUpdater;

  this.loadStream = function(track_url, successCallback, errorCallback) {
    var tempUrl = "https://soundcloud.com/werkspace/jengi-beats-sun-sun";
    SC.initialize({
      client_id: client_id
    }); 
    SC.get('/resolve', { url: tempUrl }).then(function(sound){
      if(sound.errors) {
        errrorCallback();
      } else  {
        if(sound.kind === 'playlist'){
          self.sound = sound;
          self.steamPlaylistIndex = 0;
          self.steamUrl = function() {
            return sound.tracks[self.streamPlaylistIndex].stream_url + '?client_id=' + client_id;
          };
          successCallback();
        }else{
          self.sound = sound;
          self.streamUrl = function(){ 
            return sound.stream_url + '?client_id=' + client_id;
          };
          successCallback();
        }
      }
    });
  };

  this.directStream = function(direction){
    if(direction == 'toggle') {
      if (this.player.paused) {
        this.player.play();
      } else {
        this.player.pause();
      }
    }

    else if(this.sound.kind === 'playlist') {
      if(direction === 'coasting') {
        this.steamPlaylistIndex++;
      }else if (direction === 'forward') {
        if(this.streamPlaylistIndex >= this.sound.track_count-1) this.steamPlaylist = 0;
        else this.steamPlayListIndex++;
      }else{
        if(this.steamPlaylistIndex <= 0)  this.steamPlaylistIndex = this.sound.track_count-1;
        else this.streamPlaylistIndex--;
      }
      if(this.steamPlaylistIndex >= 0 && this.streamPlaylistIndex <= this.sound.track_count-1) {
        this.player.setAtrribute('src', this.streamUrl());    
        this.uiUpdater.update(this);
        this.player.play();
      }
    }
  };
};

/*Class to update the UI when a new sound is loaded*/
var UiUpdater = function() {
    var controlPanel = document.getElementById('controlPanel');
    var trackInfoPanel = document.getElementById('trackInfoPanel');
    var infoImage = document.getElementById('infoImage');
    var infoArtist = document.getElementById('infoArtist');
    var infoTrack = document.getElementById('infoTrack');
    var messageBox = document.getElementById('messageBox');
     
    this.clearInfoPanel = function() {
      // clear the current contents
      infoArtist.innerHTML = "";
      infoTrack.innerHTML = "";
    };
    this.update = function(loader) {
      //update the track and artist in the controlPanel
      var artistLink = document.createElement('a');
      artistLink.setAttribute('href', loader.sound.user.permalink_url);
      artistLink.innerHTML = loader.sound.user.username;
      var trackLink = document.createElement('a');
      trackLink.setAttribute('href', loader.sound.permalink_url);

       if(loader.sound.kind=="playlist"){
            trackLink.innerHTML = "<p>" + loader.sound.tracks[loader.streamPlaylistIndex].title + "</p>" + "<p>"+loader.sound.title+"</p>";
        }else{
            trackLink.innerHTML = loader.sound.title;
        }

        var image = loader.sound.artwork_url ? loader.sound.artwork_url : loader.sound.user.avatar_url; // if no track artwork exists, use the user's avatar.
        infoImage.setAttribute('src', image);

        infoArtist.innerHTML = '';
        infoArtist.appendChild(artistLink);

        infoTrack.innerHTML = '';
        infoTrack.appendChild(trackLink);

        var trackToken = loader.sound.permalink_url.substr(22);
        window.location = '#' + trackToken;
      
    };
    
};
 
var loadAndUpdate;

window.onload = function init() {
  //SoundCloud
  var scPlayer = document.getElementById('scPlayer');
  var source = document.getElementById('source');
  var playBtn = document.getElementById('play-button');
  var circle = document.getElementsByClassName('circle-wrapper')[0];
  var uiUpdater = new UiUpdater();
  var loader = new SoundcloudLoader(scPlayer,uiUpdater);
  var audioSource = new SoundcloudAudioSource(scPlayer, source);
  var visualizer = new Visualizer();
  var player;
  
  playBtn.className += '' + 'paused';
  
  loadAndUpdate =  function(trackUrl) { 
    loader.loadStream(trackUrl, 
      function() {
        uiUpdater.clearInfoPanel();
        audioSource.playStream(loader.streamUrl());
        uiUpdater.update(loader);
      }, 
      function() {
        console.log('error');
      } 
    );
  };

 
    
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var trackUrl = document.getElementById('input').value;
    playBtn.classList.remove('paused');  
  });

  loadAndUpdate();
  youTubePlayer();

  var clicked = false;
  playBtn.className ='pause';
  playBtn.addEventListener('click', function(e){
    clicked === true ? clicked = false : clicked = true;
    if (clicked){
      playBtn.className ='play';
      scPlayer.pause();
      console.log(player);
      //player.pause();
    }else {
      scPlayer.play();
      playBtn.className ='pause';
    }
    console.log(clicked);
  });

  visualizer.init({
    containerId: 'visualizer',
    audioSource: audioSource
  });

  circle.addEventListener('mouseover', function(e){
  });

  circle.addEventListener('mouseout', function(e){
  }); 

};

function youTubePlayer () {
  //Youtube
  //load script async 
  var tag = document.createElement('script');

  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];

  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  //This function creates an iframe after the API code downloads
  var playerOptions = {
    'modestbranding': 1, 
    'showinfo': 0,
    'autoplay': 1, 
    'controls': 0,
    'autohide':1,
    "origin": 'http://localhost:8000',
    'wmode':'opaque'  
  };

  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('player', {
      //todo change to 100%
      height: '100%',
      width: '100%',
      videoId: 'yLIJ6xlNSEU',
      playerVars: playerOptions,
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      } 
    });
  };

  //The API will call this function when the video player is ready.
  function onPlayerReady(event) {
    player.mute();
    player.playVideo();
    console.log(player);
  }

  //The API calls this function when the player's state changes.
  var done = false;

  function stopVideo() {
    player.stopVideo();
    console.log(player);
  }

  function onPlayerStateChange(event) {
  }
}
