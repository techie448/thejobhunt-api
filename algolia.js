import algoliasearch from 'algoliasearch';

// const client = algoliasearch('KCCE701SC2', '719a29d1dfb3929dd72afd2b3c35c3ab');
// const client = algoliasearch('PQEI9KMKMK', 'ec2ecd4be7ffea11ddd5a9d2aec016c1');
// const client = algoliasearch('Z0AS05R0TG', '4a9f6a50e94a62f3891c0611584047ed');
const client = algoliasearch('6NFL8BBB5W', '18904986938941d462938b02557789e9');
const index = client.initIndex('thejobhunt');

export default async (input) => {
        console.log(`updating algolia`)
        console.log(await index.replaceAllObjects(input.map(job=>({objectID: job.id, ...job}))));
}
