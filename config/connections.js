const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=function(done){
    const url='mongodb+srv://Fasilzaman:Prg3NjzRlwR2WCRW@cluster0.bdpsf.mongodb.net/carzy?retryWrites=true&w=majority'
    const dbname='carzy'

    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })
    
}
  
module.exports.get=function(){
    return state.db
}