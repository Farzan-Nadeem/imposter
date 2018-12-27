var IsGameCreator = false;
var IsGameStarted = false;
var TimerId = 0;
var SessionKey = "", UserKey = "";
var Users = [];

var GameEntered = false;

var UserRef, GameStatusRef, UserWithRoleRef;

const httpOptions = {
    headers: {
        'Content-Type': 'application/json'
    }
};

$(document).ready(function () {
    $('.modal').modal();

    $('.carousel.carousel-slider').carousel({
        fullWidth: true,
        indicators: true,
        noWrap: true,
        preventLoop: true
    });

    firebase.database().ref("locations_list").once('value')
        .then(function (snap) {
            var $locationOne = $('#locationsOne');
            var $locationTwo = $('#locationsTwo');

            var toggle = false;

            $.each(snap.val(), function (key, value) {
                if (!toggle) {
                    $locationOne.append(
                        $('<button/>', { "class": "btn btn-space teal lighten-2" })
                            .click(StrikeThrough)
                            .css("text-decoration", "")
                            .text(value)
                    )
                } else {
                    $locationTwo.append(
                        $('<button/>', { "class": "btn btn-space teal lighten-2" })
                            .click(StrikeThrough)
                            .css("text-decoration", "")
                            .text(value)
                    )
                }

                if (toggle) {
                    $locationOne.append(
                        $('<br />')
                    )
                    $locationOne.append(
                        $('<br />')
                    )

                    $locationTwo.append(
                        $('<br />')
                    )
                    $locationTwo.append(
                        $('<br />')
                    )

                    toggle = false;
                } else {
                    toggle = true;
                }
            })
        })
});

function createGame() {
    $('#submitCreateForm').on('submit', function (e) {
        e.preventDefault();
        if (GameEntered) {
            return;
        }

        var displayName = $("#displayName").val(); 
        var gameTimer = $("#gameTimer").val();

        if(!displayName || !gameTimer) { 
            alert("Please enter all necessary credentials");
            return;
        }
        
        let data = {
            "displayName": displayName,
            "gameTimer": gameTimer
        };

        GameEntered = true;

        $.ajax({
            type: "POST",
            url: "https://us-central1-imposter-49c44.cloudfunctions.net/createGame",
            data: data,
            httpOptions: httpOptions,
            success: function (data) {
                GoToGameLobby(data.sessionKey, data.userKey, true);
            },
            error: function () {
                alert("There was an error creating your game! Please try again!");
            }
        });
    });
}

function joinGame() {
    $('#joinForm').on('submit', function (e) {
        e.preventDefault();
        if (GameEntered) {
            return;
        }

        var gameId = $("#gameId").val(); 
        var joineeName = $("#joineeName").val();

        if(!gameId || !joineeName) { 
            alert("Please enter all necessary credentials");
            return;
        }
        
        let data = {
            "gameId": gameId,
            "joineeName": joineeName
        };
 
        GameEntered = true;
 
        $.ajax({
            type: "POST",
            url: "https://us-central1-imposter-49c44.cloudfunctions.net/joinGame",
            data: data,
            httpOptions: httpOptions,
            success: function (data) {
                GoToGameLobby(data.sessionKey, data.userKey);
            },
            error: function () {
                alert("There was an error while joining the game! Please ensure that game id is correct!");
            }
        });
    });
}

function GoToGameLobby(sessionKey, userKey, gameCreator = false) {
    SessionKey = sessionKey;
    UserKey = userKey;
    IsGameCreator = gameCreator;

    UserRef = firebase.database().ref("/sessions/" + SessionKey + '/users');
    UserRef.on('value', function (snap) {
        UpdateUserTable(snap.val());
    });

    // Will continuously update the game page (have to do it here so its common with hosts and joinee)
    UserWithRoleRef = firebase.database().ref("/sessions/" + SessionKey + "/users_with_roles/" + UserKey);
    UserWithRoleRef.on('value', function (snap) {
        PrepGamePage(snap.val());
    })

    if (!IsGameCreator) {
        $('#hostGameOptions').remove();
    }

    $('#sessionID').text("Game ID: " + SessionKey);


    NextWindow("#gameLobby");
}

function UpdateUserTable(users) {
    var $usersList = $('#memberTable');
    $usersList.empty("");

    var finalStr = "";
    Users = [];

    $.each(users, function (key, value) {
        finalStr += value + " <br>";
        Users.push(value);
    })

    finalStr = $.parseHTML(finalStr);

    $usersList.append(finalStr);
}

function StartGame() {
    let data = {
        "gameId": SessionKey
    };

    // This will ask the server to create roles for everyone and then 
    $.ajax({
        type: "POST",
        url: "https://us-central1-imposter-49c44.cloudfunctions.net/startGame",
        data: data,
        httpOptions: httpOptions,
        success: function (data) {
            // PrepGamePage will be triggered due to the role change and will move to the GamePage 
        },
        error: function () {
            alert("There was an error while starting the game! Please try again!");
        }
    });
}

function PrepGamePage(roleInformation) {
    if (!roleInformation) {
        return;
    }

    if (roleInformation.role !== null && roleInformation.role !== "") {
        NextWindow("#gamePage");

        // Then starts the game timer in 2 seconds
        setTimeout(startTimer(roleInformation.gameTimer * 60, document.querySelector('#timer')), 2000);
    }

    var $imposter = $('#imposter');
    $imposter.text("");

    var $roleInfo = $('#roleInfo');
    $roleInfo.text("");

    if (roleInformation.role === "Imposter") {
        $imposter.append($.parseHTML("You are the <i>Imposter</i>"));
    } else {
        $imposter.append($.parseHTML("You are <b>not</b> the <i>Imposter</i>"));

        var locationInfo = "Location: " + roleInformation.location + "<br>Role: " + roleInformation.role;
        $roleInfo.append($.parseHTML(locationInfo));
    }

    // Creating the users buttons
    var $membersOne = $('#membersOne');
    $membersOne.text("");

    var $membersTwo = $('#membersTwo');
    $membersTwo.text("");

    var toggle = false;
    $.each(Users, function (key, value) {
        if (!toggle) {
            $membersOne.append(
                $('<button/>', { "class": "btn btn-space teal lighten-2" })
                    .css("text-decoration", "")
                    .click(StrikeThrough)
                    .text(value)
            )
        } else {
            $membersTwo.append(
                $('<button/>', { "class": "btn btn-space teal lighten-2" })
                    .css("text-decoration", "")
                    .click(StrikeThrough)
                    .text(value)
            )
        }

        if (toggle) {
            $membersOne.append(
                $('<br />')
            )
            $membersOne.append(
                $('<br />')
            )

            $membersTwo.append(
                $('<br />')
            )
            $membersTwo.append(
                $('<br />')
            )

            toggle = false;
        } else {
            toggle = true;
        }
    })
}

// Start countdown
function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    TimerId = setInterval(function () {
        minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            display.textContent = "Game Over!";
            stopTimer();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(TimerId);
}

function StrikeThrough(e) {
    if (e.target.classList.value.includes("strikethrough")) {
        e.target.classList.remove("strikethrough");
    }
    else {
        e.target.classList.add("strikethrough");
    }
}

function NextWindow(target) {
    $(target + 'Tab').click();
}
