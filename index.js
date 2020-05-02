require('dotenv').config()
const Discord = require('discord.js')
const bot = new Discord.Client()
const TOKEN = process.env.TOKEN
const fs = require('fs')
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const download = require('image-downloader')

bot.login(TOKEN)

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`)
})

bot.on('message', async msg => {
    if (msg.content === 'ping') {
        msg.channel.send('pong')
    } else if (msg.content === 'who do we fuckin hate?') {
        msg.channel.send('Rishabh!!')
    } else if (msg.content === '!join') {
        if (msg.member.voice.channel) {
            console.log('joining voice channel')
            const connection = await msg.member.voice.channel.join()
        } else {
            msg.reply('You need to join a voice channel first!')
        }
    } else if (msg.content === '!getout') {
        console.log('leaving voice channel')
        const connection = await msg.member.voice.channel.leave()
    } else if (msg.content.startsWith('!tts')) {
        tts(msg.channel, get_content(msg))
    } else if (msg.content.startsWith('!pss')) {
        get_pic(msg, get_content(msg))
    } else if (msg.content.startsWith('!ttt')) {
        send_message(
            msg.channel,
            'sorry, this function is not available at the moment.'
        )
        // talk_to_transformer(msg)
    } else if (msg.content.startsWith('!8')) {
        send_message(msg.channel, get_8_ball_answer())
    } else if (msg.content[0] == '!') {
        dlimg(msg)
    }
})

async function dlimg(msg) {
    var query = msg.content.substr(1)
    var query = query.split(' ')
    var bing_url = 'https://www.bing.com/images/search?q=' + query[0]
    for (var i = 1; i < query.length; i++) {
        bing_url += '+' + query[i]
    }
    var bing_html = ''

    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto(bing_url, {"waitUntil" : "networkidle2"})
    await page.waitFor(5000)

    let img_url = await page.evaluate(() => {
        var n = 0
        var img_src = document
            .getElementsByClassName('img_cont hoff')
            [n].getElementsByTagName('img')[0].src
        while (img_src.indexOf('data') == 0) {
            n++
            img_src = document
                .getElementsByClassName('img_cont hoff')
                [n].getElementsByTagName('img')[0].src
        }
        return img_src
    })

    console.log('found img:', img_url)

    const options = {
        url: img_url,
        dest: './temp.png',
    }
    await download
        .image(options)
        .then(({ filename, image }) => {
            console.log('Saved to', filename)
        })
        .catch(err => console.error(err))
    msg.channel.send('', { files: ['temp.png'] })
}

function send_message(channel, content) {
    channel.send(content)
}

function get_content(msg) {
    return msg.content.substr(msg.content.indexOf(' ') + 1)
}

async function talk_to_transformer(msg) {
    var txt = get_content(msg)

    puppeteer.use(StealthPlugin())
    // const browser = await puppeteer.launch({ headless: true, slowMo: 20, args: ['--no-sandbox'] })
    const browser = await puppeteer.launch({ headless: true, slowMo: 20 })
    const page = await browser.newPage()
    await page.goto('https://talktotransformer.com/')
    await page.waitFor(1000)

    for (var i = 0; i < txt.length; i++) {
        await page.keyboard.press(txt[i])
    }

    await page.click('button[type="button"]')

    await page.waitFor(10000)

    let ai_txt = await page.evaluate(() => {
        return document.querySelector('.pb-3').innerText
    })

    console.log('sending generated message', ai_txt)

    browser.close()

    ai_txt = ai_txt.substr(txt.length + 1)
    while (ai_txt.length > 0) {
        if (ai_txt.indexOf('.') == -1) {
            tts(msg.channel, ai_txt)
            ai_txt = ''
        } else {
            tts(msg.channel, ai_txt.substr(0, ai_txt.indexOf('.') + 1))
            ai_txt = ai_txt.substr(ai_txt.indexOf('.') + 1)
        }
    }
}

function tts(channel, message) {
    channel.send(message, { tts: true })
}

async function get_pic(msg, url) {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
    const page = await browser.newPage()
    await page.goto(url)
    await page.screenshot({ path: 'temp.png' })
    await browser.close()
    console.log('sending ss image')
    msg.channel.send("My Bot's message", { files: ['temp.png'] })
}

function get_8_ball_answer() {
    var responses_txt = fs.readFileSync('8ballresponses.txt', 'utf8')
    var responses = responses_txt.split('\n')
    while (responses.indexOf('') > -1) {
        responses.splice(responses.indexOf(''), 1)
    }
    var n = Math.floor(Math.random() * responses.length)
    return responses[n]
}
