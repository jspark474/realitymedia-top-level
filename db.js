const {
    Sequelize,
} = require('sequelize');

const {
    DB_USER,
    DB_PASSWORD,
    DB_HOST
} = process.env;

const models = require('./models');

class DB {
    constructor(path) {
        this.ready = false;
        // this.sequelize = new Sequelize({
        //     dialect: 'sqlite',
        //     storage: path
        // });
        this.sequelize = new Sequelize("hubs-development-db", DB_USER, DB_PASSWORD,{
            host: DB_HOST,
            logging: console.log,
            maxConcurrentQueries: 100,
            dialect: 'sqlite',
            dialectOptions: {
                ssl:'Amazon RDS'
            },
            pool: { maxConnections: 5, maxIdleTime: 30},
            language: 'en'
        });
        // cannot use async here :( 
        this.sequelize.authenticate().then(() => {
            try {
                this.bootstrap();
            } catch (e) {
                console.log(e);
            } finally {
                this.ready = true;
                console.log('Connection has been established successfully.')
            }

        }).catch(err => console.log(err))
        this.models = {};
    }

    createModel(name, definition) {
        if (Object.keys(this.models).includes(name)) {
            throw new Error(`${name} already exists in models`);
        }
        this.models[name] = this.sequelize.define(name, definition);
        return this.models[name]
    }

    bootstrap() {
        for (let modelName in models) {
            try {
                if (!models[modelName]) {
                    throw Error(`Invalid model ${modelName}`);
                }
                const model = this.createModel(modelName, models[modelName]);
                if (process.env.BOOTSTRAP_DB) {
                    // create in DB
                    model.sync({
                        alter: true
                    });
                }
            } catch (e) {
                console.log(e, {
                    models
                });
            }
        }
    }
    async query(entity, filter) {
        if (!this.ready) {
            throw new Error("Unable to connect to DB");
        }
        if (!Object.keys(this.models).includes(entity)) {
            throw new Error(`${entity} does not exist.}`)
        }
        if (!Object.keys(entity).length) {
            throw new Error("Empty queries not allowed. Use Entity.findAll()}");
        }
        return this.models[entity].findAll({
            where: filter
        });
    }

    async count(entity, filter) {
        if (!this.ready) {
            throw new Error("Unable to connect to DB");
        }
        if (!Object.keys(this.models).includes(entity)) {
            throw new Error(`${entity} does not exist.}`)
        }
        if (!Object.keys(entity).length) {
            throw new Error("Empty queries not allowed. Use Entity.findAll()}");
        }
        return this.models[entity].count({
            where: filter
        });
    }

}

module.exports = new DB(process.env.DB_PATH ? process.env.DB_PATH : "/tmp/sql.db");