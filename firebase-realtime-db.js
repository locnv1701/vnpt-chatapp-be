// Import the functions you need from the SDKs you need
const { initializeApp } = require('firebase/app');
const { getDatabase, child, ref, set, get, push, query, orderByChild, update, equalTo, onValue, remove } = require("firebase/database");


const firebaseConfig = {
    apiKey: "AIzaSyCd60UFFYe84cewoEiJNdKpsSL4PCkJntc",
    authDomain: "mywebapp-3ad6b.firebaseapp.com",
    databaseURL: "https://mywebapp-3ad6b-default-rtdb.firebaseio.com",
    projectId: "mywebapp-3ad6b",
    storageBucket: "mywebapp-3ad6b.appspot.com",
    messagingSenderId: "1075307155396",
    appId: "1:1075307155396:web:560df4a639f3206c7cde91",
    measurementId: "G-VBXQXLLG3H"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

function createUser(name, avatar, email, password) {
    // Lấy reference đến node "users" trong Firebase Realtime Database
    const usersRef = ref(getDatabase(), 'users');

    const newUser = {
        name: name,
        avatar: avatar,
        email: email,
        password: password,
    };

    return push(usersRef, newUser)
}

// Hàm kiểm tra tính duy nhất của trường "name"
function isNameUnique(name) {
    // Lấy reference đến node "users" trong Firebase Realtime Database
    console.log("name", name);
    const usersRef = ref(getDatabase(), 'users');

    // Sử dụng hàm once() để lấy dữ liệu của node "users"
    return get(usersRef).then((snapshot) => {
        if (snapshot.exists()) {
            // Lấy tất cả các giá trị của trường "name" trong node "users"
            const users = snapshot.val();
            const names = Object.values(users).map((user) => user.name);

            // Kiểm tra xem giá trị "name" mới có tồn tại trong danh sách names hay không
            if (names.includes(name)) {
                // Trường "name" không duy nhất
                return false;
            } else {
                // Trường "name" duy nhất
                return true;
            }
        } else {
            // Không có dữ liệu trong node "users"
            return true;
        }
    }).catch((error) => {
        console.error('Error checking name uniqueness:', error);
        // Xử lý lỗi tại đây
        return false;
    });
}

// Hàm kiểm tra tên đăng nhập có tồn tại hay không
async function isNameExist(name) {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
        const users = snapshot.val();
        const names = Object.values(users).map((user) => user.name);
        return names.includes(name);
    }

    return false;
}

// Hàm kiểm tra tên đăng nhập và mật khẩu
async function checkLogin(name, password) {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
        const users = snapshot.val();
        const user = Object.values(users).find((user) => user.name === name);
        return user && user.password === password;
    }

    return false;
}


// Hàm insert hoặc update bản ghi
async function insertOrUpdateUserToken(username, registrationToken) {

    console.log('Inserting user token  ' + username + "====" + registrationToken)

    console.log('insertOrUpdateUserToken: ', username, registrationToken);

    /*
       lấy tất cả bản ghi trong userToken
       TH1 name == name && token == token => giữ nguyên
       TH2 name == name && token != token
       TH3 name != name && token == token =>
   */

    const userTokenRef = ref(db, 'userToken');

    // Lấy dữ liệu từ Firebase Realtime Database
    const snapshot = await get(userTokenRef);
    // Duyệt qua từng bản ghi và thêm vào map
    snapshot.forEach((childSnapshot) => {
        const name = childSnapshot.key;
        const token = childSnapshot.val().registrationToken;

        if (token === registrationToken && name === username) {
            return
        }

        if (token === registrationToken && name != username) {
            // delete 
            remove(childSnapshot.ref)
                .then(() => {
                    console.log("Bản ghi đã được xóa thành công.");
                })
                .catch((error) => {
                    console.error("Lỗi xóa bản ghi:", error);
                });
        }

        if (token != registrationToken && name === username) {
            console.log("registrationToken thay đổi -> update");
            set(ref(db, 'userToken/' + username), {
                registrationToken: registrationToken,
            });
            return
        }
    });

    console.log("insert new userToken");
    set(ref(db, 'userToken/' + username), {
        registrationToken: registrationToken,
    });

    console.log('Registration token updated successfully!');
}

function insertNewMessage(message) {
    // Lấy reference đến node "messages" trong Firebase Realtime Database
    const messagesRef = ref(getDatabase(), 'messages');

    const newMessage = {
        from: message.from,
        to: message.to,
        message: message.message,
        timestamp: message.timestamp,
    };

    console.log("inserted message")

    return push(messagesRef, newMessage)
}


async function getAllMessagesByUsername(username) {
    const messagesRef = ref(db, 'messages');

    // Tạo hai truy vấn riêng biệt cho "from" và "to"
    const queryFrom = query(messagesRef, orderByChild("from"), equalTo(username));
    const queryTo = query(messagesRef, orderByChild("to"), equalTo(username));

    const results = [];

    try {
        // Thực hiện truy vấn "from" và lấy kết quả
        const snapshotFrom = await get(queryFrom);
        snapshotFrom.forEach((childSnapshot) => {
            const messageData = childSnapshot.val();
            // console.log("from", messageData)
            results.push(messageData);
        });

        // Thực hiện truy vấn "to" và lấy kết quả
        const snapshotTo = await get(queryTo);
        snapshotTo.forEach((childSnapshot) => {
            const messageData = childSnapshot.val();
            // console.log("to", messageData)

            results.push(messageData);
        });

        // Ở đây, "results" chứa tất cả các bản ghi có "from" hoặc "to" là "username"
        return results;
    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    }
}
async function getUserToken() {
    const userTokenRef = ref(db, 'userToken');

    // Tạo một map chứa thông tin về username và registrationToken
    const userTokenMap = {};

    // Lấy dữ liệu từ Firebase Realtime Database
    const snapshot = await get(userTokenRef);
    // Duyệt qua từng bản ghi và thêm vào map
    snapshot.forEach((childSnapshot) => {
        const username = childSnapshot.key;
        const registrationToken = childSnapshot.child('registrationToken').val();
        userTokenMap[username] = registrationToken;
    });

    console.log("userTokenMap", userTokenMap);

    return userTokenMap;
}

async function getUsers() {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    const results = [];

    snapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val();
        results.push(user);
    });

    return results;
}

module.exports = {
    createUser,
    isNameUnique,
    isNameExist,
    checkLogin,
    insertOrUpdateUserToken,
    insertNewMessage,
    getAllMessagesByUsername,
    getUsers,
    getUserToken,
};