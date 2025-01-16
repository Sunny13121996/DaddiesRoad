const path            = require('path');
const each            = require('sync-each');
const admin           = require('firebase-admin');
const serviceAccount  = require('./last-mile-drivers.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount)
});

const getDeviceTokens = (userId) => {
	return new Promise((resolve, reject) => {
		connection.query(`SELECT device_type, device_token FROM drivers WHERE uuid='${userId}' AND device_token != ""`, (error, success) => {
			(!error)? resolve({ status: "success", data: success }): reject({ status: "error", data: error })
		});
	})
};

const setVisibility   = (users_id) => {
	return new Promise((resolve, reject) => {
		connection.query(`UPDATE notifications SET is_read = 1 WHERE to_user IN ('${users_id}')`, (error, success)=>{
			(!error)? resolve({ status: "success", data: success }): reject({ status: "error", data: error })
		});
	});
};

const sendNotification = (token, data, deviceType, toUser) => {
	const payload      = {
        token: token,
        notification: {
            title: data.title,
            body: data.body,
            image: data.image,
        },
        data: {
            type: String(data.type),
            title: String(data.title),
            message: String(data.body),
            sender_picture: String(data.image)
        },
    };
	if (deviceType === 'A') {
        payload.android = {
            notification: {
                icon: data.icon,
                color: data.color,
                tag: data.tag,
                priority: data.priority,
                sound: data.sound,
            },
        };
    } else if (deviceType === 'I') {
        payload.apns = {
            payload: {
                aps: {
                    sound: data.sound,
                    badge: 1,
                },
            },
        };
    }
    admin
        .messaging()
        .send(payload)
        .then((response) => {
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.error('Error sending message:', error);
            if (error.code === 'messaging/registration-token-not-registered') {
                removeInvalidToken(token, deviceType, toUser); // Define this function to handle the removal
            }
        });
};

const removeInvalidToken = (token, deviceType, toUser) => {
	let fields           = (deviceType == "I") ? `device_token = ''` : `device_token = ''`;
	connection.query(`UPDATE drivers SET ${fields} WHERE uuid IN (${toUser})`, (err, success)=>{
		console.error(`${err}`);
        console.log(`Token ${token} removed from database`);
	});
};

const sendNotication = (data) => {
	const createdAt  = new Date();
	const to_users   = data.to_user;
	each(to_users, async function(user, nextUserRecord) {
		const query = connection.query(`INSERT INTO notifications (from_user, to_user, title, type, message, to_id, is_read, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [data.from_user, user, data.title, data.type, data.message, data.to_id, 0, createdAt], async (err, results) => {
			const getDeviceData            = await getDeviceTokens(user);
			if (getDeviceData.status == "success") {
				if (getDeviceData.data.length > 0) {
					const item             = getDeviceData.data[0];
					const DEVICE_TYPE  = item.device_type;;
					const DEVICE_TOKEN = item.device_token;
					const ICON         = `${global.IP}/img/athlete_logo.png`;
					const PAYLOAD      = {
						title    : data.title,
						body     : data.message,
						icon     : ICON, // Replace with your app's icon resource
						// image    : data.sender_picture, // URL of an image to display
						color    : '#FF0000', // Notification color for Android
						type     : data.type,
						sound    : 'default', // Play default sound
						priority : 'high', // High priority for Android notifications,
						tag      : 'new_message', // Tag for Android notifications
					};
					console.log(`DEVICE_TYPE===>`, DEVICE_TYPE);
					console.log(`DEVICE_TOKEN===>`, DEVICE_TOKEN);
					if (DEVICE_TYPE == 'A') {
						if (DEVICE_TOKEN && DEVICE_TOKEN != "") {
							// await setVisibility(user);
							sendNotification(DEVICE_TOKEN, PAYLOAD, DEVICE_TYPE, user);
						}
					} else {
						if (DEVICE_TOKEN && DEVICE_TOKEN != "") {
							// await setVisibility(user);
							sendNotification(DEVICE_TOKEN, PAYLOAD, DEVICE_TYPE, user);
						}
					}
					nextUserRecord();
				}
			} else {
				nextUserRecord();
			}
		})
	}, function() {
		console.log(`Push Notifications send successfully!`)
	})
};

module.exports = {
	sendNotication: sendNotication
};
