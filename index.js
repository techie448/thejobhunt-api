import dotenv from 'dotenv';
import firebaseDB from "./firebaseDB.js";
import github from "./github.js";
import adzuna from "./adzuna.js";
import glassdoor from "./glassdoor.js";
import indeed from "./indeed.js";
import linkedin from "./linkedin.js";
import {getDate} from "./utilities.js";
import workintech_api from "./workintech-aloglia-api.js"
import algoliasearch from "algoliasearch";
import Cron from 'cron';
import neuvoo from "./neuvoo.js";
import workpolis from "./workpolis.js";
import monster from "./monster.js";

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
        promisesRun.filter(res=> res.status==='rejected').forEach(res=>console.log(`ERROR: ${res.reason.config.url}`))
        promises.forEach(promise => {
            promise.forEach(el=>el.query = query)
            pushArrayToObject(promise, results)
            maxParallel+=promise.length;
        });
        return promises;
    }))
    console.log({maxParallel})
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
                await batch.commit();
                batch = firebaseDB.batch();
            }
        }
    }
}

const updateNewJobs = async (jobsCollectionRef, results) => {
console.log('updating new jobs to firebase')
    let batch = firebaseDB.batch()
    let count = 0;
    for (const result of results) {
        if(!result.id) result.id = jobsCollectionRef.doc().id;
        const docRef = jobsCollectionRef.doc(result.id);
        batch.set(docRef, result);
        count++;
        if(count===499 || result === results[results.length - 1]){
            count = 0;
            await batch.commit();
            batch = firebaseDB.batch()
        }
    }
}

const commitJobs = async (testing) => {
    const jobsCollectionRef = firebaseDB.collection("jobs");
    let results = {};
    const args = {
        results: results,
        testing: testing,
        queries: [
            'Software Engineer',
            'Software Developer',
            'Web Developer',
            'Web Software Developer',
            'Web Software engineer',
            'fullstack Developer',
            'javascript Developer',
            'Full stack Developer',
            'Front end Developer',
            'Back end Developer',
            'react developer',
            'react software developer',
            'react engineer',
            'react software engineer',
            'vue developer',
            'angular developer',
            'php developer',
            'wordpress developer',
            'java developer',
            'java software engineer',
            'java software developer',
            'python developer',
            'django developer',
            'Junior Software Developer',
            'Junior fullstack Developer',
            'Junior Software Engineer',
            'Junior Developer',
        ]
    };
    console.time()
    await getResultsParallel(args)
    console.timeEnd()

    const uniqueJobs = Object.values(results);
    console.log(uniqueJobs.length)

    uniqueJobs.forEach(job=>job.created = getDate(job.created))

    const dateLimitter = new Date();
    const delimitter = 14;
    dateLimitter.setDate(dateLimitter.getDate() - delimitter);

    console.log(`removing jobs older than ${delimitter} days...`)
    let finalJobs = uniqueJobs
        .filter(job => job.created >= dateLimitter)
        .sort((b,a) => a.created - b.created);
    console.log(finalJobs.length)
    console.log(`removing duplicates`)
     finalJobs = await removeDuplicates(finalJobs);
    console.log(finalJobs.length)
    console.log(`removing empty fields`)
    finalJobs = await removeEmptyFields(finalJobs);
    console.log(finalJobs.length)
    console.log(`slicing jobs if older than 9998`)
    if(finalJobs.length>9998) finalJobs = finalJobs.slice(0,9998);

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
            return tit && com && loc
        })) unique.push(o);
        return unique;
    },[]);
    return input;
}

const removeEmptyFields = async (input) => {
    return input.filter(job => {
        let res = true;
        Object.keys(job).forEach(key => {
            if (!job[key] || job[key].length < 2) res = false;
        })
        return res;
    })
}

commitJobs(false).then(res=>console.log(res))
