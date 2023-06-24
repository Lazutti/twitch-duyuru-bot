const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const TwitchClient = require('twitch').default;

var twitchClient = null;
let TwitchStreams = [];

client.on('ready', async () => {
    console.log(`${client.user.tag} olarak giriş yapıldı!`);
    await TwitchLogin();
    StreamKontrol();
    setInterval(StreamKontrol, config.saniye * 1000);
});

function getGuilds() {
    return client.guilds.cache;
}

function getFirstTextChannel(guild) {
    const textchannels = guild.channels.cache.filter(channel => channel.type == 'text' && channel.rawPosition == 1);
    return textchannels.values().next().value;
}

async function SendMessageToAllGuilds(message) {
    getGuilds().map(guild => {
        getFirstTextChannel(guild).send(message);
    });
}

client.on('message', message => {
    if (message.content.startsWith(config.command_prefix)) {
        var command = message.content.slice(config.command_prefix.length, message.content.length);
        var args = command.split(' ');
        command = args.shift();
        if (command === null || command)
            onCommand(message, command, args);
    }
});

async function onCommand(message, command, args) {
    await message.channel.send('Komut : ' + command);
    var argsatir = args.join('\n');
    await message.channel.send(argsatir);
}

async function TwitchLogin() {
    const clientId = config.twitch_clientid;
    const clientSecret = config.twitch_clientsecret;
    twitchClient = TwitchClient.withClientCredentials(clientId, clientSecret);
    await getTwitchUsers();
}

async function getTwitchUsers() {
    for (const username in config.users) {
        const user = await twitchClient.kraken.users.getUserByName(username);
        if (user === null) return;
        TwitchStreams[user._data._id] = {
            type: null,
            id: user._data._id
        };
    }
}

async function StreamKontrol() {
    TwitchStreams.forEach(async user => {
        const stream = await twitchClient.kraken.streams.getStreamByChannel(user.id);
        console.log(stream.type);
        if (stream.type == 'live' && user.type != 'live') {
            const title = stream.channel.status;
            const url = stream.channel.url;
            SendMessageToAllGuilds(title + '\n' + url)
        }
        TwitchStreams[user.id] = {
            type: stream.type,
        };
    });
}

client.login(config.discord_token);