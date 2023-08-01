var admin = require("firebase-admin");

const { createUser,
    isNameUnique,
    isNameExist,
    checkLogin,
    insertOrUpdateUserToken,
    insertNewMessage,
    getAllMessagesByUsername,
    getUsers,
    getUserToken,
} = require('./firebase-realtime-db');

var { getMessaging, getToken } = require("firebase/messaging");
const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
});

app.use(express.static('public'));
var serviceAccount = require(__dirname + "/mywebapp-3ad6b-firebase-adminsdk-ahb8h-db57b33ca6.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://mywebapp-3ad6b-default-rtdb.firebaseio.com"



});

// const registrationToken = "duupJMlVxVvd9jbYPBcTLY:APA91bGy9JNFJefKv6widPdiA0cQMjJOarDGSwD6Eylq57Rv1DJe6C7NVw-uWC0QW9_8tQnw4wfkpzRfQ7yxevEFwJ1V0n2K25A85s5o-jtSPWsOGnxuYHdVZ43W5qQiHFfr0T32FIJf";

app.post('/send', async (req, res) => {

    console.log(req.body);


    try {
        const newMessagesRef = await insertNewMessage(req.body);

        const response = {
            success: true,
            message: 'Insert new message successfully',
            messageId: newMessagesRef.key
        };

        var userTokenMap = {};

        await getUserToken()
            .then((userTokenMapDB) => {
                userTokenMap = userTokenMapDB;
            });

        console.log(userTokenMap)

        var registrationToken;

        for (const username in userTokenMap) {
            // const registrationToken = userTokenMap[username];
            if (req.body.to == username) {
                registrationToken = userTokenMap[username]
                console.log(registrationToken, username);
            }
        }

        const message = {
            notification: {
                title: req.body.from,
                body:  JSON.stringify({
                    from: req.body.from,
                    to: req.body.to,
                    timestamp: req.body.timestamp, // Sử dụng req.body.timestamp thay vì req.body.to
                    message: req.body.message,
                })
            },
            token: registrationToken,
        };

        admin.messaging().send(message)
            .then((response) => {
                console.log("Successfully sent message:", response);
                return res.status(200).json({
                    status: 'success',
                })
            })
            .catch((error) => {
                console.log("Error sending message:", error);
                return res.status(500).json({
                    status: 'fail',
                })
            });
    } catch (error) {
        const response = {
            success: false,
            message: 'Error insert new message',
            error: error.message
        };
        return res.status(500).json(response);
    }
    /** 
     * API gửi tin nhắn từ một người đến một người
     * body gồm "from", "to", "message"
     * 
     * lưu một bản ghi vào table message
     * {
     *      "from": "mon",
     *      "to": "mo",
     *      "message": "hello mo",
     *      "timestamp": "01/01/1970 00:00:00"
     * } -> done
     * 
     * lấy tất cả bản ghi của bẳng userToken để biết cần gửi tin nhắn cho thiết bị nào
     * 
     * từ "to" lấy ra "registrationToken"
     * 
     * nếu có registrationToken -> dùng fcm gửi tin nhắn
     * 
     * -------------------------------- 
     */
});

app.get('/history/:username', async (req, res) => {
    console.log(req.params.username);

    result = await getAllMessagesByUsername(req.params.username)

    const transformedData = result.reduce((result, message) => {
        const otherUser = message.from === req.params.username ? message.to : message.from;
        if (!result[otherUser]) {
            result[otherUser] = [];
        }
        result[otherUser].push(message);
        return result;
    }, {});


    res.json(transformedData)
});

app.get('/friends', async (req, res) => {

    result = await getUsers();
    res.json(result)
});

app.post('/signup', async (req, res) => {
    console.log(req.body);

    try {
        const isUnique = await isNameUnique(req.body.name);
        if (!isUnique) {
            return res.status(400).json({
                status: false,
                message: `The name "${req.body.name}" is exist`,
                error: `fail - The name "${req.body.name}" is exist`,
            });
        }

        const newUserRef = await createUser(req.body.name, req.body.avatar, req.body.email, req.body.password);

        const response = {
            success: true,
            message: 'User created successfully',
            userId: newUserRef.key
        };
        return res.status(200).json(response);
    } catch (error) {
        const response = {
            success: false,
            message: 'Error creating user',
            error: error.message
        };
        return res.status(500).json(response);
    }
});


app.post('/login', (req, res) => {
    const { name, password, registrationToken } = req.body;

    isNameExist(name)
        .then((nameExist) => {
            if (!nameExist) {
                res.json({
                    success: false,
                    message: `User "${name}" not found`,
                });
            } else {
                checkLogin(name, password)
                    .then((isLoginValid) => {
                        if (isLoginValid) {
                            //sau khi login thành công update registrationToken để fcm biết thiết bị nào link với user nào để gửi tin nhắn
                            try {
                                insertOrUpdateUserToken(name, registrationToken);
                                console.log("Update registration token successfully")
                            } catch (e) {
                                res.json({
                                    success: false,
                                    message: 'insertOrUpdateUserToken failed: ' + e.message,
                                });
                            }

                            res.json({
                                success: true,
                                message: 'Login successful',
                            });
                        } else {
                            res.json({
                                success: false,
                                message: 'Wrong password',
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error checking login:', error);
                        res.status(500).json({
                            success: false,
                            message: 'Error checking login',
                        });
                    });
            }
        })
        .catch((error) => {
            console.error('Error checking name existence:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking name existence',
            });
        });
});


app.listen(3000, () => console.log("Listenning on port 3000"));
