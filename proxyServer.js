'use strict';

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
require('dotenv').config({ path : '../lol-info-web/.env' });

// Port Number
const PORT = 4000;

let corsOptions = {
    origin : "*",
};

app.use(cors(corsOptions));

// API key
const API_KEY = process.env.TEST_KEY;

// 아이템 정보를 가져오는 함수
const getItemInfomation = () => {
    return axios.get(`https://ddragon.leagueoflegends.com/cdn/10.24.1/data/ko_KR/item.json`)
        .then(response => {
            return response.data;
        })
        .catch(error => console.log(error))
}

// 소환사 정보를 가져오는 함수
const getPlayerInformation = (playerName) => {
    return axios.get(`https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/${playerName}?api_key=${API_KEY}`)
        .then(response => {
            return response.data;
        })
        .catch(error => console.log(error));
}

// 소환사의 puuid값을 가져오는 함수
const getPlayerPUUID = (playerName) => {
    return axios.get(`https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/${playerName}?api_key=${API_KEY}`)
        .then(response => {
            return response.data.puuid;
        })
        .catch(error => console.log(error));
}

// 소환사의 id값을 가져오는 함수 (id는 encryptedSummonerId값)
const getPlayerID = (playerName) => {
    return axios.get(`https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/${playerName}?api_key=${API_KEY}`)
        .then(response => {
            return response.data.id;
        })
        .catch(error => console.log(error));
}

// 로테이션챔피언정보를 가져오는 함수
const getRotationChampion = () => {
    return axios.get(`https://kr.api.riotgames.com/lol/platform/v3/champion-rotations?api_key=${API_KEY}`)
        .then(response => {
            return response.data;
        })
        .catch(error => console.log(error));
}

// GET item (아이템 정보 가져오기)
// localhost:4000/item
app.get('/item', async (req, res) => {
    const infomation = await getItemInfomation();
    res.json(infomation);
})

// GET playerInformation (소환사 정보 가져오기)
// localhost:4000/playerInformation
app.get('/playerInformation', async (req, res) => {
    const playerName = req.query.searchText;

    // information (소환사 정보 얻어오기)
    const information = await getPlayerInformation(playerName);
    res.json(information); 
})

// GET acivegames (현재 게임 정보 가져오기)
app.get('/activegames', async (req, res) => {
    const playerName = req.query.searchText;

    // id
    const id = await getPlayerID(playerName);
    const API_CALL = `https://kr.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${id}?api_key=${API_KEY}`;
    const activegames = await axios.get(API_CALL)
        .then(response => response.data)
        .catch(error => console.log(error));
    res.json(activegames);
})

// GET proficiency (소환사의 챔피언 숙련도 정보 가져오기)
// localhost:4000/proficiency
app.get('/proficiency', async (req, res) => {
    const playerName = req.query.searchText;
    // id
    const id = await getPlayerID(playerName);
    const API_CALL = `https://kr.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${id}?api_key=${API_KEY}`;
    const proficiency = await axios.get(API_CALL)
        .then(response => response.data)
        .catch(error => console.log(error));
    res.json(proficiency);
})

// GET past10Games (과거 10게임 가져오기)
// localhost:4000/past10Games
app.get('/past10Games', async (req, res) => {
    const playerName = req.query.searchText; // params를 query로 받아옴(검색기능)

    // PUUID (puuid 값 얻어오기)
    const PUUID = await getPlayerPUUID(playerName);
    const API_CALL = `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${PUUID}/ids?start=0&count=20&api_key=${API_KEY}`

    // its going to give us a list of game IDs
    const gameIDs = await axios.get(API_CALL)
        .then(response => response.data)
        .catch(error => console.log(error));

    // loop through game IDs
    // at each loop, get the infomation based off ID
    const matchDataArray = [];
    for (let i = 0; i < gameIDs?.length - 10; i++) {
        const matchID = gameIDs[i];
        const matchData = await axios.get(`https://asia.api.riotgames.com/lol/match/v5/matches/${matchID}?api_key=${API_KEY}`)
            .then(response => response.data)
            .catch(error => console.log(error));
        matchDataArray.push(matchData);
    }

    // save infomation above in an array, give array as JSON response to user
    // [Game1Object, Game2Object, Game3Object, ...]
    res.json(matchDataArray); 
})

// GET tier (티어정보 가져오기)
// localhost:4000/tier
app.get('/tier', async (req, res) => {
    const playerName = req.query.searchText;
    const ID = await getPlayerID(playerName);
    const API_CALL = `https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/${ID}?api_key=${API_KEY}`;

    const leagueDataArray = [];
    
    const leagueData = await axios.get(API_CALL)
        .then(response => response.data)
        .catch(error => console.log(error))
    leagueDataArray.push(leagueData);

    res.json(leagueDataArray)
})

// GET activePlayersTier (인게임 플레이어들의 티어정보 가져오기)
// localhost:4000/activePlayersTier
app.get('/activePlayersTier', async (req, res) => {
    const playerIds = req.query.playingSummonerId;
    let leagueArray = [];

    for (let i of playerIds) {
        const res = await axios.get(`https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/${i}?api_key=${API_KEY}`)
        leagueArray.push(res.data[0]);
        console.log(leagueArray,"leagueArray0")
    }

    console.log(leagueArray, "leagueArray 밖")
    return res.json(leagueArray)
})

// GET rotation (로테이션 챔피언정보 가져오기)
// localhost:4000/rotation
app.get('/rotation', async (req, res) => {
    const rotation = await getRotationChampion();
    res.json(rotation);
})

app.listen(PORT, () => {
    console.log("Server started on port 4000 - 4000포트에서 서버 구동중");
});


