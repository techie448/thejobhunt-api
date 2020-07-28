import algoliasearch from 'algoliasearch';

const client = algoliasearch('KCCE701SC2', '719a29d1dfb3929dd72afd2b3c35c3ab');
const index = client.initIndex('thejobhunt');

export default async (input) => {
        console.log(`updating algolia`)
        console.log(await index.replaceAllObjects(input.map(job=>({objectID: job.id, ...job}))));
}
