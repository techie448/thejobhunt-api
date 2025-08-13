import dotenv from 'dotenv';
// import firebaseDB from "./firebaseDB.js";
import github from "./github.js";
import adzuna from "./adzuna.js";
import glassdoor from "./glassdoor.js";
import indeed from "./indeed.js";
import linkedin from "./linkedin.js";
import {getDate} from "./utilities.js";
import workintech_api from "./workintech-aloglia-api.js"
import { CronJob } from 'cron';
import neuvoo from "./neuvoo.js";
import workpolis from "./workpolis.js";
import monster from "./monster.js";
import algolia  from "./algolia.js";

dotenv.config()

const pushArrayToObject = (arr, obj) => arr.forEach((el,i) => obj[el.id+i+el.source] = el);

const withTimeout = async (promise, ms, label) => {
    let timeoutId;
    const timeoutPromise = new Promise((resolve) => {
        timeoutId = setTimeout(() => {
            console.log(`Timeout: ${label} exceeded ${ms}ms`);
            resolve([]);
        }, ms);
    });
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
};

const getResultsParallel = async ({results, testing, queries}) => {
let total = [];

    let maxParallel = 0;

    const runQuery = async (query) => {
        const calls = testing
            ? [
                adzuna(testing, query),
                workintech_api(testing, query),
                monster(testing, query),
              ]
            : [
                // github(testing, query),
                adzuna(testing, query),
                // glassdoor(testing, query),
                indeed(testing, query),
                linkedin(testing, query),
                workintech_api(testing, query),
                neuvoo(testing, query),
                workpolis(testing, query),
                monster(testing, query),
              ];
        const promisesRun = await Promise.allSettled(
            calls.map((c, i) => withTimeout(c, testing ? 12000 : 18000, `source_${i}_${query}`))
        );
        const promises = promisesRun.filter(res=> res.status==='fulfilled').map(res=>res.value);
        promises.forEach(promise => {
            promise.forEach(el=>el.query = query)
            pushArrayToObject(promise, results)
            total.push(...promise);
            maxParallel+=promise.length;
        });
    };

    const concurrency = testing ? 2 : 6;
    for (let i = 0; i < queries.length; i += concurrency) {
        const batch = queries.slice(i, i + concurrency);
        await Promise.all(batch.map(q => runQuery(q)));
    }

const temparr = {};
// pushArrayToObject(total, results);
    console.log({maxParallel, total:total.length, temparr: Object.keys(temparr).length})
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
            const res = tit && com && loc;
            // if(res) console.log({obj, o,
            // objt: obj.title,
            // ot:o.title,
            // objc:obj.company,
            // oc:o.company,
            // objl:obj.location,
            // ol:o.location
            // })
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
    // const jobsCollectionRef = firebaseDB.collection("jobs");
    let results = {};
    const args = {
        results: results,
        testing: testing,
        queries: testing ? [
            'react developer',
            'frontend developer'
        ] : [
            'frontend Engineer',
            'Senior Frontend Engineer',
            'frontend Developer',
            'Senior Frontend Developer',
            'front end Engineer',
            'front end Developer',
            'front-end Engineer',
            'front-end Developer',
            'Web Developer',
            'javascript developer',
            'react developer'
        ]
    };
    console.time()
    await getResultsParallel(args)
    console.timeEnd()
    console.log(`unique jobs`, Object.keys(results).length)
    let uniqueJobs = Object.values(results);
    uniqueJobs = uniqueJobs.filter(job => job.title && job.company && job.location);
    console.log(`removed empty objects`, uniqueJobs.length);

    console.log(uniqueJobs.length)
    uniqueJobs.forEach(job=>{
        job.created = getDate(job.created)
    })

    const dateLimit = new Date();
    const limit = 14;
    dateLimit.setDate(dateLimit.getDate() - limit);

    console.log(`removing jobs older than ${limit} days...`)
    let finalJobs = uniqueJobs
        .filter(job => job.created >= dateLimit)
        .sort((b,a) => a.created - b.created);
    console.log(finalJobs.length)
    // console.log('remove dups by apply')
    // finalJobs = finalJobs.filter((v,i,a)=>a.findIndex(v2=>(v2.apply===v.apply))===i)
    // console.log(finalJobs.length)
    console.log(`removing duplicates`)
    finalJobs = await removeDuplicates(finalJobs);
    console.log(finalJobs.length)

    console.log(`removing empty fields`)
    finalJobs = await removeEmptyFields(finalJobs);
    console.log(finalJobs.length)
    console.log(`slicing jobs if older than 9998`)
    if(finalJobs.length>9998) finalJobs = finalJobs.slice(0,9998);
    finalJobs.forEach((job,i)=> job.id = i);

    // await deleteOldJobs(jobsCollectionRef, finalJobs)
    // await updateNewJobs(jobsCollectionRef, finalJobs)
    const countsBySource = finalJobs.reduce((acc, job) => {
        const sourceKey = job.source || 'Unknown';
        acc[sourceKey] = (acc[sourceKey] || 0) + 1;
        return acc;
    }, {});
    const sourcesMeetingMin = Object.values(countsBySource).filter(c => c >= 25).length;
    const meetsThreshold = finalJobs.length >= 1000 && sourcesMeetingMin >= 5;

    console.log({ totalJobs: finalJobs.length, countsBySource, sourcesMeetingMin, meetsThreshold });

    if (testing) {
        console.log('Testing run: skipping Algolia write.');
    } else if (meetsThreshold) {
        await algolia(finalJobs)
    } else {
        console.log('Algolia write skipped: thresholds not met.');
    }

    return finalJobs.length;


}

const job = new CronJob("50 22 * * *", async () => {
        try{
            await commitJobs(false)
        }catch(err){
            console.log(err);
        }
    }, null, true, 'America/Vancouver');

// job.start()
const isTesting = process.env.TEST_RUN === '1';
commitJobs(isTesting).then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });