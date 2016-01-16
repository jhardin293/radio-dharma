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
    SC.initialize({
      client_id: client_id
    }); 
    SC.get('/resolve', { url: track_url }, function(sound){
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
      artistLink.setAtrribute('href', loader.sound.user.permalink_url);
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


window.onload = function init() {
  var player = document.getElementById('player');
  var uiUpdater = new UiUpdater();
  var loader = new SoundcloudLoader(player,uiUpdater);
  
  var loadAndUpdate =  function(trackUrl) { 
    //paste url here
    loader.loadStream(trackUrl, 
      function() {
        uiUpdater.clearInfoPanel();
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
    loadAndUpdate(trackUrl);
  });
  
};
