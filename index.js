import dotenv from 'dotenv';
import firebaseDB from "./firebaseDB.js";
import github from "./github.js";
import adzuna from "./adzuna.js";
import glassdoor from "./glassdoor.js";
import indeed from "./indeed.js";
import linkedin from "./linkedin.js";
import {getDate} from "./utilities.js";
import workintech_api from "./workintech-aloglia-api.js"
import Cron from 'cron';
import neuvoo from "./neuvoo.js";
import workpolis from "./workpolis.js";
import monster from "./monster.js";
import algolia  from "./algolia.js";

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

const commitJobs = async (testing) => {
    const jobsCollectionRef = firebaseDB.collection("jobs");
    let results = {};
    const args = {
        results: results,
        testing: testing,
        queries: [
            'Software Engineer',
            'Software Developer',
            'Full stack Developer',
            'java developer',
            'Junior Developer',
        ]
    };
    console.time()
    await getResultsParallel(args)
    console.timeEnd()

    const uniqueJobs = Object.values(results);
    console.log(uniqueJobs.length)

    uniqueJobs.forEach(job=>job.created = getDate(job.created))

    const dateLimit = new Date();
    const limit = 14;
    dateLimit.setDate(dateLimit.getDate() - limit);

    console.log(`removing jobs older than ${limit} days...`)
    let finalJobs = uniqueJobs
        .filter(job => job.created >= dateLimit)
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

    await deleteOldJobs(jobsCollectionRef, finalJobs)
    await updateNewJobs(jobsCollectionRef, finalJobs)
    await algolia(finalJobs)

    return finalJobs.length;


}
commitJobs(false)
