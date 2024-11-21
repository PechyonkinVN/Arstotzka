let isPlayed = false;
function Music() {
    var audio = document.getElementById('audio');
    if (isPlayed){
        audio.pause();
        isPlayed = false;
    }
    else {
        audio.play();
        isPlayed = true;
    }
}