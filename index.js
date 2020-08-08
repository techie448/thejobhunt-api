import dotenv from 'dotenv';
import firebaseDB from "./firebaseDB.js";
import github from "./github.js";
import adzuna from "./adzuna.js";
import glassdoor from "./glassdoor.js";
import indeed from "./indeed.js";
import linkedin from "./linkedin.js";
import algolia from "./algolia.js";
import {getDate} from "./utilities.js";
import workintech_api from "./workintech-aloglia-api.js"
import algoliasearch from "algoliasearch";
import Cron from 'cron';
import neuvoo from "./neuvoo.js";
import workpolis from "./workpolis.js";
import monster from "./monster.js";
import fs from 'fs';
dotenv.config()

const pushArrayToObject = (arr, obj) => arr.forEach(el => obj[el.id] = el);

const getResultsParallel = async ({results, testing, queries}) => {
    let maxParallel = 0;
    await Promise.all(queries.map(async query => {
        const promisesRun = await Promise.allSettled([
            github(testing, query),
            adzuna(testing, query),
            glassdoor(testing, query),
            indeed(testing, query),
            linkedin(testing, query),
            workintech_api(testing, query),
            neuvoo(testing, query),
            workpolis(testing, query),
            monster(testing, query),
            ]);
        const promises = promisesRun.filter(res=> res.status==='fulfilled').map(res=>res.value);
        const rejected = promisesRun.filter(res=> res.status==='rejected').forEach(res=>console.log(res.reason.config.url))
        const initial = Object.keys(results).length;
        let total = 0;
        promises.forEach(promise => {
            promise.forEach(el=>el.query = query)
            pushArrayToObject(promise, results)
            total+=promise.length;
        });
        maxParallel+=total;
        const final = Object.keys(results).length;
        // console.log({
        //     query,
        //     total,
        //     new : final - initial,
        //     duplicates : total - (final - initial),
        //     final
        // });
        return promises;
    }))
    console.log({maxParallel})


}

const getResults = async ({results, testing, queries}) => {
    let maxRegular = 0;
    for (const query of queries) {
        const promises = [
            await github(testing, query),
            await adzuna(testing, query),
            await glassdoor(testing, query),
            await indeed(testing, query),
            await linkedin(testing, query),
            await workintech_api(testing, query),
            await neuvoo(testing, query),
            await workpolis(testing, query),
            await monster(testing, query),
];



        promises.forEach(pr=>pr.forEach(el=>el.query = query));
        let streak = 0;
        const initial = Object.keys(results).length;
        let total = 0;
        promises.forEach(promise => {
            const initial = Object.keys(results).length;
            maxRegular += promise.length;
            pushArrayToObject(promise, results)
            const afterUpdate = Object.keys(results).length;
            total+=promise.length;
            if((afterUpdate - initial) === 0 && promise.length > 0) streak++;
            else streak = 0;
            if(streak>5) console.log({
                streak,
                source: promise[0].source,
                initial,
                afterUpdate,
                fetch : promise.length,
                diff : afterUpdate - initial
            })

        })
        const final = Object.keys(results).length;
        // console.log({
        //     total,
        //     new : final - initial,
        //     duplicates : total - (final - initial),
        //     final
        // });


    }
    console.log({maxRegular})
}

const deleteOldJobs = async (jobsCollectionRef, results) => {
    const snapshot = await jobsCollectionRef.get();
    const snapshotData = await snapshot.docs.map(doc => doc.data())
    console.log(`retrieved snapshot from firebase ${snapshotData.length}`)

    console.log(`deleting old jobs`)

    let batch = firebaseDB.batch()
let count = 0;
    for (const job of snapshotData) {
        if (!results.some(j => j.id === job.id)) {
            batch.delete(jobsCollectionRef.doc(job.id));
            count++;
            if(count===499 || job === snapshotData[snapshotData.length - 1]){
                count = 0;
                const committed = await batch.commit();
                console.log(committed)
                batch = firebaseDB.batch()

            }
        }
    }
}

const updateNewJobs = async (jobsCollectionRef, results) => {
console.log('starting batch')
    let batch = firebaseDB.batch()
    let count = 0;
    for (const result of results) {
        if(!result.id) result.id = jobsCollectionRef.doc().id;
        const docRef = jobsCollectionRef.doc(result.id);
        console.log(results.indexOf(result))
        batch.set(docRef, result);
        count++;
        if(count===499 || result === results[results.length - 1]){
            count = 0;
            const committed = await batch.commit();
            console.log(committed)
            batch = firebaseDB.batch()
        }
    }
}

const commitJobs = async (testing) => {

    const jobsCollectionRef = firebaseDB.collection("jobs");
let results = {};
let resultsParallel = {};


    const args = {
        results: results,
        testing: testing,
        queries: [
            'Software Engineer',
            'Software Developer',
            'Web Developer',
            // 'Web Software Developer',
            // 'Web Software engineer',
            'fullstack Developer',
            'javascript Developer',
            'Full stack Developer',
            'Front end Developer',
            'Back end Developer',
            // 'react developer',
            // 'react software developer',
            // 'react engineer',
            // 'react software engineer',
            // 'vue developer',
            // 'angular developer',
            // 'php developer',
            // 'wordpress developer',
            'java developer',
            // 'java software developer',
            // 'python developer',
            // 'django developer',
            // 'Junior Software Developer',
            // 'Junior fullstack Developer',
            // 'Junior Software Engineer',
            // 'Junior Developer',
        ]
    };
    // console.time('regular')
    // await getResults(args)
    // console.timeEnd('regular')
    console.time('parallel')
    await getResultsParallel({...args,
        // results: resultsParallel
    })
    console.timeEnd('parallel')
    console.log({
        regular : Object.keys(results).length,
        parallel : Object.keys(resultsParallel).length
    })

    const uniqueJobs = Object.values(results);

    uniqueJobs.forEach(job=>job.created = getDate(job.created))
    console.log({
        jobs: uniqueJobs.length,
        start: uniqueJobs[0].created,
        end: uniqueJobs[uniqueJobs.length-1].created
    })

    const dateLimitter = new Date();
    dateLimitter.setDate(dateLimitter.getDate() - 14);

    let finalJobs = uniqueJobs
        .filter(job => job.created >= dateLimitter)
        .sort((b,a) => a.created - b.created);
    console.log({
        jobs: finalJobs.length,
        start: finalJobs[0].created,
        end: finalJobs[finalJobs.length-1].created
    })

    // console.log(await fs.promises.writeFile('index.json',JSON.stringify(finalJobs), 'utf-8'));

     finalJobs = await removeDuplicates(finalJobs);

     finalJobs = await removeEmptyFields(finalJobs);

    const slicedJobs = finalJobs.slice(0,9999);
    console.log({
        jobs: slicedJobs.length,
        start: slicedJobs[0].created,
        end: slicedJobs[slicedJobs.length-1].created
    })

    // await deleteOldJobs(jobsCollectionRef, finalJobs)
    // await updateNewJobs(jobsCollectionRef, finalJobs)
    // await algolia(finalJobs)

    return finalJobs.length;


}

const transfer_from_algolia_to_firestore = async () => {
    let hits = [];

    const client = algoliasearch('KCCE701SC2', '719a29d1dfb3929dd72afd2b3c35c3ab');
    const index = client.initIndex('thejobhunt');
    await index.browseObjects({
        query: '', // Empty query will match all records
        batch: batch => {
            hits = hits.concat(batch);
        }
    }).then(() => {
        hits.forEach(hit=> delete hit.objectID)
        const jobsCollectionRef = firebaseDB.collection("jobs");
        deleteOldJobs(jobsCollectionRef, hits)
            .then(()=>
                updateNewJobs(jobsCollectionRef, hits)
                    .then(()=>
                        console.log('stored'))
    )
    });

// transfer_from_algolia_to_firestore().then( res => console.log(res)).catch(err => console.log(err))
}

const job = new Cron.CronJob(process.env.CRON, async () => {
        try{
            await commitJobs(false)
        }catch(err){
            console.log(err);
        }
    }, null, true, 'America/New_York');

// job.start()
const removeDuplicates = async (input) => {
    // input = input.slice(0,1000)
    console.log(input.length);
     input = input.reduce((unique, o) => {
        if(!unique.some(obj => {
            const tit = obj.title.trim() === o.title.trim()
            const com = obj.company.trim() === o.company.trim()
                || obj.company.toLowerCase().trim().includes(o.company.trim().toLowerCase())
                || o.company.toLowerCase().trim().includes(obj.company.trim().toLowerCase());
            const loc  = (obj.location.trim() === o.location.trim() ||
                obj.location.toLowerCase().trim().includes(o.location.trim().toLowerCase()) ||
                o.location.toLowerCase().trim().includes(obj.location.trim().toLowerCase())

            );
            const cond = tit && com && loc;
            // if(
            //    cond
            // ) console.log({
            //     id: obj.id,
            //     title: obj.title,
            //     company: obj.company,
            //     location: obj.location,
            //     apply: obj.apply
            // },{
            //     id: o.id,
            //     title: o.title,
            //     company: o.company,
            //     location: o.location,
            //     apply: o.apply
            //
            // })

            return cond
        })) {

            unique.push(o);
        }
        return unique;
    },[]);
     return input;
}

const removeEmptyFields = async (input) => {
    return input.filter(job => {
        let res = true;
        Object.keys(job).forEach(key => {
            if (job[key].length < 2) res = false;
        })
        return res;
    })
}
