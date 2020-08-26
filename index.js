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

const getResults = async ({results, testing, queries}) => {
    let max = 0;
    for (const query of queries) {
        const queryResult = [...await github(testing, query),
                ...await adzuna(testing, query),
            ...await glassdoor(testing, query),
            ...await indeed(testing, query),
            ...await linkedin(testing, query),
            ...await workintech_api(testing, query),
            ...await neuvoo(testing, query),
            ...await workpolis(testing, query),
            ...await monster(testing, query),
    ]
        queryResult.forEach(el=>el.query = query)
        pushArrayToObject(queryResult, results)
            max+=queryResult.length;
        };
    console.log({max})
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
            'Junior Software Engineer',
            'Senior Software Engineer',
            'Software Developer',
            'Junior Software Developer',
            'Web Developer',
            'Junior Web Developer',
            'Senior Web Developer',
            'Web Software Developer',
            'Junior Web Software Developer',
            'Senior Web Software Developer',
            'Junior Web Software engineer',
            'Senior Web Software engineer',
            'Full stack Developer',
            'junior Full stack Developer',
            'senior Full stack Developer',
            'fullstack Developer',
            'junior fullstack Developer',
            'senior fullstack Developer',
            'javascript Developer',
            'Front end Developer',
            'junior Front end Developer',
            'senior Front end Developer',
            'Back end Developer',
            'junior Back end Developer',
            'senior Back end Developer',
            'Frontend Developer',
            'junior Frontend Developer',
            'senior Frontend Developer',
            'Backend Developer',
            'junior Backend Developer',
            'senior Backend Developer',
            'java developer',
            'junior java developer',
            'senior java developer',
            'java engineer',
            'junior java engineer',
            'senior java engineer',
            'java software engineer',
            'junior java software engineer',
            'senior java software engineer',
            'java software developer',
            'junior java software developer',
            'senior java software developer',
            'senior Software Developer',
        ]
    };
    console.time()
    await getResults(args)
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

// const job = new Cron.CronJob(process.env.CRON, async () => {
        try{
            await commitJobs(false)
        }catch(err){
            console.log(err);
        }
    // }, null, true, 'America/New_York');

// job.start()
