const functions = require('firebase-functions');
const admin = require("firebase-admin");
const cors = require('cors')({ origin: true });

admin.initializeApp();

exports.createGame = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        if (request.method !== "POST") {
            response.status(400).send('Please send a POST request');
            return;
        }

        var defaultSession = CreateDefaultSession(request.body.gameTimer);

        var sessionKey = Math.random().toString(36).substr(2, 5);

        admin.database().ref("/sessions")
            .child(sessionKey)
            .set(defaultSession, function (error) { if (error) response.status(500).send("There was an error creating the session!"); });

        var userKey = CreateUser(sessionKey, request.body.displayName, request.body.gameTimer);

        let responseData = {
            sessionKey: sessionKey,
            userKey: userKey
        }

        response.status(200).send(responseData);

        return;
    })
});

exports.joinGame = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        if (request.method !== "POST") {
            response.status(400).send('Please send a POST request');
            return;
        }

        admin.database().ref("sessions/" + request.body.gameId + "/gameTimer")
            .once('value')
            .then(function (snap) {
                var gameTimer = snap.val();

                var userKey = CreateUser(request.body.gameId, request.body.joineeName, gameTimer);

                let responseData = {
                    sessionKey: request.body.gameId,
                    userKey: userKey
                }

                response.status(200).send(responseData);

                return;
            });
    })
})

exports.startGame = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        if (request.method !== "POST") {
            response.status(400).send('Please send a POST request');
            return;
        }

        admin.database().ref("/locations").once('value')
            .then(function (locationsSnap) {
                var locations = locationsSnap.val();

                var location = locations[getRandomInt(locations.length)]; 

                admin.database().ref("/sessions/" + request.body.gameId + "/users_with_roles").once('value')
                    .then(function (snap) {
                        var users = snap.val();
                        var spyIndex = getRandomInt(Object.keys(users).length);

                        for (var key in users) {
                            if (spyIndex === 0) {
                                users[key].role = "Imposter"
                                spyIndex--;
                                continue;
                            } else {
                                spyIndex--;
                            }

                            users[key].location = location[0];
                            users[key].role = location[getRandomInt(location.length - 1) + 1]
                        }

                        admin.database().ref("/sessions/" + request.body.gameId + "/users_with_roles").set(users);

                        response.status(200).send({ message: "ok" });
                    })
            })
    })
})

function CreateDefaultSession(gameTimer) {
    return {
        users: [],
        usersWithRoles: {},
        gameTimer: gameTimer,
        gameExpirationTime: (new Date()).setTime((new Date()).getTime() + gameTimer * 60 * 1000)
    }
}

function CreateUser(sessionKey, displayName, gameTimer) {
    var childKey = Math.random().toString(36).substring(7);

    var userObject = {
        role: "",
        location: "",
        gameTimer: gameTimer,
        displayName: displayName
    };

    admin.database().ref("/sessions/" + sessionKey + "/users")
        .push(displayName);

    admin.database().ref("/sessions/" + sessionKey + "/users_with_roles")
        .child(childKey)
        .set(userObject)

    return childKey;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
