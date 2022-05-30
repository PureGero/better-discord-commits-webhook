const https = require('https');

const doPostRequest = (url, data) => {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        //create the request object with the callback with the result
        const req = https.request(url, options, (res) => {
            resolve(JSON.stringify(res.statusCode));
        });
    
        // handle the possible errors
        req.on('error', (e) => {
            reject(e.message);
        });
        
        //do the request
        req.write(JSON.stringify(data));
    
        //finish the request
        req.end();
    });
};

function sendMessageEmbed(webhook, body, fields) {
    const json = {
        username: 'Better Commits',
        avatar_url: 'https://imgur.com/YQfj9d8.png',
        embeds: [
            {
                title: `[${body.repository.name}:${body.ref.substr(body.ref.lastIndexOf('/') + 1)}] ${fields.length} new commit${fields.length == 1 ? '' : 's'}`,
                color: 7829503,
                url: body.compare,
                author: {
                    name: body.sender.login,
                    icon_url: body.sender.avatar_url
                },
                fields
            }
        ]
    };
    
    return doPostRequest(webhook, json);
}

exports.handler = async (event) => {
    try {
    if (event.body && event.queryStringParameters?.webhook) {
        const json = JSON.parse(event.body);
        let fields = [];
        let totalCharacters = 0;
        
        for (let i = 0; i < json.commits.length; i++) {
            const commit = json.commits[i];
            
            let name = commit.message;
            let value = ` - ${commit.author.name} [\`${commit.id.substr(0, 7)}\`](${commit.url})`
            if (name.length > 255) {
                name = name.substr(0, 252) + '...';
            }
            
            if ((totalCharacters += name.length + value.length) > 5000) {
                await sendMessageEmbed(event.queryStringParameters.webhook, json, fields);
                fields = [];
                totalCharacters = 0;
            }
            
            fields.push({name, value});
        }
        
        await sendMessageEmbed(event.queryStringParameters.webhook, json, fields);
        
        return {
            statusCode: 200,
            body: JSON.stringify("Success"),
        };
    }
    } catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: e.message, stack: e.stack }, null, 2),
        };
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify(event, null, 2),
    };
};
