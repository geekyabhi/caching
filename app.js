const fetch=require('node-fetch')
const redis=require('redis')
const express=require('express')
const dotenv=require('dotenv')
dotenv.config({path:'./config/dev.env'})

const PORT=process.env.PORT
const REDIS_PORT=process.env.REDIS_PORT

const client=redis.createClient(REDIS_PORT)
const app=express()

function setResponse(username,repos){
    return `<h2>${username} has ${repos} github repos</h2>`
}

async function getRepos(req,res,next){
    try{
        console.log('Fetching.....')
        const {username}=req.params
        const response=await fetch(`https://api.github.com/users/${username}`)

        const data=await response.json()
        const repos=data.public_repos

        client.setex(username,3600,repos)


        res.send(setResponse(username,repos))

    }catch(e){
        console.log('Error ocuured ',e)
    }
}

function cache(req,res,next){
    const {username}=req.params
    client.get(username,(err,data)=>{
        if(err)throw(err)
        if(data!==null){
            res.send(setResponse(username,data))
        }else{
            next()
        }
    })
}

app.get('/repos/:username',cache,getRepos)

app.listen(PORT,()=>{console.log('App listening on port ',PORT)})