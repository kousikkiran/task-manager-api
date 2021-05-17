const express = require('express');
const User = require('../models/user')
const auth = require('../middleware/auth')
const upload = require('../middleware/upload')
const sharp = require('sharp')

const router = new express.Router()

router.post('/users',async (req,res)=>{
    const user = new User(req.body)
    try{
        await user.save()
        const token = await user.generateToken()
        res.status(201).send({user,token})
    }catch(e){
        res.status(400).send(e)
    }
})

router.post('/users/login',async (req,res)=>{
    try{
        const user = await User.findByCredentials(req.body.email,req.body.password)
        const token = await user.generateToken()
        res.send({user,token})
    }catch(e){
        res.status(400).send(e)
    }

})


router.post('/users/logout',auth,async(req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.post('/users/logoutall',auth,async(req,res)=>{
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.get('/users/me',auth ,async(req,res)=>{

    res.send(req.user)
})


router.patch('/users/me',auth,async (req,res)=>{
    const updates = Object.keys(req.body)
    const updatesAllowed = ['name','age','email','password']
    const isValidUpdate = updates.every((update)=> updatesAllowed.includes(update))
  
    if(!isValidUpdate){
        return res.status(400).send('Invalid Updates!')
    }

    try{


        updates.forEach((update)=> req.user[update] = req.body[update])

        await req.user.save();
        
        res.send(req.user)
    }catch(e){
        res.status(400).send(e)
    }
})


router.delete('/users/me',auth,async(req,res)=>{
    try{
       await req.user.remove()
        res.send(req.user)
        }catch(e){
            res.status(400).send(e)
    }
})


   

router.post('/users/me/avatar',auth,upload.single('avatar'),async (req,res)=>{
    const buffer = await sharp(req.file.buffer).resize({width: 250,height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
    },(error,req,res,next)=>{
        res.status(400).send({error: error.message})
    })


router.delete('/users/me/avatar',auth,async (req,res)=>{
        req.user.avatar = undefined
        await req.user.save()
        res.send()
    })

router.get('/users/me/avatar',auth,async(req,res)=>{
    if(!req.user.avatar){
        return res.status(404).send()
    }
    res.set('Content-type','image/jpg')
    res.send(req.user.avatar)
})



module.exports = router