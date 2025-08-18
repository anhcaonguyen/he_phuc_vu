import dotenv from 'dotenv';
dotenv.config();

import { MongoClient as mongoClient } from "mongodb";

class mongoDB{
    collectionNames={
        "LIST_TIVI":"tivi",
        "LIST_MOBILE":"mobile",
        "LIST_STUDENT":"student",
        "LIST_FOOD":"food",
        "LIST_STORE":"store",
        "LIST_USER":"user"
    }

    
    async getAll(collectionName, filter = {}){
        try {
            let client= await mongoClient.connect(process.env.URL_MONGODB);
            let result= await client.db(process.env.DBNAME).collection(collectionName).find(filter).toArray();
            client.close();
            return result;    
        } catch (error) {
            throw error           
        }
    }
    async getOne(collectionName,filter={}){
        try {
            let client= await mongoClient.connect(process.env.URL_MONGODB);
            let result= await client.db(process.env.DBNAME).collection(collectionName).findOne(filter);
            client.close();
            return result; 
        } catch (error) {
            throw error
        }
    }
    async insertOne(collectionName,newDocument){
        try {
            let client= await mongoClient.connect(process.env.URL_MONGODB);
            let result= await client.db(process.env.DBNAME).collection(collectionName).insertOne(newDocument)
            return result;
        } catch (error) {
            throw error
        }
    }
    async updateOne(collectionName,filter,updateFilter){
        try {
            let client= await mongoClient.connect(process.env.URL_MONGODB);
            let result= await client.db(process.env.DBNAME).collection(collectionName).updateOne(filter,updateFilter);
            return result;
        } catch (error) {
            throw error
        }
    }
    async deleteOne(collectionName,filter){
        try {
            let client= await mongoClient.connect(process.env.URL_MONGODB);
            let result= await client.db(process.env.DBNAME).collection(collectionName).deleteOne(filter);
            return result;
        } catch (error) {
            throw error
        }
    }
     
}

let db=new mongoDB()
export default db;