import algoliasearch from 'algoliasearch';

// const client = algoliasearch('KCCE701SC2', '719a29d1dfb3929dd72afd2b3c35c3ab');
// const client = algoliasearch('PQEI9KMKMK', 'ec2ecd4be7ffea11ddd5a9d2aec016c1');
// const client = algoliasearch('Z0AS05R0TG', '4a9f6a50e94a62f3891c0611584047ed');
const client = algoliasearch('2LB3LAKQMV', 'e617e5c1e2ee1e4eaa925d2b4b89c7fd');
const index = client.initIndex('thejobhunt');

export default async (input) => {
        console.log(`updating algolia`)
        console.log(await index.replaceAllObjects(input.map(job=>({objectID: job.id, ...job}))));
}
