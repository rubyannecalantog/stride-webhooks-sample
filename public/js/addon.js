$(document).ready(function() {
    let ws = new WebSocket("ws://localhost:3333");
    ws.onmessage = function(msg) {
        let log = JSON.parse(msg.data);

        appendLogs();
    };

    let appendLogs = function() {
        $('#logs').append('<div class="p-5">'+
                               '<div class="aui-message note">'+
                               '    <div class="icon"></div>'+
                               '    <p class="title">'+
                               '        <strong></strong>'+
                               '        I have recieved no log messages yet.'+
                               '    </p>'+
                               '</div>'+
                           '</div>');
    }

});
